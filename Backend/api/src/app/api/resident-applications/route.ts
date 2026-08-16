import { NextRequest, NextResponse } from "next/server";
import { auditActorFromBody, logAuditEvent, withoutAuditActor } from "@/lib/auditLogger";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("resident_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseServer
      .from("resident_applications")
      .insert([{ ...withoutAuditActor(body), status: body.status ?? "pending" }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      ...auditActorFromBody(body),
      action: "APPLICATION_SUBMITTED",
      module: "Resident Account Registration Management",
      description: `Submitted resident application for ${[data.first_name, data.last_name].filter(Boolean).join(" ") || data.application_id}.`,
      target_type: "resident_application",
      target_id: String(data.application_id),
      barangay_id: data.barangay_id ?? null,
      barangay_name: data.barangay_name ?? null,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
