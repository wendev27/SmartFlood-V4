import { NextRequest, NextResponse } from "next/server";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { getNotReceivedRows, paginateRows, paginationFrom, resolveReportAccess } from "@/lib/emergencyReports";

export async function GET(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    const batchId = String(request.nextUrl.searchParams.get("batchId") ?? request.nextUrl.searchParams.get("batch_id") ?? "").trim();
    if (!batchId) return NextResponse.json({ success: false, error: "batchId is required." }, { status: 400 });

    const access = await resolveReportAccess(viewer, batchId);
    if ("status" in access) {
      return NextResponse.json({ success: false, error: access.reason }, { status: access.status === "NOT_FOUND" ? 404 : 403 });
    }

    const { page, limit } = paginationFrom(request.nextUrl.searchParams.get("page"), request.nextUrl.searchParams.get("limit"));
    const rows = await getNotReceivedRows(access);
    const paginated = paginateRows(rows, page, limit);

    return NextResponse.json({
      success: true,
      data: {
        beneficiaries: paginated.data,
        pagination: paginated.pagination,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load not-yet-served beneficiaries." }, { status: 500 });
  }
}
