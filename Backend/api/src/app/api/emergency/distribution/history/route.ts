import { NextRequest, NextResponse } from "next/server";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { getDistributionHistoryForViewerByBatchPaginated } from "@/lib/emergencyDistribution";
import { paginationFrom } from "@/lib/emergencyReports";

export async function GET(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const batchId = request.nextUrl.searchParams.get("batch_id") ?? request.nextUrl.searchParams.get("batchId");
    const hasPagination = request.nextUrl.searchParams.has("page") || request.nextUrl.searchParams.has("limit");
    const pagination = hasPagination
      ? paginationFrom(request.nextUrl.searchParams.get("page"), request.nextUrl.searchParams.get("limit"))
      : null;
    const result = await getDistributionHistoryForViewerByBatchPaginated(viewer, stringifyOrNull(batchId), pagination);
    if (result.status === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: result.reason }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: { distributions: result.distributions, pagination: result.pagination } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load relief distribution history." }, { status: 500 });
  }
}

function stringifyOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
