import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/auditLogger";
import { sanitizeAppUser } from "@/lib/appUserMapping";
import { setDashboardSession } from "@/lib/dashboardSession";
import { supabaseServer } from "@/lib/supabaseServer";

const maxFailedAttempts = 3;
const lockMinutes = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    const { data: user, error } = await supabaseServer
      .from("app_users")
      .select("id,first_name,last_name,email,mobile_number,address,profile_image,created_at,updated_at,barangay,sex,role_id,barangay_id,status,password_hash,failed_login_attempts,locked_until,last_login_at")
      .eq("email", email)
      .single();

    if (error || !user) {
      await logAuditEvent({
        actor_name: email,
        actor_role: "Unknown",
        action: "LOGIN_FAILED",
        module: "Authentication",
        description: `Failed login attempt for ${email}.`,
        target_type: "app_user",
        target_id: email,
      });
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    const status = String(user.status ?? "inactive").toLowerCase();
    if (status === "inactive" || status === "blocked") {
      await logAuditEvent({
        actor_user_id: String(user.id),
        actor_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || email,
        actor_role: roleLabel(user.role_id),
        action: status === "blocked" ? "LOGIN_BLOCKED" : "LOGIN_DENIED",
        module: "Authentication",
        description: `Login denied for ${email}: account is ${status}.`,
        target_type: "app_user",
        target_id: String(user.id),
        barangay_id: user.barangay_id ?? null,
        barangay_name: String(user.barangay ?? ""),
      });
      return NextResponse.json({ success: false, error: "Access denied. This account is not active." }, { status: 403 });
    }

    const lockedUntil = user.locked_until ? new Date(String(user.locked_until)) : null;
    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      await logAuditEvent({
        actor_user_id: String(user.id),
        actor_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || email,
        actor_role: roleLabel(user.role_id),
        action: "LOGIN_BLOCKED",
        module: "Authentication",
        description: `Login denied for ${email}: account is temporarily locked.`,
        target_type: "app_user",
        target_id: String(user.id),
        barangay_id: user.barangay_id ?? null,
        barangay_name: String(user.barangay ?? ""),
      });
      return NextResponse.json({ success: false, error: "Access denied. This account is temporarily locked." }, { status: 403 });
    }

    const passwordHash = String(user.password_hash ?? "");
    const passwordMatches = passwordHash ? await bcrypt.compare(password, passwordHash) : false;

    if (!passwordMatches) {
      const failedAttempts = Number(user.failed_login_attempts ?? 0) + 1;
      const lockUntil = failedAttempts >= maxFailedAttempts ? new Date(Date.now() + lockMinutes * 60 * 1000).toISOString() : null;
      await supabaseServer
        .from("app_users")
        .update({
          failed_login_attempts: failedAttempts,
          locked_until: lockUntil,
          status: failedAttempts >= maxFailedAttempts ? "blocked" : status,
        })
        .eq("id", user.id);

      await logAuditEvent({
        actor_user_id: String(user.id),
        actor_name: [user.first_name, user.last_name].filter(Boolean).join(" ") || email,
        actor_role: roleLabel(user.role_id),
        action: failedAttempts >= maxFailedAttempts ? "LOGIN_BLOCKED" : "LOGIN_FAILED",
        module: "Authentication",
        description: failedAttempts >= maxFailedAttempts
          ? `Failed login attempt for ${email}. Account was blocked after repeated failures.`
          : `Failed login attempt for ${email}.`,
        target_type: "app_user",
        target_id: String(user.id),
        barangay_id: user.barangay_id ?? null,
        barangay_name: String(user.barangay ?? ""),
      });

      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    await supabaseServer
      .from("app_users")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    const safeUser = sanitizeAppUser(user);
    await logAuditEvent({
      actor_user_id: safeUser.id,
      actor_name: [safeUser.first_name, safeUser.last_name].filter(Boolean).join(" ") || safeUser.email,
      actor_role: safeUser.role_label || roleLabel(safeUser.role_id),
      action: "LOGIN_SUCCESS",
      module: "Authentication",
      description: `${[safeUser.first_name, safeUser.last_name].filter(Boolean).join(" ") || safeUser.email} signed in successfully.`,
      target_type: "app_user",
      target_id: safeUser.id,
      barangay_id: safeUser.barangay_id,
      barangay_name: safeUser.barangay_name,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: safeUser.id,
        first_name: safeUser.first_name,
        last_name: safeUser.last_name,
        full_name: [safeUser.first_name, safeUser.last_name].filter(Boolean).join(" "),
        email: safeUser.email,
        role_id: safeUser.role_id,
        role_name: safeUser.role_name,
        role_label: safeUser.role_label,
        barangay_id: safeUser.barangay_id,
        barangay_name: safeUser.barangay_name,
        status: safeUser.status,
      },
    });
    setDashboardSession(response, safeUser.id);
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

function roleLabel(roleId: unknown) {
  const id = Number(roleId);
  if (id === 1) return "Super Admin";
  if (id === 2) return "CDRRMO Admin";
  if (id === 3) return "CSWDD Admin";
  if (id === 4) return "Barangay Admin";
  return "Unknown";
}
