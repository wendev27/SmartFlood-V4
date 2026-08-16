import { assignedBarangayForUser } from "@/lib/barangayScope";
import { logAuditEvent } from "@/lib/auditLogger";
import { auditActorForViewer, dashboardViewerRole, type DashboardViewer } from "@/lib/dashboardViewer";
import { supabaseServer } from "@/lib/supabaseServer";

export type CampaignStatus = "accepted" | "rejected" | "barangays_notified" | "in_distribution" | "completed" | "expired" | "closed";

export const campaignSelect = "batch_id,plan_id,plan_name,status,created_by,accepted_by,rejected_by,created_at,updated_at,accepted_at,rejected_at,started_at,expires_at,closed_at,closed_by,closure_reason";

export const activeCampaignStatuses = ["accepted", "barangays_notified", "in_distribution"];
export const terminalCampaignStatuses = ["rejected", "expired", "closed", "completed"];
const distributableItemStatuses = ["family_heads_notified", "completed"];

export async function getCampaign(batchId: string) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_batches")
    .select(campaignSelect)
    .eq("batch_id", batchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeCampaign(data as Record<string, unknown>) : null;
}

export async function refreshCampaignExpiration(campaign: Record<string, unknown>, viewer?: DashboardViewer | null) {
  const status = String(campaign.status ?? "");
  const expiresAt = campaign.expires_at ? new Date(String(campaign.expires_at)) : null;
  if (status !== "in_distribution" || !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() >= Date.now()) {
    return normalizeCampaign(campaign);
  }

  const { data, error } = await supabaseServer
    .from("emergency_allocation_batches")
    .update({ status: "expired" })
    .eq("batch_id", campaign.batch_id)
    .eq("status", "in_distribution")
    .select(campaignSelect)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const expired = normalizeCampaign((data as Record<string, unknown> | null) ?? { ...campaign, status: "expired" });
  if (viewer && data) {
    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "RELIEF_CAMPAIGN_EXPIRED",
      module: "Emergency Relief Management",
      description: `Relief campaign ${expired.plan_name} expired at ${String(expired.expires_at ?? "")}.`,
      target_type: "emergency_allocation_batch",
      target_id: expired.batch_id,
    });
  }
  return expired;
}

export async function reconcileCampaignDistributionReadiness(campaign: Record<string, unknown>, viewer?: DashboardViewer | null) {
  const normalized = normalizeCampaign(campaign);
  if (normalized.status !== "barangays_notified") return normalized;

  const { data: readyItems, error: itemError } = await supabaseServer
    .from("emergency_allocation_items")
    .select("item_id")
    .eq("batch_id", normalized.batch_id)
    .in("barangay_status", distributableItemStatuses)
    .limit(1);

  if (itemError) throw new Error(itemError.message);
  if (!readyItems?.length) return normalized;

  const now = new Date().toISOString();
  const { data: updatedCampaign, error: updateError } = await supabaseServer
    .from("emergency_allocation_batches")
    .update({
      status: "in_distribution",
      started_at: normalized.started_at ?? now,
    })
    .eq("batch_id", normalized.batch_id)
    .eq("status", "barangays_notified")
    .select(campaignSelect)
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  const reconciled = normalizeCampaign((updatedCampaign as Record<string, unknown> | null) ?? normalized);

  if (viewer && updatedCampaign) {
    await logAuditEvent({
      ...auditActorForViewer(viewer),
      action: "RELIEF_CAMPAIGN_STARTED",
      module: "Emergency Relief Management",
      description: `Started relief distribution for ${reconciled.plan_name} after at least one barangay allocation reached family-head notification readiness.`,
      target_type: "emergency_allocation_batch",
      target_id: reconciled.batch_id,
    });
  }

  return reconciled;
}

export async function findActiveCampaign(excludeBatchId?: string | null) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_batches")
    .select(campaignSelect)
    .in("status", activeCampaignStatuses)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const campaign = await refreshCampaignExpiration(row as Record<string, unknown>);
    if (excludeBatchId && campaign.batch_id === excludeBatchId) continue;
    if (activeCampaignStatuses.includes(campaign.status)) return campaign;
  }
  return null;
}

export async function listCampaignsForViewer(viewer: DashboardViewer) {
  const role = dashboardViewerRole(viewer);
  if (role !== "super" && role !== "cswdd" && role !== "barangay") {
    return { status: "UNAUTHORIZED" as const, reason: "You do not have access to relief campaigns." };
  }

  const { data, error } = await supabaseServer
    .from("emergency_allocation_batches")
    .select(campaignSelect)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  const scopedCampaigns = [];
  for (const row of data ?? []) {
    const refreshedCampaign = await refreshCampaignExpiration(row as Record<string, unknown>, viewer);
    const campaign = await reconcileCampaignDistributionReadiness(refreshedCampaign, viewer);
    if (role === "barangay") {
      const barangay = assignedBarangayForUser(viewer);
      if (!barangay) return { status: "UNAUTHORIZED" as const, reason: "Your account is not assigned to a barangay." };
      const item = await getCampaignBarangayItem(campaign.batch_id, barangay.barangay_id);
      if (!item) continue;
    }
    scopedCampaigns.push({
      ...campaign,
      progress: await getCampaignProgress(campaign.batch_id, role === "barangay" ? viewer : null),
    });
  }

  return { status: "OK" as const, campaigns: scopedCampaigns };
}

export async function getCampaignProgress(batchId: string, viewer?: DashboardViewer | null) {
  const role = dashboardViewerRole(viewer);
  const barangay = role === "barangay" ? assignedBarangayForUser(viewer) : null;

  let itemQuery = supabaseServer
    .from("emergency_allocation_items")
    .select("item_id,barangay_id,barangay_name,barangay_status")
    .eq("batch_id", batchId);
  if (barangay) itemQuery = itemQuery.eq("barangay_id", barangay.barangay_id);

  const { data: items, error: itemError } = await itemQuery;
  if (itemError) throw new Error(itemError.message);

  const itemIds = (items ?? []).map((item: Record<string, unknown>) => String(item.item_id)).filter(Boolean);
  let distributions: Record<string, unknown>[] = [];
  if (itemIds.length > 0) {
    const { data, error } = await supabaseServer
      .from("relief_distributions")
      .select("distribution_id,allocation_item_id,barangay_id,status")
      .in("allocation_item_id", itemIds);

    if (error) throw new Error(error.message);
    distributions = (data ?? []) as Record<string, unknown>[];
  }

  const byBarangay = new Map<string, { barangay_id: number; barangay_name: string; allocation_item_id: string; barangay_status: string; received: number }>();
  for (const item of items ?? []) {
    byBarangay.set(String(item.item_id), {
      barangay_id: Number(item.barangay_id),
      barangay_name: String(item.barangay_name ?? ""),
      allocation_item_id: String(item.item_id),
      barangay_status: String(item.barangay_status ?? ""),
      received: 0,
    });
  }
  for (const distribution of distributions) {
    const key = String(distribution.allocation_item_id ?? "");
    const row = byBarangay.get(key);
    if (row && distribution.status === "received") row.received += 1;
  }

  return {
    total_barangays: items?.length ?? 0,
    total_distributions: distributions.filter((distribution) => distribution.status === "received").length,
    barangays: Array.from(byBarangay.values()),
  };
}

export async function getCampaignBarangayItem(batchId: string, barangayId: number) {
  const { data, error } = await supabaseServer
    .from("emergency_allocation_items")
    .select("item_id,batch_id,barangay_id,barangay_name,barangay_status")
    .eq("batch_id", batchId)
    .eq("barangay_id", barangayId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

export function normalizeCampaign(row: Record<string, unknown>) {
  return {
    batch_id: String(row.batch_id),
    plan_id: String(row.plan_id ?? ""),
    plan_name: String(row.plan_name ?? ""),
    status: String(row.status ?? "") as CampaignStatus,
    created_by: stringifyOrNull(row.created_by),
    accepted_by: stringifyOrNull(row.accepted_by),
    rejected_by: stringifyOrNull(row.rejected_by),
    created_at: stringifyOrNull(row.created_at),
    updated_at: stringifyOrNull(row.updated_at),
    accepted_at: stringifyOrNull(row.accepted_at),
    rejected_at: stringifyOrNull(row.rejected_at),
    started_at: stringifyOrNull(row.started_at),
    expires_at: stringifyOrNull(row.expires_at),
    closed_at: stringifyOrNull(row.closed_at),
    closed_by: stringifyOrNull(row.closed_by),
    closure_reason: stringifyOrNull(row.closure_reason),
  };
}

function stringifyOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
