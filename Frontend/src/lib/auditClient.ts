import { getCurrentUser, normalizeUserRole, roleLabelForRole, userDisplayName } from "@/lib/authSession";

export function getAuditActor() {
  const user = getCurrentUser();
  if (!user) return null;
  const role = normalizeUserRole(user);

  return {
    actor_user_id: user.id,
    actor_name: userDisplayName(user) || user.email || "Unknown user",
    actor_role: role ? roleLabelForRole(role, user) : user.role_label || user.role_name || "Unknown",
    barangay_id: user.barangay_id ?? null,
    barangay_name: user.barangay_name ?? null,
  };
}

export function withAuditActor<T extends Record<string, unknown>>(payload: T) {
  const auditActor = getAuditActor();
  return auditActor ? { ...payload, audit_actor: auditActor } : payload;
}
