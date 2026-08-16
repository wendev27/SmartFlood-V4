import { NextRequest, NextResponse } from "next/server";
import { dashboardViewerRole, getDashboardViewer } from "@/lib/dashboardViewer";
import {
  createRejectedWorkflowBatch,
  findExistingRejectedBatch,
  validateAllocationPlan,
  WorkflowValidationError,
} from "@/lib/emergencyWorkflow";

export async function POST(request: NextRequest) {
  try {
    const viewer = await getDashboardViewer(request);
    const role = dashboardViewerRole(viewer);
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }
    if (role !== "super" && role !== "cswdd") {
      return NextResponse.json({ success: false, error: "You do not have access to reject AI relief recommendations." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const plan = validateAllocationPlan(body.plan);
    const existing = await findExistingRejectedBatch(plan, viewer);
    if (existing) {
      return NextResponse.json({ success: true, ...existing });
    }

    const workflow = await createRejectedWorkflowBatch(plan, viewer);
    return NextResponse.json({ success: true, ...workflow });
  } catch (error) {
    if (error instanceof WorkflowValidationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    const details = error instanceof Error ? error.message : "Unknown reject workflow error.";
    return NextResponse.json({ success: false, error: `Failed to reject AI recommendations. ${details}` }, { status: 500 });
  }
}
