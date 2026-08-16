import { NextRequest, NextResponse } from "next/server";
import { auditActorFromBody, logAuditEvent } from "@/lib/auditLogger";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("relief_inventory")
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
    const payload = {
      family_food_packs: Number(body.family_food_packs ?? 0),
      medicine_kits: Number(body.medicine_kits ?? 0),
      relief_goods_individual: Number(body.relief_goods_individual ?? 0),
      updated_by: body.updated_by ?? null,
    };
    const { data, error } = await supabaseServer
      .from("relief_inventory")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      ...auditActorFromBody(body),
      action: "RELIEF_INVENTORY_UPDATED",
      module: "AI-Optimized Relief Recommendation",
      description: "Updated available relief inventory.",
      target_type: "relief_inventory",
      target_id: String(data.inventory_id ?? data.id ?? data.created_at ?? ""),
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
