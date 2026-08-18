import { NextRequest, NextResponse } from "next/server";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { getDistributionHistoryForViewerByBatchPaginated } from "@/lib/emergencyDistribution";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const batchId = request.nextUrl.searchParams.get("batch_id") ?? request.nextUrl.searchParams.get("batchId");
    const pagination = parsePagination(request.nextUrl.searchParams);
    if ("error" in pagination) {
      return NextResponse.json({ success: false, error: pagination.error }, { status: 400 });
    }

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

function parsePagination(searchParams: URLSearchParams): { page: number; limit: number } | { error: string } {
  const page = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);
  if ("error" in page) return { error: "page must be a positive integer." };

  const limit = parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT);
  if ("error" in limit || limit.value > MAX_LIMIT) {
    return { error: `limit must be a positive integer no greater than ${MAX_LIMIT}.` };
  }

  return { page: page.value, limit: limit.value };
}

function parsePositiveInteger(value: string | null, fallback: number): { value: number } | { error: true } {
  if (value == null) return { value: fallback };

  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return { error: true };

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return { error: true };

  return { value: parsed };
}
