"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApplicationFormValues, ModalMode, VerificationApplication, VerificationStatus } from "@/types/verification";
import { withAuditActor } from "@/lib/auditClient";
import { fetchJson } from "@/services/apiClient";
import { ActionResultModal, type ActionResultType } from "@/components/ui/ActionResultModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { Tabs } from "@/components/ui/Tabs/Tabs";
import { ApplicationCard } from "@/components/verification/ApplicationCard/ApplicationCard";
import { ApplicationFormModal } from "@/components/verification/ApplicationFormModal/ApplicationFormModal";
import { ReviewModal } from "@/components/verification/ReviewModal/ReviewModal";
import { SmartFloodIcon } from "@/components/icons/SmartFloodIcon";
import styles from "./VerificationPanel.module.css";

export function VerificationPanel() {
  const pageSize = 5;
  const [activeTab, setActiveTab] = useState<VerificationStatus>("pending");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [applicationMode, setApplicationMode] = useState<ModalMode>("add");
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<VerificationApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [resultModal, setResultModal] = useState({
    open: false,
    type: "success" as ActionResultType,
    title: "",
    description: "",
    details: "",
  });

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchJson<Record<string, unknown>[]>("/api/resident-applications");
      setApplications(data.map(mapApplication));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const data = await fetchJson<Record<string, unknown>[]>("/api/resident-applications");
        if (!cancelled) setApplications(data.map(mapApplication));
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load applications.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleApplications = useMemo(
    () => applications.filter((application) => application.status === activeTab),
    [activeTab, applications],
  );
  const paginatedApplications = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(visibleApplications.length / pageSize));
    const safePage = Math.min(page, totalPages);
    return {
      rows: visibleApplications.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: visibleApplications.length, totalPages } satisfies PaginationState,
    };
  }, [page, visibleApplications]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (page !== paginatedApplications.pagination.page) setPage(paginatedApplications.pagination.page);
  }, [page, paginatedApplications.pagination.page]);

  const counts = useMemo(() => ({
    pending: String(applications.filter((application) => application.status === "pending").length),
    approved: String(applications.filter((application) => application.status === "approved").length),
    rejected: String(applications.filter((application) => application.status === "rejected").length),
  }), [applications]);

  async function reviewApplication(action: "approved" | "rejected") {
    if (!selectedApplication) return;
    if (selectedApplication.status !== "pending") {
      setResultModal({
        open: true,
        type: "error",
        title: "Application Already Reviewed",
        description: "This application has already been reviewed.",
        details: "Approved and rejected applications are read-only.",
      });
      return;
    }

    const selectedFamilyId = selectedApplication.raw?.selected_family_id ?? selectedApplication.raw?.family_id;
    const body: Record<string, unknown> = {
      action,
      admin_review_notes: action === "approved" ? "Approved from SmartFlood admin dashboard" : "Rejected from SmartFlood admin dashboard",
    };

    if (action === "approved" && !selectedApplication.raw?.is_family_head) {
      body.selected_family_id = selectedFamilyId || window.prompt("Enter selected family ID for this resident");
    }

    try {
      await fetchJson(`/api/resident-applications/${selectedApplication.application_id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withAuditActor(body)),
      });
    } catch (reviewError) {
      setResultModal({
        open: true,
        type: "error",
        title: action === "approved" ? "Failed to Approve Application" : "Failed to Reject Application",
        description: reviewError instanceof Error ? reviewError.message : "Unable to review application",
        details: "The application status was not changed. Please try the review action again.",
      });
      return;
    }

    setIsReviewOpen(false);
    setSelectedApplication(null);
    await fetchApplications();
    setResultModal({
      open: true,
      type: action === "approved" ? "success" : "warning",
      title: action === "approved" ? "Application Approved Successfully" : "Application Rejected Successfully",
      description: action === "approved"
        ? "The resident application has been approved and moved to approved records."
        : "The resident application has been rejected and moved to rejected records.",
      details: "The applicant list and tab counts have been refreshed.",
    });
  }

  const emptyFormValues: ApplicationFormValues = {
    surname: "",
    firstName: "",
    middleName: "",
    contactNumber: "",
    ageSex: "",
    occupation: "",
    completeAddress: "",
    barangay: "",
    totalFamilyMembers: "",
    householdHead: "",
    specialNeeds: "",
    medicalConditions: "",
  };

  const formValues = emptyFormValues;

  return (
    <section className={styles.panel} aria-label="Resident account verification">
      <Tabs
        ariaLabel="Verification status"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "pending", label: "Pending Review", count: counts.pending, icon: <SmartFloodIcon name="pendingReview" size={20} /> },
          { key: "approved", label: "Approved", count: counts.approved, countTone: "green", icon: <SmartFloodIcon name="approved" size={20} /> },
          { key: "rejected", label: "Rejected", count: counts.rejected, countTone: "red", icon: <SmartFloodIcon name="rejected" size={20} /> },
        ]}
      />
      {error ? <ErrorState title="Unable to Load Applications" message={error} retryLabel="Retry" onRetry={fetchApplications} /> : null}
      {isLoading ? <LoadingState message="Loading applications..." /> : null}
      <div className={styles.list}>
        {paginatedApplications.rows.map((application, index) => (
          <ApplicationCard
            key={application.application_id || `${String(application.raw?.first_name ?? "")}-${String(application.raw?.last_name ?? "")}-${index}`}
            application={application}
            onReview={() => {
              setSelectedApplication(application);
              setIsReviewOpen(true);
            }}
          />
        ))}
        {!isLoading && visibleApplications.length === 0 ? (
          <EmptyState
            title={emptyTitleFor(activeTab)}
            description={emptyDescriptionFor(activeTab)}
          />
        ) : null}
      </div>
      <SharedPagination pagination={paginatedApplications.pagination} onPageChange={setPage} label="Resident applications" />
      <ReviewModal
        isOpen={isReviewOpen}
        application={selectedApplication}
        onApprove={() => reviewApplication("approved")}
        onReject={() => reviewApplication("rejected")}
        onClose={() => setIsReviewOpen(false)}
      />
      <ApplicationFormModal
        isOpen={isApplicationOpen}
        mode={applicationMode}
        values={formValues}
        onClose={() => setIsApplicationOpen(false)}
      />
      <ActionResultModal
        open={resultModal.open}
        type={resultModal.type}
        title={resultModal.title}
        description={resultModal.description}
        details={resultModal.details}
        primaryLabel="OK"
        onPrimary={() => setResultModal((current) => ({ ...current, open: false }))}
        onClose={() => setResultModal((current) => ({ ...current, open: false }))}
      />
    </section>
  );
}

function emptyTitleFor(status: VerificationStatus) {
  if (status === "approved") return "No approved applications";
  if (status === "rejected") return "No rejected applications";
  return "No pending applications";
}

function emptyDescriptionFor(status: VerificationStatus) {
  if (status === "approved") return "Approved resident applications will appear here.";
  if (status === "rejected") return "Rejected resident applications will appear here.";
  return "New resident account applications awaiting review will appear here.";
}

function mapApplication(row: Record<string, unknown>): VerificationApplication {
  const firstName = String(row.first_name ?? "");
  const lastName = String(row.last_name ?? "");
  const name = [firstName, row.middle_name, lastName].filter(Boolean).join(" ") || "Unnamed Applicant";
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "NA";

  return {
    application_id: row.application_id ? String(row.application_id) : undefined,
    initials,
    name,
    status: (row.status === "approved" || row.status === "rejected" ? row.status : "pending") as VerificationStatus,
    type: row.is_family_head ? "Family Head" : "Family Member",
    barangay: String(row.barangay_name ?? row.barangay ?? ""),
    familyMembers: String(row.total_family_members ?? ""),
    submitted: String(row.created_at ?? row.submitted_at ?? ""),
    phone: String(row.contact_number ?? ""),
    address: String(row.complete_address ?? ""),
    approvalNote: row.reviewed_at ? {
      approvedBy: `Reviewed ${String(row.reviewed_at)}`,
      details: String(row.admin_review_notes ?? ""),
    } : undefined,
    raw: row,
  };
}
