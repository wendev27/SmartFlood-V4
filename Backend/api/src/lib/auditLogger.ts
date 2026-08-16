import { supabaseServer } from "@/lib/supabaseServer";

export type AuditActor = {
  actor_user_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  barangay_id?: number | string | null;
  barangay_name?: string | null;
};

export type AuditEvent = AuditActor & {
  action: string;
  module: string;
  description?: string | null;
  target_type?: string | null;
  target_id?: string | null;
};

export function auditActorFromBody(body: Record<string, unknown>): AuditActor {
  const actor = (body.audit_actor && typeof body.audit_actor === "object" ? body.audit_actor : {}) as Record<string, unknown>;
  return {
    actor_user_id: stringifyOrNull(actor.actor_user_id),
    actor_name: stringifyOrNull(actor.actor_name),
    actor_role: stringifyOrNull(actor.actor_role),
    barangay_id: actor.barangay_id == null || actor.barangay_id === "" ? null : Number(actor.barangay_id),
    barangay_name: stringifyOrNull(actor.barangay_name),
  };
}

export function withoutAuditActor<T extends Record<string, unknown>>(body: T) {
  const { audit_actor: _auditActor, ...rest } = body;
  return rest;
}

export async function logAuditEvent(event: AuditEvent) {
  try {
    if (!event.action || !event.module) {
      return { success: false, error: "Audit action and module are required." };
    }

    const { error } = await supabaseServer.from("audit_logs").insert([{
      actor_user_id: event.actor_user_id ?? null,
      actor_name: event.actor_name ?? null,
      actor_role: event.actor_role ?? null,
      action: event.action,
      module: event.module,
      description: event.description ?? null,
      target_type: event.target_type ?? null,
      target_id: event.target_id ?? null,
      barangay_id: event.barangay_id == null || event.barangay_id === "" ? null : Number(event.barangay_id),
      barangay_name: event.barangay_name ?? null,
    }]);

    if (error) {
      console.error("Audit log insert failed:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Audit log insert failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Audit log insert failed." };
  }
}

function stringifyOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
