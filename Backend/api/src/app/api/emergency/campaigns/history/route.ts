import { NextRequest, NextResponse } from "next/server";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { listCampaignsForViewer } from "@/lib/emergencyCampaigns";

export async function GET(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    if (!viewer) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const result = await listCampaignsForViewer(viewer);
    if (result.status === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: result.reason }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: { campaigns: result.campaigns } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load relief campaign history." }, { status: 500 });
  }
}
