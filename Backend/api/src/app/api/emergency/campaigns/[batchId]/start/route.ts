import { NextRequest, NextResponse } from "next/server";
import { logAuditEvent } from "@/lib/auditLogger";
import { auditActorForViewer, dashboardViewerRole, getDashboardViewer } from "@/lib/dashboardViewer";
import { findActiveCampaign, getCampaign, getCampaignProgress, refreshCampaignExpiration } from "@/lib/emergencyCampaigns";
import { supabaseServer } from "@/lib/supabaseServer";

type RouteContext = {
  params: Promise<{ batchId: string }>;
};

const startableStatuses = ["accepted", "barangays_notified"];

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    if (role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to start relief campaigns." }, { status: 403 });
    }

    const { batchId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const expiresAt = parseFutureDate(body.expires_at);
    if (!expiresAt) {
      return NextResponse.json({ success: false, error: "A future expires_at timestamp is required to start distribution." }, { status: 400 });
    }

    const campaign = await getCampaign(batchId);
    if (!campaign) return NextResponse.json({ success: false, error: "Relief campaign was not found." }, { status: 404 });
    const effectiveCampaign = await refreshCampaignExpiration(campaign, viewer);
    if (!startableStatuses.includes(effectiveCampaign.status)) {
      return NextResponse.json({ success: false, error: `Campaign status ${effectiveCampaign.status} cannot start distribution.` }, { status: 400 });
    }

    const activeCampaign = await findActiveCampaign(batchId);
    if (activeCampaign) {
      return NextResponse.json({
        success: false,
        error: "Another active relief campaign already exists. Close or complete it before starting a new campaign.",
        active_campaign: activeCampaign,
      }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data, error } = await supabaseServer
      .from("emergency_allocation_batches")
      .update({ status: "in_distribution", started_at: effectiveCampaign.started_at ?? now, expires_at: expiresAt.toISOString() })
      .eq("batch_id", batchId)
      .in("status", startableStatuses)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ success: false, error: "Campaign was already changed. Refresh and try again." }, { status: 409 });

    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "RELIEF_CAMPAIGN_STARTED",
      module: "Emergency Relief Management",
      description: `Started relief distribution for ${String(data.plan_name)} until ${expiresAt.toISOString()}.`,
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
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to start relief campaign." }, { status: 500 });
  }
}

function parseFutureDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) return null;
  return date;
}
