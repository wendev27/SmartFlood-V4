import type { NextRequest } from "next/server";
import { displayRoleNames, fallbackBarangays, roleNames } from "@/lib/appUserMapping";
import { getDashboardSessionUserId } from "@/lib/dashboardSession";
import { normalizeLogRole, type LogRole } from "@/lib/logVisibility";
import { supabaseServer } from "@/lib/supabaseServer";

export type DashboardViewer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number | null;
  role_name: string;
  role_label: string;
  barangay_id: number | null;
  barangay_name: string;
  barangay: string;
};

export async function getDashboardViewer(req: NextRequest): Promise<DashboardViewer | null> {
  const userId = getDashboardSessionUserId(req);
  if (!userId) return null;

  const { data, error } = await supabaseServer
    .from("app_users")
    .select("id,first_name,last_name,email,role_id,barangay_id,barangay,status")
    .eq("id", userId)
    .single();

  if (error || !data || String(data.status ?? "").toLowerCase() !== "active") return null;

  const roleId = data.role_id == null ? null : Number(data.role_id);
  const barangayId = data.barangay_id == null ? null : Number(data.barangay_id);
  const barangayName = String(data.barangay ?? fallbackBarangays[Number(barangayId)] ?? "");
  return {
    id: String(data.id),
    first_name: String(data.first_name ?? ""),
    last_name: String(data.last_name ?? ""),
    email: String(data.email ?? ""),
    role_id: roleId,
    role_name: roleNames[Number(roleId)] ?? "",
    role_label: displayRoleNames[Number(roleId)] ?? "",
    barangay_id: barangayId,
    barangay_name: barangayName,
    barangay: barangayName,
  };
}

export function dashboardViewerRole(viewer: DashboardViewer | null | undefined): LogRole | null {
  return normalizeLogRole(viewer);
}

export function auditActorForViewer(viewer: DashboardViewer) {
  return {
    actor_user_id: viewer.id,
    actor_name: [viewer.first_name, viewer.last_name].filter(Boolean).join(" ") || viewer.email || "Unknown user",
    actor_role: viewer.role_label,
    barangay_id: viewer.barangay_id,
    barangay_name: viewer.barangay_name,
  };
}
