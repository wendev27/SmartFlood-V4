export interface EmergencyNotificationAllocationItem {
  item_id: string;
  batch_id: string;
  barangay_id: number;
  barangay_name: string;
  family_food_packs: number;
  individual_relief_goods: number;
  emergency_kits: number;
  barangay_status: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
  receipt_confirmed_at?: string | null;
  created_at?: string | null;
}

export interface EmergencyNotificationBatch {
  batch_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  created_at?: string | null;
  accepted_at?: string | null;
}

export interface EmergencyNotification {
  notification_id: string;
  type: string;
  target_type: string;
  target_barangay_id: number | null;
  source_type: string | null;
  source_id: string | null;
  title: string;
  message: string;
  status: string;
  read_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  created_at?: string | null;
  allocation_item?: EmergencyNotificationAllocationItem | null;
  batch?: EmergencyNotificationBatch | null;
}

export interface EmergencyNotificationListResponse {
  notifications: EmergencyNotification[];
}

export interface EmergencyAllocationActionResponse {
  notification: EmergencyNotification | null;
  allocation_item: EmergencyNotificationAllocationItem;
  campaign?: ReliefCampaign | null;
  campaign_started?: boolean;
  notifications_created?: number;
  eligible_families?: number;
  already_notified?: boolean;
}

export type ReliefDistributionResult =
  | "ELIGIBLE"
  | "ALREADY_RECEIVED"
  | "INVALID_IDENTIFIER"
  | "WRONG_BARANGAY"
  | "CAMPAIGN_NOT_ACTIVE"
  | "NOT_ELIGIBLE"
  | "UNAUTHORIZED"
  | "RECEIVED";

export interface ReliefDistributionBeneficiary {
  family_id: string;
  family_name: string;
  family_head_id?: string | null;
  family_head_name?: string | null;
  barangay_id: number;
  barangay_name: string;
  total_family_members: number;
  address?: string | null;
  scanned_resident_name?: string | null;
  vulnerability?: Record<string, number>;
}

export interface ReliefDistributionAllocation {
  item_id: string;
  batch_id: string;
  barangay_id: number;
  barangay_name: string;
  barangay_status: string;
  family_food_packs: number;
  individual_relief_goods: number;
  emergency_kits: number;
  batch?: {
    batch_id: string;
    plan_id?: string;
    plan_name?: string;
    status?: string;
    created_at?: string | null;
    started_at?: string | null;
    expires_at?: string | null;
    closed_at?: string | null;
    closure_reason?: string | null;
  } | null;
}

export interface ReliefDistributionRecord {
  distribution_id: string;
  batch_id: string;
  allocation_item_id: string;
  family_id: string;
  family_head_id?: string | null;
  barangay_id: number;
  status: string;
  verified_by: string;
  verified_at?: string | null;
  created_at?: string | null;
  family_name?: string | null;
  family_head_name?: string | null;
  barangay_name?: string | null;
  total_family_members?: number | null;
  verified_by_name?: string | null;
}

export interface ReliefDistributionVerifyResponse {
  result: ReliefDistributionResult;
  reason?: string | null;
  data?: {
    beneficiary?: ReliefDistributionBeneficiary | null;
    allocation?: ReliefDistributionAllocation | null;
    existing_distribution?: ReliefDistributionRecord | null;
    distribution?: ReliefDistributionRecord | null;
  };
}

export interface ReliefDistributionHistoryResponse {
  distributions: ReliefDistributionRecord[];
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReliefNotReceivedBeneficiary {
  family_id: string;
  family_name: string;
  family_head_name?: string | null;
  barangay_id: number;
  barangay_name: string;
  eligibility: string;
  distribution_status: string;
}

export interface ReliefNotReceivedResponse {
  beneficiaries: ReliefNotReceivedBeneficiary[];
  pagination: Pagination;
}

export interface ReliefBarangayBreakdown {
  barangay_id: number;
  barangay_name: string;
  eligible: number;
  received: number;
  not_received: number;
  coverage: number;
}

export interface ReliefReportSummary {
  campaign: ReliefCampaign;
  barangays: number;
  eligible: number;
  received: number;
  not_received: number;
  coverage: number;
}

export interface ReliefDistributionReportResponse {
  summary: ReliefReportSummary;
  barangays: ReliefBarangayBreakdown[];
}

export type ReliefBeneficiaryStatusFilter = "all" | "received" | "not_received";

export interface ReliefBeneficiaryStatusRow {
  family_id: string;
  family_name: string;
  family_head_name?: string | null;
  barangay_id: number;
  barangay_name: string;
  status: "received" | "not_received";
  status_label: string;
  received_at?: string | null;
}

export interface ReliefBeneficiaryStatusResponse {
  summary: ReliefReportSummary;
  beneficiaries: ReliefBeneficiaryStatusRow[];
  pagination: Pagination;
}

export interface ReliefCampaignProgressBarangay {
  barangay_id: number;
  barangay_name: string;
  allocation_item_id: string;
  barangay_status?: string | null;
  received: number;
}

export interface ReliefCampaignProgress {
  total_barangays: number;
  total_distributions: number;
  barangays: ReliefCampaignProgressBarangay[];
}

export interface ReliefCampaign {
  batch_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  created_at?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  expires_at?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  closure_reason?: string | null;
  progress?: ReliefCampaignProgress;
}

export interface ReliefCampaignHistoryResponse {
  campaigns: ReliefCampaign[];
}

export interface ReliefCampaignActionResponse {
  campaign: ReliefCampaign;
  progress: ReliefCampaignProgress;
}
