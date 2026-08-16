import { NextRequest, NextResponse } from "next/server";
import { assignedBarangayForUser } from "@/lib/barangayScope";
import { logAuditEvent } from "@/lib/auditLogger";
import { auditActorForViewer, dashboardViewerRole, getDashboardViewer } from "@/lib/dashboardViewer";
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
    if (role !== "barangay") {
      return NextResponse.json({ success: false, error: "Only barangay users can accept barangay emergency allocations." }, { status: 403 });
    }

    const { itemId } = await context.params;
    const barangay = assignedBarangayForUser(viewer);
    if (!barangay) {
      return NextResponse.json({ success: false, error: "Your account is not assigned to a barangay." }, { status: 403 });
    }

    const item = await getAllocationItem(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Emergency allocation item was not found." }, { status: 404 });
    }
    if (Number(item.barangay_id) !== barangay.barangay_id) {
      return NextResponse.json({ success: false, error: "You do not have access to this emergency allocation item." }, { status: 403 });
    }
    if (item.barangay_status === "accepted") {
      return NextResponse.json({ success: true, data: { allocation_item: item, notification: await getItemNotification(item) }, already_accepted: true });
    }
    if (item.barangay_status !== "notified") {
      return NextResponse.json({ success: false, error: `Allocation status ${item.barangay_status} cannot be accepted.` }, { status: 400 });
    }

    const notification = await getItemNotification(item);
    if (!notification) {
      return NextResponse.json({ success: false, error: "The matching emergency notification was not found." }, { status: 404 });
    }
    if (notification.status === "rejected") {
      return NextResponse.json({ success: false, error: "A rejected notification cannot accept an allocation." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: updatedItem, error: itemError } = await supabaseServer
      .from("emergency_allocation_items")
      .update({ barangay_status: "accepted", accepted_at: now, rejected_at: null })
      .eq("item_id", itemId)
      .eq("barangay_status", "notified")
      .select("item_id,batch_id,barangay_id,barangay_name,family_food_packs,individual_relief_goods,emergency_kits,barangay_status,accepted_at,rejected_at,created_at")
      .maybeSingle();

    if (itemError) {
      return NextResponse.json({ success: false, error: itemError.message }, { status: 500 });
    }
    if (!updatedItem) {
      return NextResponse.json({ success: false, error: "Allocation item was already changed. Refresh and try again." }, { status: 409 });
    }

    const { data: updatedNotification, error: notificationError } = await supabaseServer
      .from("notifications")
      .update({ status: "accepted", read_at: notification.read_at ?? now, accepted_at: now, rejected_at: null })
      .eq("notification_id", notification.notification_id)
      .in("status", ["pending", "sent", "read"])
      .select("notification_id,type,target_type,target_barangay_id,source_type,source_id,title,message,status,read_at,accepted_at,rejected_at,created_at")
      .maybeSingle();

    if (notificationError || !updatedNotification) {
      await rollbackItemToNotified(itemId);
      return NextResponse.json({ success: false, error: notificationError?.message ?? "Notification was already changed. Allocation acceptance was rolled back." }, { status: notificationError ? 500 : 409 });
    }

    const batch = await getBatch(String(updatedItem.batch_id));
    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "BARANGAY_ALLOCATION_ACCEPTED",
      module: "Emergency Relief Notification",
      description: `${barangay.barangay_name} accepted allocation item ${itemId} for batch ${String(updatedItem.batch_id)}: ${Number(updatedItem.family_food_packs)} food packs, ${Number(updatedItem.individual_relief_goods)} individual relief goods, ${Number(updatedItem.emergency_kits)} emergency kits.`,
      target_type: "emergency_allocation_item",
      target_id: itemId,
      barangay_id: barangay.barangay_id,
      barangay_name: barangay.barangay_name,
    });

    return NextResponse.json({
      success: true,
      data: {
        allocation_item: updatedItem,
        notification: { ...updatedNotification, allocation_item: updatedItem, batch },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to accept emergency allocation." }, { status: 500 });
  }
}

async function getAllocationItem(itemId: string) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_items")
    .select("item_id,batch_id,barangay_id,barangay_name,family_food_packs,individual_relief_goods,emergency_kits,barangay_status,accepted_at,rejected_at,created_at")
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
  return data as Record<string, unknown> | null;
}

async function getBatch(batchId: string) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_batches")
    .select("batch_id,plan_id,plan_name,status,created_at,accepted_at")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function rollbackItemToNotified(itemId: string) {
  await supabaseServer
    .from("emergency_allocation_items")
    .update({ barangay_status: "notified", accepted_at: null, rejected_at: null })
    .eq("item_id", itemId)
    .eq("barangay_status", "accepted");
}
