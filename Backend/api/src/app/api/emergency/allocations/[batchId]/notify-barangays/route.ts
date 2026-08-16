import { NextRequest, NextResponse } from "next/server";
import { auditActorForViewer, dashboardViewerRole, getDashboardViewer } from "@/lib/dashboardViewer";
import { logAuditEvent } from "@/lib/auditLogger";
import { supabaseServer } from "@/lib/supabaseServer";

type RouteContext = {
  params: Promise<{ batchId: string }>;
};

const alreadyNotifiedStatuses = ["barangays_notified", "in_distribution"];
const terminalStatuses = ["rejected", "expired", "closed", "completed"];

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    if (role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to notify barangays." }, { status: 403 });
    }

    const { batchId } = await context.params;
    if (!batchId) {
      return NextResponse.json({ success: false, error: "Emergency allocation batch is required." }, { status: 400 });
    }

    const batch = await getBatch(batchId);
    if (!batch) {
      return NextResponse.json({ success: false, error: "Emergency allocation batch was not found." }, { status: 404 });
    }
    if (terminalStatuses.includes(String(batch.status))) {
      return NextResponse.json({ success: false, error: `Campaign status ${batch.status} cannot notify barangays.` }, { status: 400 });
    }
    if (alreadyNotifiedStatuses.includes(String(batch.status))) {
      return NextResponse.json({
        success: true,
        data: await getBatchWithItems(batchId),
        notifications_created: 0,
        already_notified: true,
      });
    }
    if (batch.status !== "accepted") {
      return NextResponse.json({ success: false, error: `Batch status ${batch.status} cannot notify barangays.` }, { status: 400 });
    }

    const items = await getBatchItems(batchId);
    const eligibleItems = items.filter((item) => String(item.barangay_status) === "pending");
    const existingNotificationIds = await existingNotificationSourceIds(eligibleItems.map((item) => String(item.item_id)));
    const itemsNeedingNotifications = eligibleItems.filter((item) => !existingNotificationIds.has(String(item.item_id)));

    if (itemsNeedingNotifications.length > 0) {
      const { error: insertError } = await supabaseServer
        .from("notifications")
        .insert(itemsNeedingNotifications.map((item) => notificationPayload(batch, item)));

      if (insertError) {
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
      }
    }

    if (eligibleItems.length > 0) {
      const { error: itemUpdateError } = await supabaseServer
        .from("emergency_allocation_items")
        .update({ barangay_status: "notified" })
        .eq("batch_id", batchId)
        .eq("barangay_status", "pending");

      if (itemUpdateError) {
        return NextResponse.json({ success: false, error: itemUpdateError.message }, { status: 500 });
      }
    }

    const { error: batchUpdateError } = await supabaseServer
      .from("emergency_allocation_batches")
      .update({ status: "barangays_notified" })
      .eq("batch_id", batchId)
      .eq("status", "accepted");

    if (batchUpdateError) {
      return NextResponse.json({ success: false, error: batchUpdateError.message }, { status: 500 });
    }

    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "BARANGAY_NOTIFICATION_CREATED",
      module: "AI-Optimized Relief Recommendation",
      description: `Created barangay allocation notifications for batch ${batchId} using ${batch.plan_name}; ${itemsNeedingNotifications.length} barangays notified.`,
      target_type: "emergency_allocation_batch",
      target_id: batchId,
    });

    return NextResponse.json({
      success: true,
      data: await getBatchWithItems(batchId),
      notifications_created: itemsNeedingNotifications.length,
      already_notified: false,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to notify barangays." }, { status: 500 });
  }
}

async function getBatch(batchId: string) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_batches")
    .select("batch_id,plan_id,plan_name,status,created_at,accepted_at,started_at,expires_at,closed_at,closure_reason")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

async function getBatchItems(batchId: string) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_items")
    .select("item_id,batch_id,recommendation_id,barangay_id,barangay_name,family_food_packs,individual_relief_goods,emergency_kits,barangay_status,created_at")
    .eq("batch_id", batchId)
    .order("barangay_id", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

async function getBatchWithItems(batchId: string) {
  const batch = await getBatch(batchId);
  if (!batch) return null;
  return {
    ...batch,
    items: await getBatchItems(batchId),
  };
}

async function existingNotificationSourceIds(itemIds: string[]) {
  if (itemIds.length === 0) return new Set<string>();
  const { data, error } = await supabaseServer
    .from("notifications")
    .select("source_id")
    .eq("source_type", "emergency_allocation_item")
    .in("source_id", itemIds);

  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((row: Record<string, unknown>) => String(row.source_id)).filter(Boolean));
}

function notificationPayload(batch: Record<string, unknown>, item: Record<string, unknown>) {
  const barangayName = String(item.barangay_name ?? "barangay");
  const food = Number(item.family_food_packs ?? 0);
  const goods = Number(item.individual_relief_goods ?? 0);
  const kits = Number(item.emergency_kits ?? 0);

  return {
    type: "EMERGENCY_RELIEF_ALLOCATION",
    target_type: "barangay",
    target_user_id: null,
    target_barangay_id: Number(item.barangay_id),
    target_family_id: null,
    source_type: "emergency_allocation_item",
    source_id: String(item.item_id),
    title: "Emergency Relief Allocation Notice",
    message: `${barangayName} has an approved emergency relief allocation under the ${String(batch.plan_name)} strategy: ${food} family food packs, ${goods} individual relief goods, and ${kits} emergency kits. Barangay officials must review and accept or reject this allocation before receipt confirmation.`,
    status: "pending",
    read_at: null,
    accepted_at: null,
    rejected_at: null,
  };
}
