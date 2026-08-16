import { NextRequest, NextResponse } from "next/server";
import { assignedBarangayForUser } from "@/lib/barangayScope";
import { logAuditEvent } from "@/lib/auditLogger";
import { auditActorForViewer, dashboardViewerRole, getDashboardViewer, type DashboardViewer } from "@/lib/dashboardViewer";
import { getCampaign, reconcileCampaignDistributionReadiness } from "@/lib/emergencyCampaigns";
import { supabaseServer } from "@/lib/supabaseServer";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

type EligibleFamily = {
  family_id: string;
  family_name?: string | null;
  family_head_id?: string | null;
  family_head_name?: string | null;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    if (role !== "barangay" && role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to notify family heads." }, { status: 403 });
    }

    const { itemId } = await context.params;
    const item = await getAllocationItem(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Emergency allocation item was not found." }, { status: 404 });
    }

    const scopeError = validateItemScope(viewer, role, item);
    if (scopeError) return scopeError;

    const status = String(item.barangay_status ?? "");
    if (status === "family_heads_notified" || status === "completed") {
      const campaignTransition = await transitionCampaignToDistributionIfReady(String(item.batch_id), viewer);
      return NextResponse.json({
        success: true,
        data: {
          allocation_item: item,
          notification: await getItemNotification(item),
          notifications_created: 0,
          already_notified: true,
          campaign_started: campaignTransition.started,
          campaign: campaignTransition.campaign,
        },
      });
    }
    if (status !== "receipt_confirmed") {
      return NextResponse.json({ success: false, error: `Family heads can only be notified after receipt confirmation. Current status is ${status}.` }, { status: 400 });
    }

    const eligibleFamilies = await getEligibleFamilies(Number(item.barangay_id));
    const existingFamilyIds = await getExistingFamilyNotificationIds(itemId, eligibleFamilies.map((family) => family.family_id));
    const familiesToNotify = eligibleFamilies.filter((family) => !existingFamilyIds.has(family.family_id));

    if (familiesToNotify.length > 0) {
      const { error: insertError } = await supabaseServer
        .from("notifications")
        .insert(familiesToNotify.map((family) => familyNotificationPayload(item, family)));

      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
    }

    const { data: updatedItem, error: updateError } = await supabaseServer
      .from("emergency_allocation_items")
      .update({ barangay_status: "family_heads_notified" })
      .eq("item_id", itemId)
      .eq("barangay_status", "receipt_confirmed")
      .select(itemSelect)
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }
    if (!updatedItem) {
      return NextResponse.json({ success: false, error: "Allocation item was already changed. Refresh and try again." }, { status: 409 });
    }

    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "FAMILY_HEAD_NOTIFICATION_CREATED",
      module: "Emergency Relief",
      description: `${String(updatedItem.barangay_name)} notified ${familiesToNotify.length} eligible families for emergency relief distribution from allocation item ${itemId}.`,
      target_type: "emergency_allocation_item",
      target_id: itemId,
      barangay_id: Number(updatedItem.barangay_id),
      barangay_name: String(updatedItem.barangay_name),
    });

    const campaignTransition = await transitionCampaignToDistributionIfReady(String(updatedItem.batch_id), viewer);

    return NextResponse.json({
      success: true,
      data: {
        allocation_item: updatedItem,
        notification: await getItemNotification(updatedItem),
        notifications_created: familiesToNotify.length,
        eligible_families: eligibleFamilies.length,
        already_notified: false,
        campaign_started: campaignTransition.started,
        campaign: campaignTransition.campaign,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to notify family heads." }, { status: 500 });
  }
}

const itemSelect = "item_id,batch_id,barangay_id,barangay_name,family_food_packs,individual_relief_goods,emergency_kits,barangay_status,accepted_at,rejected_at,receipt_confirmed_at,created_at";

async function getAllocationItem(itemId: string) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_items")
    .select(itemSelect)
    .eq("item_id", itemId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

async function getEligibleFamilies(barangayId: number): Promise<EligibleFamily[]> {
  const { data: families, error: familyError } = await supabaseServer
    .from("families")
    .select("family_id,family_name,family_head_id,family_head_name,barangay_id,barangay_name")
    .eq("barangay_id", barangayId);

  if (familyError) throw new Error(familyError.message);

  const familyIds = (families ?? []).map((family: Record<string, unknown>) => String(family.family_id ?? "")).filter(Boolean);
  const familiesWithResidentHeads = new Set<string>();

  if (familyIds.length > 0) {
    const { data: residentHeads, error: residentError } = await supabaseServer
      .from("residents_v3")
      .select("resident_id,family_id,is_family_head,status")
      .in("family_id", familyIds)
      .eq("is_family_head", true)
      .or("status.is.null,status.neq.inactive");

    if (residentError) throw new Error(residentError.message);
    for (const resident of residentHeads ?? []) {
      const familyId = String((resident as Record<string, unknown>).family_id ?? "");
      if (familyId) familiesWithResidentHeads.add(familyId);
    }
  }

  return (families ?? [])
    .map((family: Record<string, unknown>) => ({
      family_id: String(family.family_id ?? ""),
      family_name: stringifyOrNull(family.family_name),
      family_head_id: stringifyOrNull(family.family_head_id),
      family_head_name: stringifyOrNull(family.family_head_name),
    }))
    .filter((family: EligibleFamily) => family.family_id && (family.family_head_id || familiesWithResidentHeads.has(family.family_id)));
}

async function getExistingFamilyNotificationIds(itemId: string, familyIds: string[]) {
  if (familyIds.length === 0) return new Set<string>();

  const { data, error } = await supabaseServer
    .from("notifications")
    .select("target_family_id")
    .eq("type", "EMERGENCY_RELIEF_DISTRIBUTION")
    .eq("target_type", "family")
    .eq("source_type", "emergency_allocation_item")
    .eq("source_id", itemId)
    .in("target_family_id", familyIds);

  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row: Record<string, unknown>) => String(row.target_family_id ?? "")).filter(Boolean));
}

async function getItemNotification(item: Record<string, unknown>) {
  const { data, error } = await supabaseServer
    .from("notifications")
    .select("notification_id,type,target_type,target_barangay_id,source_type,source_id,title,message,status,read_at,accepted_at,rejected_at,created_at")
    .eq("target_type", "barangay")
    .eq("target_barangay_id", Number(item.barangay_id))
    .eq("source_type", "emergency_allocation_item")
    .eq("source_id", String(item.item_id))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? { ...data, allocation_item: item } : null;
}

function familyNotificationPayload(item: Record<string, unknown>, family: EligibleFamily) {
  return {
    type: "EMERGENCY_RELIEF_DISTRIBUTION",
    target_type: "family",
    target_user_id: null,
    target_barangay_id: null,
    target_family_id: family.family_id,
    source_type: "emergency_allocation_item",
    source_id: String(item.item_id),
    title: "Emergency Relief Distribution",
    message: "Your family has been included in the emergency relief distribution for your barangay. Please wait for the official distribution schedule and bring the required identification.",
    status: "pending",
    read_at: null,
    accepted_at: null,
    rejected_at: null,
  };
}

function validateItemScope(viewer: DashboardViewer, role: string | null, item: Record<string, unknown>) {
  if (role !== "barangay") return null;

  const barangay = assignedBarangayForUser(viewer);
  if (!barangay) {
    return NextResponse.json({ success: false, error: "Your account is not assigned to a barangay." }, { status: 403 });
  }
  if (Number(item.barangay_id) !== barangay.barangay_id) {
    return NextResponse.json({ success: false, error: "You do not have access to this emergency allocation item." }, { status: 403 });
  }
  return null;
}

async function transitionCampaignToDistributionIfReady(batchId: string, viewer: DashboardViewer) {
  const campaign = await getCampaign(batchId);
  if (!campaign) return { started: false, campaign: null };
  const transitioned = await reconcileCampaignDistributionReadiness(campaign, viewer);
  return { started: transitioned.status === "in_distribution" && campaign.status !== "in_distribution", campaign: transitioned };
}

function stringifyOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
