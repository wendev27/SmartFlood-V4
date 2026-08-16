import { NextRequest, NextResponse } from "next/server";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { resolveDistributionContext } from "@/lib/emergencyDistribution";

export async function POST(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    if (!viewer) {
      return NextResponse.json({ success: false, result: "UNAUTHORIZED", error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const identifier = String(body.qr_identifier ?? body.identifier ?? body.resident_id ?? body.family_id ?? "").trim();
    const context = await resolveDistributionContext(viewer, {
      identifier,
      allocation_item_id: stringifyOrNull(body.allocation_item_id),
      batch_id: stringifyOrNull(body.batch_id ?? body.batchId),
    });

    if (context.status === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, result: context.status, error: context.reason ?? "Unauthorized." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      result: context.status,
      reason: context.reason ?? null,
      data: {
        beneficiary: context.beneficiary ?? null,
        allocation: context.allocation ?? null,
        existing_distribution: context.existing_distribution ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, result: "INVALID_IDENTIFIER", error: error instanceof Error ? error.message : "Unable to verify beneficiary." }, { status: 500 });
  }
}

function stringifyOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
