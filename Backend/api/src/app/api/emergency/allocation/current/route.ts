import { NextRequest, NextResponse } from "next/server";
import { dashboardViewerRole, getDashboardViewer } from "@/lib/dashboardViewer";
import { refreshCampaignExpiration } from "@/lib/emergencyCampaigns";
import { supabaseServer } from "@/lib/supabaseServer";

const activeStatuses = ["accepted", "barangays_notified", "in_distribution"];

export async function GET(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    if (role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to emergency relief allocations." }, { status: 403 });
    }

    const { data: batches, error: batchError } = await supabaseServer
      .from("emergency_allocation_batches")
      .select("batch_id,plan_id,plan_name,status,created_at,accepted_at,started_at,expires_at,closed_at,closed_by,closure_reason")
      .in("status", activeStatuses)
      .order("created_at", { ascending: false })
      .limit(1);

    if (batchError) {
      return NextResponse.json({ success: false, error: batchError.message }, { status: 500 });
    }

    const batch = batches?.[0] ? await refreshCampaignExpiration(batches[0] as Record<string, unknown>, viewer) : null;
    if (!batch) {
      return NextResponse.json({ success: true, data: null });
    }
    if (!activeStatuses.includes(batch.status)) {
      return NextResponse.json({ success: true, data: null });
    }

    const { data: items, error: itemError } = await supabaseServer
      .from("emergency_allocation_items")
      .select("item_id,batch_id,recommendation_id,barangay_id,barangay_name,family_food_packs,individual_relief_goods,emergency_kits,barangay_status,created_at")
      .eq("batch_id", batch.batch_id)
      .order("barangay_id", { ascending: true });

    if (itemError) {
      return NextResponse.json({ success: false, error: itemError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        batch_id: batch.batch_id,
        plan_id: batch.plan_id,
        plan_name: batch.plan_name,
        status: batch.status,
        created_at: batch.created_at,
        accepted_at: batch.accepted_at,
        started_at: batch.started_at,
        expires_at: batch.expires_at,
        closed_at: batch.closed_at,
        closure_reason: batch.closure_reason,
        items: items ?? [],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load current emergency allocation." }, { status: 500 });
  }
}
