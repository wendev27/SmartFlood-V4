import { assignedBarangayForUser } from "@/lib/barangayScope";
import { dashboardViewerRole, type DashboardViewer } from "@/lib/dashboardViewer";
import { getCampaign, refreshCampaignExpiration, reconcileCampaignDistributionReadiness } from "@/lib/emergencyCampaigns";
import { supabaseServer } from "@/lib/supabaseServer";

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ReportAccess = {
  role: string;
  campaign: Awaited<ReturnType<typeof getCampaign>>;
  barangayId: number | null;
  barangayName: string | null;
  items: ReportItem[];
};

export type ReportItem = {
  item_id: string;
  batch_id: string;
  barangay_id: number;
  barangay_name: string;
  barangay_status: string;
};

export type NotReceivedRow = {
  family_id: string;
  family_name: string;
  family_head_name: string | null;
  barangay_id: number;
  barangay_name: string;
  eligibility: string;
  distribution_status: string;
};

export type BarangayBreakdownRow = {
  barangay_id: number;
  barangay_name: string;
  eligible: number;
  received: number;
  not_received: number;
  coverage: number;
};

export type BeneficiaryStatusFilter = "all" | "received" | "not_received";

export type BeneficiaryStatusRow = {
  family_id: string;
  family_name: string;
  family_head_name: string | null;
  barangay_id: number;
  barangay_name: string;
  status: "received" | "not_received";
  status_label: string;
  received_at: string | null;
};

const familyNotificationType = "EMERGENCY_RELIEF_DISTRIBUTION";
const itemSourceType = "emergency_allocation_item";

export function paginationFrom(pageValue: unknown, limitValue: unknown) {
  const page = Math.max(1, Number.parseInt(String(pageValue ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(limitValue ?? "10"), 10) || 10));
  return { page, limit };
}

export function paginateRows<T>(rows: T[], page: number, limit: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    pagination: { page, limit, total, totalPages },
  };
}

export async function resolveReportAccess(viewer: DashboardViewer | null, batchId: string): Promise<ReportAccess | { status: "UNAUTHORIZED" | "NOT_FOUND"; reason: string }> {
  if (!viewer) return { status: "UNAUTHORIZED", reason: "Unauthorized." };

  const role = dashboardViewerRole(viewer);
  if (role !== "barangay" && role !== "super" && role !== "cswdd") {
    return { status: "UNAUTHORIZED", reason: "You do not have access to relief reports." };
  }

  const campaign = await getCampaign(batchId);
  if (!campaign) return { status: "NOT_FOUND", reason: "Selected relief campaign was not found." };
  const effectiveCampaign = await reconcileCampaignDistributionReadiness(await refreshCampaignExpiration(campaign, viewer), viewer);

  let query = supabaseServer
    .from("emergency_allocation_items")
    .select("item_id,batch_id,barangay_id,barangay_name,barangay_status")
    .eq("batch_id", batchId);

  let barangayId: number | null = null;
  let barangayName: string | null = null;
  if (role === "barangay") {
    const barangay = assignedBarangayForUser(viewer);
    if (!barangay) return { status: "UNAUTHORIZED", reason: "Your account is not assigned to a barangay." };
    barangayId = barangay.barangay_id;
    barangayName = barangay.barangay_name;
    query = query.eq("barangay_id", barangay.barangay_id);
  }

  const { data, error } = await query.order("barangay_id", { ascending: true });
  if (error) throw new Error(error.message);

  const items = (data ?? []).map((item: Record<string, unknown>) => ({
    item_id: String(item.item_id ?? ""),
    batch_id: String(item.batch_id ?? ""),
    barangay_id: Number(item.barangay_id),
    barangay_name: String(item.barangay_name ?? ""),
    barangay_status: String(item.barangay_status ?? ""),
  })).filter((item: ReportItem) => item.item_id);

  if (role === "barangay" && items.length === 0) {
    return { status: "UNAUTHORIZED", reason: "Selected relief campaign is not available to your barangay." };
  }

  return {
    role,
    campaign: effectiveCampaign,
    barangayId,
    barangayName,
    items,
  };
}

export async function getReportSummary(access: ReportAccess) {
  const eligible = await getEligibleFamiliesForItems(access.items);
  const receivedFamilyIds = await getReceivedFamilyIds(String(access.campaign?.batch_id ?? ""), access.barangayId);
  const received = eligible.filter((row) => receivedFamilyIds.has(row.family_id)).length;
  const notReceived = Math.max(0, eligible.length - received);
  return {
    campaign: access.campaign,
    barangays: access.items.length,
    eligible: eligible.length,
    received,
    not_received: notReceived,
    coverage: coverage(received, eligible.length),
  };
}

export async function getBarangayBreakdown(access: ReportAccess): Promise<BarangayBreakdownRow[]> {
  const eligible = await getEligibleFamiliesForItems(access.items);
  const receivedRows = await getReceivedRows(String(access.campaign?.batch_id ?? ""), access.barangayId);
  const receivedByBarangay = new Map<number, Set<string>>();
  for (const row of receivedRows) {
    const barangayId = Number(row.barangay_id);
    if (!receivedByBarangay.has(barangayId)) receivedByBarangay.set(barangayId, new Set());
    receivedByBarangay.get(barangayId)?.add(String(row.family_id));
  }

  return access.items.map((item) => {
    const eligibleRows = eligible.filter((row) => row.barangay_id === item.barangay_id);
    const receivedCount = eligibleRows.filter((row) => receivedByBarangay.get(item.barangay_id)?.has(row.family_id)).length;
    return {
      barangay_id: item.barangay_id,
      barangay_name: item.barangay_name,
      eligible: eligibleRows.length,
      received: receivedCount,
      not_received: Math.max(0, eligibleRows.length - receivedCount),
      coverage: coverage(receivedCount, eligibleRows.length),
    };
  });
}

export async function getNotReceivedRows(access: ReportAccess): Promise<NotReceivedRow[]> {
  const eligible = await getEligibleFamiliesForItems(access.items);
  const receivedFamilyIds = await getReceivedFamilyIds(String(access.campaign?.batch_id ?? ""), access.barangayId);
  return eligible
    .filter((row) => !receivedFamilyIds.has(row.family_id))
    .map((row) => ({
      family_id: row.family_id,
      family_name: row.family_name,
      family_head_name: row.family_head_name,
      barangay_id: row.barangay_id,
      barangay_name: row.barangay_name,
      eligibility: "Eligible",
      distribution_status: "Not Received",
    }));
}

export async function getBeneficiaryStatusRows(access: ReportAccess, filter: BeneficiaryStatusFilter, search: string): Promise<BeneficiaryStatusRow[]> {
  const eligible = await getEligibleFamiliesForItems(access.items);
  const receivedRows = await getReceivedRows(String(access.campaign?.batch_id ?? ""), access.barangayId);
  const receivedByFamily = new Map<string, Record<string, unknown>>();
  for (const row of receivedRows) {
    const familyId = String(row.family_id ?? "");
    if (familyId && !receivedByFamily.has(familyId)) receivedByFamily.set(familyId, row);
  }

  const normalizedSearch = normalizeSearch(search);
  return eligible
    .map((family) => {
      const received = receivedByFamily.get(family.family_id);
      const hasReceived = Boolean(received);
      return {
        family_id: family.family_id,
        family_name: family.family_name,
        family_head_name: family.family_head_name,
        barangay_id: family.barangay_id,
        barangay_name: family.barangay_name,
        status: hasReceived ? "received" as const : "not_received" as const,
        status_label: hasReceived ? "Received" : "Eligible - Not Yet Received",
        received_at: stringifyOrNull(received?.verified_at),
      };
    })
    .filter((row) => filter === "all" || row.status === filter)
    .filter((row) => {
      if (!normalizedSearch) return true;
      return normalizeSearch(`${row.family_name} ${row.family_head_name ?? ""}`).includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "not_received" ? -1 : 1;
      return a.family_name.localeCompare(b.family_name);
    });
}

async function getEligibleFamiliesForItems(items: ReportItem[]) {
  const itemIds = items.map((item) => item.item_id).filter(Boolean);
  if (itemIds.length === 0) return [] as NotReceivedRow[];

  const itemById = new Map(items.map((item) => [item.item_id, item]));
  const { data: notifications, error } = await supabaseServer
    .from("notifications")
    .select("target_family_id,source_id,created_at")
    .eq("type", familyNotificationType)
    .eq("target_type", "family")
    .eq("source_type", itemSourceType)
    .in("source_id", itemIds);

  if (error) throw new Error(error.message);

  const familyById = new Map<string, { item: ReportItem; created_at: string | null }>();
  for (const notification of notifications ?? []) {
    const familyId = String((notification as Record<string, unknown>).target_family_id ?? "");
    const item = itemById.get(String((notification as Record<string, unknown>).source_id ?? ""));
    if (familyId && item && !familyById.has(familyId)) {
      familyById.set(familyId, { item, created_at: stringifyOrNull((notification as Record<string, unknown>).created_at) });
    }
  }

  const familyIds = Array.from(familyById.keys());
  if (familyIds.length === 0) return [];

  const { data: families, error: familyError } = await supabaseServer
    .from("families")
    .select("family_id,family_name,family_head_name,barangay_id,barangay_name")
    .in("family_id", familyIds);

  if (familyError) throw new Error(familyError.message);
  const familyRows = new Map<string, Record<string, unknown>>((families ?? []).map((family: Record<string, unknown>) => [String(family.family_id), family]));

  return familyIds.map((familyId) => {
    const family = familyRows.get(familyId);
    const fallback = familyById.get(familyId)?.item;
    return {
      family_id: familyId,
      family_name: String(family?.family_name ?? "Family"),
      family_head_name: stringifyOrNull(family?.family_head_name),
      barangay_id: Number(family?.barangay_id ?? fallback?.barangay_id ?? 0),
      barangay_name: String(family?.barangay_name ?? fallback?.barangay_name ?? ""),
      eligibility: "Eligible",
      distribution_status: "Not Received",
    };
  }).sort((a, b) => a.barangay_name.localeCompare(b.barangay_name) || a.family_name.localeCompare(b.family_name));
}

async function getReceivedRows(batchId: string, barangayId: number | null) {
  let query = supabaseServer
    .from("relief_distributions")
    .select("family_id,barangay_id,status,verified_at")
    .eq("batch_id", batchId)
    .eq("status", "received");

  if (barangayId) query = query.eq("barangay_id", barangayId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

async function getReceivedFamilyIds(batchId: string, barangayId: number | null) {
  const rows = await getReceivedRows(batchId, barangayId);
  return new Set(rows.map((row) => String(row.family_id ?? "")).filter(Boolean));
}

function coverage(received: number, eligible: number) {
  if (eligible <= 0) return 0;
  return Math.round((received / eligible) * 1000) / 10;
}

function normalizeSearch(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function stringifyOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}
