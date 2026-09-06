import type { EmergencyNotification } from "@/types/emergency";

export interface NotificationRow {
  id: string;
  title: string;
  message: string;
  unread: boolean;
  category: "Relief" | null;
  isAllocation: boolean;
}

/** This endpoint contains barangay notifications, not personal flood/system event history. */
export function notificationPresentation(records: readonly EmergencyNotification[]): NotificationRow[] {
  return records.filter((row) => Boolean(row.notification_id)).map((row) => ({
    id: row.notification_id,
    title: row.title || "Notification",
    message: row.message,
    unread: row.status === "pending" || row.status === "sent",
    category: row.source_type === "emergency_allocation_item" || row.type === "EMERGENCY_RELIEF_ALLOCATION" ? "Relief" : null,
    isAllocation: row.source_type === "emergency_allocation_item",
  }));
}
