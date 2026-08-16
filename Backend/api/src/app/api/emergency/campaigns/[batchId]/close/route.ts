import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/auditLogger";
import { auditActorForViewer, dashboardViewerRole, getDashboardViewer } from "@/lib/dashboardViewer";
import { getCampaign, getCampaignProgress, refreshCampaignExpiration } from "@/lib/emergencyCampaigns";
import { supabaseServer } from "@/lib/supabaseServer";

type RouteContext = {
  params: Promise<{ batchId: string }>;
};

const closableStatuses = ["accepted", "barangays_notified", "in_distribution"];

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    if (role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to close relief campaigns." }, { status: 403 });
    }

    const { batchId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const closureReason = String(body.closure_reason ?? "").trim();
    if (!closureReason) {
      return NextResponse.json({ success: false, error: "Closure reason is required." }, { status: 400 });
    }

    const campaign = await getCampaign(batchId);
    if (!campaign) return NextResponse.json({ success: false, error: "Relief campaign was not found." }, { status: 404 });
    const effectiveCampaign = await refreshCampaignExpiration(campaign, viewer);
    if (!closableStatuses.includes(effectiveCampaign.status)) {
      return NextResponse.json({ success: false, error: `Campaign status ${effectiveCampaign.status} cannot be closed.` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseServer
      .from("emergency_allocation_batches")
      .update({ status: "closed", closed_at: now, closed_by: viewer.id, closure_reason: closureReason })
      .eq("batch_id", batchId)
      .in("status", closableStatuses)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ success: false, error: "Campaign was already changed. Refresh and try again." }, { status: 409 });

    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "RELIEF_CAMPAIGN_CLOSED",
      module: "Emergency Relief Management",
      description: `Closed relief campaign ${String(data.plan_name)}. Reason: ${closureReason}`,
      target_type: "emergency_allocation_batch",
      target_id: batchId,
    });

    return NextResponse.json({
      success: true,
      data: {
        campaign: data,
        progress: await getCampaignProgress(batchId),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to close relief campaign." }, { status: 500 });
  }
}
