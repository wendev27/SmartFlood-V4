import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/auditLogger";
import { clearDashboardSession, getDashboardSessionUserId } from "@/lib/dashboardSession";
import { sanitizeAppUser } from "@/lib/appUserMapping";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const userId = getDashboardSessionUserId(req);

  try {
    if (userId) {
      const { data } = await supabaseServer
        .from("app_users")
        .select("id,first_name,last_name,email,role_id,barangay_id,barangay,status")
        .eq("id", userId)
        .single();

      if (data) {
        const user = sanitizeAppUser(data);
        const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;
        await logAuditEvent({
          actor_user_id: user.id,
          actor_name: displayName,
          actor_role: user.role_label,
          action: "LOGOUT",
          module: "Authentication",
          description: `${displayName} logged out.`,
          target_type: "app_user",
          target_id: user.id,
          barangay_id: user.barangay_id,
          barangay_name: user.barangay_name,
        });
      }
    }
  } catch {
    // Logout must still clear the browser session if audit persistence is unavailable.
  } finally {
    clearDashboardSession(response);
  }

  return response;
}
