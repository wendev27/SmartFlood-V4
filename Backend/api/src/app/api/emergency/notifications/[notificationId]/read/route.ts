import { NextRequest, NextResponse } from "next/server";
import { assignedBarangayForUser } from "@/lib/barangayScope";
import { logAuditEvent } from "@/lib/auditLogger";
import { auditActorForViewer, dashboardViewerRole, getDashboardViewer } from "@/lib/dashboardViewer";
import { supabaseServer } from "@/lib/supabaseServer";

type RouteContext = {
  params: Promise<{ notificationId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    if (role !== "barangay") {
      return NextResponse.json({ success: false, error: "Only barangay users can mark barangay emergency notifications as read." }, { status: 403 });
    }

    const { notificationId } = await context.params;
    const notification = await getNotification(notificationId);
    if (!notification) {
      return NextResponse.json({ success: false, error: "Emergency notification was not found." }, { status: 404 });
    }
    if (!canAccessBarangayNotification(viewer, notification)) {
      return NextResponse.json({ success: false, error: "You do not have access to this emergency notification." }, { status: 403 });
    }

    const currentStatus = String(notification.status ?? "");
    if (currentStatus === "read" || currentStatus === "accepted" || currentStatus === "rejected") {
      return NextResponse.json({ success: true, data: notification, already_read: currentStatus !== "read" });
    }
    if (currentStatus !== "pending" && currentStatus !== "sent") {
      return NextResponse.json({ success: false, error: `Notification status ${currentStatus} cannot be marked read.` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseServer
      .from("notifications")
      .update({ status: "read", read_at: now, accepted_at: null, rejected_at: null })
      .eq("notification_id", notificationId)
      .in("status", ["pending", "sent"])
      .select("notification_id,type,target_type,target_barangay_id,source_type,source_id,title,message,status,read_at,accepted_at,rejected_at,created_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: true, data: await getNotification(notificationId), already_read: true });
    }

    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "BARANGAY_NOTIFICATION_READ",
      module: "Emergency Relief Notification",
      description: `Read emergency relief notification ${notificationId}.`,
      target_type: "notification",
      target_id: notificationId,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to mark emergency notification as read." }, { status: 500 });
  }
}

async function getNotification(notificationId: string) {
  const { data, error } = await supabaseServer
    .from("notifications")
    .select("notification_id,type,target_type,target_barangay_id,source_type,source_id,title,message,status,read_at,accepted_at,rejected_at,created_at")
    .eq("notification_id", notificationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

function canAccessBarangayNotification(viewer: Record<string, unknown>, notification: Record<string, unknown>) {
  const barangay = assignedBarangayForUser(viewer);
  return Boolean(
    barangay
      && notification.target_type === "barangay"
      && Number(notification.target_barangay_id) === barangay.barangay_id,
  );
}
