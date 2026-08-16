import { NextRequest, NextResponse } from "next/server";
import { assignedBarangayForUser } from "@/lib/barangayScope";
import { logAuditEvent } from "@/lib/auditLogger";
import { auditActorForViewer, dashboardViewerRole, getDashboardViewer, type DashboardViewer } from "@/lib/dashboardViewer";
import { supabaseServer } from "@/lib/supabaseServer";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    if (role !== "barangay" && role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to confirm emergency relief receipt." }, { status: 403 });
    }

    const { itemId } = await context.params;
    const item = await getAllocationItem(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Emergency allocation item was not found." }, { status: 404 });
    }

    const scopeError = validateItemScope(viewer, role, item);
    if (scopeError) return scopeError;

    const status = String(item.barangay_status ?? "");
    if (status !== "accepted") {
      return NextResponse.json({ success: false, error: `Only accepted allocations can be receipt-confirmed. Current status is ${status}.` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: updatedItem, error } = await supabaseServer
      .from("emergency_allocation_items")
      .update({ barangay_status: "receipt_confirmed", receipt_confirmed_at: now })
      .eq("item_id", itemId)
      .eq("barangay_status", "accepted")
      .select(itemSelect)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    if (!updatedItem) {
      return NextResponse.json({ success: false, error: "Allocation item was already changed. Refresh and try again." }, { status: 409 });
    }

    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "BARANGAY_RECEIPT_CONFIRMED",
      module: "Emergency Relief / Distribution",
      description: `${String(updatedItem.barangay_name)} confirmed physical receipt of approved emergency relief allocation ${itemId}.`,
      target_type: "emergency_allocation_item",
      target_id: itemId,
      barangay_id: Number(updatedItem.barangay_id),
      barangay_name: String(updatedItem.barangay_name),
    });

    return NextResponse.json({
      success: true,
      data: {
        allocation_item: updatedItem,
        notification: await getItemNotification(updatedItem),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to confirm emergency relief receipt." }, { status: 500 });
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
