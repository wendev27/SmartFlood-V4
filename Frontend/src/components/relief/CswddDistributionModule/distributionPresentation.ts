import type { ReliefDistributionRecord } from "@/types/emergency";

export interface DistributionPresentationRow {
  id: string;
  familyName: string;
  familyHead: string;
  barangay: string;
  status: string;
  received: boolean;
  verifiedDate: string;
  verifiedTime: string;
}

/** Presentation only: preserve record identity and status from the API. */
export function toDistributionPresentation(record: ReliefDistributionRecord): DistributionPresentationRow {
  const date = record.verified_at ? new Date(record.verified_at) : null;
  const validDate = date && Number.isFinite(date.getTime()) ? date : null;
  return {
    id: record.distribution_id,
    familyName: record.family_name || "Not recorded",
    familyHead: record.family_head_name || "Not recorded",
    barangay: record.barangay_name || `Barangay ${record.barangay_id}`,
    status: record.status ? record.status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not recorded",
    received: record.status === "received",
    verifiedDate: validDate ? validDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Not recorded",
    verifiedTime: validDate ? validDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
  };
}
