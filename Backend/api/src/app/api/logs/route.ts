import { NextRequest, NextResponse } from "next/server";
import { auditActorFromBody, logAuditEvent } from "@/lib/auditLogger";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { filterLogsForViewer } from "@/lib/logVisibility";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  try {
    const viewer = await getDashboardViewer(req);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 200), 1), 500);
    let query = supabaseServer
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    const module = searchParams.get("module");
    const action = searchParams.get("action");
    const actorRole = searchParams.get("actor_role");
    const barangayId = searchParams.get("barangay_id");

    if (module) query = query.eq("module", module);
    if (action) query = query.eq("action", action);
    if (actorRole) query = query.eq("actor_role", actorRole);
    if (barangayId) query = query.eq("barangay_id", Number(barangayId));

    const { data, error } = await query;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: filterLogsForViewer(data ?? [], viewer).slice(0, limit) });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.action || !body.module) {
      return NextResponse.json({ success: false, error: "action and module are required." }, { status: 400 });
    }

    const actor = auditActorFromBody(body);
    const result = await logAuditEvent({
      ...actor,
      action: String(body.action),
      module: String(body.module),
      description: body.description == null ? null : String(body.description),
      target_type: body.target_type == null ? null : String(body.target_type),
      target_id: body.target_id == null ? null : String(body.target_id),
      barangay_id: body.barangay_id ?? actor.barangay_id ?? null,
      barangay_name: body.barangay_name == null ? actor.barangay_name : String(body.barangay_name),
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
