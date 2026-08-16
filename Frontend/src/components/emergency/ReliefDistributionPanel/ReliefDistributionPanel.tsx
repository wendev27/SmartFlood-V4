"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { AdminReliefAuditPanel } from "@/components/emergency/ReliefDistributionPanel/AdminReliefAuditPanel";
import { cn } from "@/lib/cn";
import { getCurrentUser, normalizeUserRole } from "@/lib/authSession";
import {
  confirmReliefDistribution,
  getReliefBeneficiaryStatus,
  getReliefCampaignHistory,
  getReliefDistributionHistory,
  reliefDistributionExportUrl,
  reliefDistributionScannerUrl,
  verifyReliefDistribution,
} from "@/services/emergencyService";
import type {
  ReliefCampaign,
  ReliefBeneficiaryStatusFilter,
  ReliefBeneficiaryStatusRow,
  ReliefDistributionAllocation,
  ReliefDistributionBeneficiary,
  ReliefDistributionRecord,
  ReliefDistributionVerifyResponse,
  ReliefReportSummary,
  Pagination,
} from "@/types/emergency";
import styles from "./ReliefDistributionPanel.module.css";

type LoadState = "idle" | "loading" | "verifying" | "confirming";
const pageSize = 5;

export function ReliefDistributionPanel() {
  const role = normalizeUserRole(getCurrentUser());
  if (role === "super" || role === "cswdd") return <AdminReliefAuditPanel />;

  const [campaigns, setCampaigns] = useState<ReliefCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<ReliefCampaign | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<ReliefDistributionVerifyResponse | null>(null);
  const [history, setHistory] = useState<ReliefDistributionRecord[]>([]);
  const [historyPagination, setHistoryPagination] = useState<Pagination | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRefreshVersion, setHistoryRefreshVersion] = useState(0);
  const [beneficiaryStatusRows, setBeneficiaryStatusRows] = useState<ReliefBeneficiaryStatusRow[]>([]);
  const [beneficiarySummary, setBeneficiarySummary] = useState<ReliefReportSummary | null>(null);
  const [beneficiaryPagination, setBeneficiaryPagination] = useState<Pagination | null>(null);
  const [beneficiaryFilter, setBeneficiaryFilter] = useState<ReliefBeneficiaryStatusFilter>("all");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [beneficiaryPage, setBeneficiaryPage] = useState(1);
  const [beneficiaryRefreshVersion, setBeneficiaryRefreshVersion] = useState(0);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeCampaigns = useMemo(() => campaigns.filter((campaign) => campaign.status === "in_distribution"), [campaigns]);
  const notReadyCampaigns = useMemo(
    () => campaigns.filter((campaign) => ["accepted", "barangays_notified"].includes(campaign.status)),
    [campaigns],
  );
  const historicalCampaigns = useMemo(
    () => campaigns.filter((campaign) => ["completed", "closed", "expired"].includes(campaign.status)),
    [campaigns],
  );
  const selectedIsActive = selectedCampaign?.status === "in_distribution";
  const selectedIsDistributable = Boolean(
    selectedCampaign?.status === "in_distribution"
    && (selectedCampaign.progress?.barangays ?? []).some((barangay) => barangay.barangay_status === "family_heads_notified"),
  );
  const receivedCount = historyPagination?.total ?? history.filter((record) => record.status === "received").length;
  const barangayCount = selectedCampaign?.progress?.total_barangays ?? selectedCampaign?.progress?.barangays?.length ?? 0;
  const selectedScope = selectedCampaign ? campaignScopeLabel(selectedCampaign) : "No campaign selected";

  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns() {
      try {
        setState("loading");
        const rows = await getReliefCampaignHistory();
        if (!cancelled) {
          setCampaigns(rows);
          setSelectedCampaign((current) => {
            if (current && rows.some((campaign) => campaign.batch_id === current.batch_id)) return current;
            return rows.find((campaign) => campaign.status === "in_distribution") ?? rows[0] ?? null;
          });
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load relief campaigns.");
      } finally {
        if (!cancelled) setState("idle");
      }
    }

    loadCampaigns();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaignHistory() {
      if (!selectedCampaign) {
        setHistory([]);
        setHistoryPagination(null);
        return;
      }

      try {
        setState("loading");
        const response = await getReliefDistributionHistory(selectedCampaign.batch_id, historyPage, pageSize);
        if (!cancelled) {
          setHistory(response.distributions);
          setHistoryPagination(response.pagination ?? null);
          setError(null);
        }
      } catch (historyError) {
        if (!cancelled) setError(historyError instanceof Error ? historyError.message : "Unable to load campaign distribution history.");
      } finally {
        if (!cancelled) setState("idle");
      }
    }

    loadCampaignHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedCampaign, historyPage, historyRefreshVersion]);

  useEffect(() => {
    let cancelled = false;

    async function loadBeneficiaryStatus() {
      if (!selectedCampaign) {
        setBeneficiaryStatusRows([]);
        setBeneficiarySummary(null);
        setBeneficiaryPagination(null);
        return;
      }

      try {
        const response = await getReliefBeneficiaryStatus(
          selectedCampaign.batch_id,
          beneficiaryFilter,
          beneficiarySearch,
          beneficiaryPage,
          pageSize,
        );
        if (!cancelled) {
          setBeneficiaryStatusRows(response.beneficiaries);
          setBeneficiarySummary(response.summary);
          setBeneficiaryPagination(response.pagination);
          setError(null);
        }
      } catch (statusError) {
        if (!cancelled) setError(statusError instanceof Error ? statusError.message : "Unable to load beneficiary distribution status.");
      }
    }

    loadBeneficiaryStatus();
    return () => {
      cancelled = true;
    };
  }, [selectedCampaign, beneficiaryFilter, beneficiarySearch, beneficiaryPage, beneficiaryRefreshVersion]);

  function selectCampaign(campaign: ReliefCampaign) {
    setSelectedCampaign(campaign);
    setIsSwitcherOpen(false);
    setIdentifier("");
    setResult(null);
    setBeneficiaryFilter("all");
    setBeneficiarySearch("");
    setBeneficiaryPage(1);
    setHistoryPage(1);
    setHistoryPagination(null);
    setMessage(null);
    setError(null);
  }

  function scanNextBeneficiary() {
    setIdentifier("");
    setResult(null);
    setMessage(null);
    setError(null);
  }

  function openScannerWindow() {
    if (!selectedCampaign || !selectedIsDistributable) return;
    window.open(reliefDistributionScannerUrl(selectedCampaign.batch_id), "_blank", "noopener,noreferrer");
  }

  function exportCampaignRecords() {
    if (!selectedCampaign) return;
    window.open(reliefDistributionExportUrl(selectedCampaign.batch_id), "_blank", "noopener,noreferrer");
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCampaign) {
      setError("Select a relief campaign before verifying beneficiaries.");
      return;
    }
    if (!selectedIsActive) {
      setError(`${selectedCampaign.plan_name} is ${formatStatus(selectedCampaign.status)} and cannot accept distributions.`);
      return;
    }

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("Enter a beneficiary QR, family ID, or resident ID.");
      return;
    }

    try {
      setState("verifying");
      setMessage(null);
      setError(null);
      const verification = await verifyReliefDistribution(selectedCampaign.batch_id, trimmed);
      setResult(verification);
      if (verification.result === "ELIGIBLE") setMessage(`Beneficiary is eligible for ${selectedCampaign.plan_name}.`);
      if (verification.result === "ALREADY_RECEIVED") setMessage(`Relief already received for ${selectedCampaign.plan_name}.`);
      if (!["ELIGIBLE", "ALREADY_RECEIVED"].includes(verification.result)) setError(resultMessage(verification));
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify beneficiary.");
      setResult(null);
    } finally {
      setState("idle");
    }
  }

  async function handleConfirm() {
    if (!selectedCampaign || !identifier.trim() || result?.result !== "ELIGIBLE") return;

    try {
      setState("confirming");
      setMessage(null);
      setError(null);
      const confirmation = await confirmReliefDistribution(selectedCampaign.batch_id, identifier.trim(), result.data?.allocation?.item_id);
      setResult(confirmation);
      if (confirmation.result === "RECEIVED") {
        setMessage(`Relief distribution confirmed for ${selectedCampaign.plan_name}.`);
        const distribution = confirmation.data?.distribution;
        if (distribution) setHistory((current) => [distribution, ...current.filter((row) => row.distribution_id !== distribution.distribution_id)]);
        setBeneficiaryRefreshVersion((version) => version + 1);
        setHistoryRefreshVersion((version) => version + 1);
      } else if (confirmation.result === "ALREADY_RECEIVED") {
        setMessage(`Relief already received for ${selectedCampaign.plan_name}.`);
      } else {
        setError(resultMessage(confirmation));
      }
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Unable to confirm relief distribution.");
    } finally {
      setState("idle");
    }
  }

  return (
    <section className={styles.stack} aria-label="QR relief distribution">
      <div className={styles.summary}>
        <div>
          <span>Selected Relief Program</span>
          <h3>{selectedCampaign?.plan_name ?? "No Relief Program Selected"}</h3>
          <p>{selectedCampaign ? selectedStatusCopy(selectedCampaign) : "Choose a campaign to view records or start beneficiary verification."}</p>
        </div>
        <div className={styles.summaryAside}>
          <div className={styles.summaryStats}>
            <Metric label="Status" value={selectedCampaign ? formatStatus(selectedCampaign.status) : "-"} compact />
            <Metric label="Received" value={selectedCampaign ? receivedCount : "-"} compact />
          </div>
          <button className={styles.switchButton} type="button" onClick={() => setIsSwitcherOpen(true)}>
            Switch Relief Program
          </button>
        </div>
      </div>

      {message ? <p className={styles.stateMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      {selectedCampaign ? (
        <section className={cn(styles.card, styles.selectedCampaignCard)}>
          <header className={styles.cardHeader}>
            <span>Campaign Summary</span>
            <h3>{selectedCampaign.plan_name}</h3>
            <p>{selectedIsActive ? "This campaign is open for barangay beneficiary verification." : "This campaign is read-only."}</p>
          </header>
          <dl className={styles.details}>
            <Detail label="Strategy" value={selectedCampaign.plan_id.replace(/_/g, " ")} />
            <Detail label="Status" value={formatStatus(selectedCampaign.status)} />
            <Detail label="Started" value={formatDate(selectedCampaign.started_at ?? selectedCampaign.accepted_at ?? selectedCampaign.created_at)} />
            <Detail label="Barangays" value={String(barangayCount)} />
            <Detail label="Received" value={String(receivedCount)} />
            <Detail label="Barangay Scope" value={selectedScope} />
          </dl>
          <div className={styles.actionRow}>
            <button className={styles.primaryButton} type="button" disabled={!selectedIsDistributable} onClick={openScannerWindow}>
              Open QR Scanner
            </button>
            <button className={styles.secondaryButton} type="button" onClick={exportCampaignRecords}>
              Export Excel
            </button>
          </div>
          {!selectedIsDistributable && selectedCampaign.status === "in_distribution" ? (
            <p className={styles.warningMessage}>Your barangay allocation is not ready for beneficiary QR distribution yet.</p>
          ) : null}
        </section>
      ) : null}

      {selectedCampaign ? <div className={styles.layout}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <span>Step 2</span>
            <h3>Enter / Scan Beneficiary QR</h3>
            <p>
              {selectedIsActive
                ? `Verifying beneficiary for: ${selectedCampaign.plan_name}. Verification does not mark relief as received.`
                : `${selectedCampaign.plan_name} is ${formatStatus(selectedCampaign.status)} and cannot accept new distributions.`}
            </p>
          </header>
          {selectedIsDistributable ? <form className={styles.verifyForm} onSubmit={handleVerify}>
            <label>
              Beneficiary QR / Identifier
              <input
                autoComplete="off"
                placeholder="family:uuid or resident:uuid"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>
            <button className={styles.primaryButton} type="submit" disabled={state === "verifying" || state === "confirming"}>
              {state === "verifying" ? "Verifying..." : "Verify Beneficiary"}
            </button>
          </form> : <div className={styles.emptyState}>{distributionUnavailableCopy(selectedCampaign)}</div>}
        </section>

        <DistributionResultCard
          allocation={result?.data?.allocation ?? null}
          beneficiary={result?.data?.beneficiary ?? null}
          distribution={result?.data?.distribution ?? result?.data?.existing_distribution ?? null}
          campaign={selectedCampaign}
          onConfirm={handleConfirm}
          onScanNext={scanNextBeneficiary}
          result={result}
          state={state}
        />
      </div> : (
        <section className={styles.card}>
          <div className={styles.emptyState}>Select a relief program to view distribution tools and records.</div>
        </section>
      )}

      {selectedCampaign ? (
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <span>Beneficiary Distribution Status</span>
            <h3>Campaign Beneficiary Status</h3>
            <p>Campaign-scoped eligibility and receipt status for your barangay.</p>
          </header>
          <div className={styles.summaryStats}>
            <Metric label="Eligible" value={beneficiarySummary?.eligible ?? 0} compact />
            <Metric label="Received" value={beneficiarySummary?.received ?? 0} compact />
            <Metric label="Not Received" value={beneficiarySummary?.not_received ?? 0} compact />
            <Metric label="Coverage" value={beneficiarySummary ? `${beneficiarySummary.coverage}%` : "0%"} compact />
          </div>
          <div className={styles.filterBar}>
            <div className={styles.segmented} aria-label="Beneficiary status filter">
              {(["all", "received", "not_received"] as ReliefBeneficiaryStatusFilter[]).map((filter) => (
                <button
                  className={beneficiaryFilter === filter ? styles.activeSegment : undefined}
                  key={filter}
                  type="button"
                  onClick={() => {
                    setBeneficiaryFilter(filter);
                    setBeneficiaryPage(1);
                  }}
                >
                  {beneficiaryFilterLabel(filter)}
                </button>
              ))}
            </div>
            <label className={styles.searchField}>
              <span>Search</span>
              <input
                placeholder="Search family or family head..."
                value={beneficiarySearch}
                onChange={(event) => {
                  setBeneficiarySearch(event.target.value);
                  setBeneficiaryPage(1);
                }}
              />
            </label>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Family</th>
                  <th>Family Head</th>
                  <th>Status</th>
                  <th>Received At</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaryStatusRows.length === 0 ? (
                  <tr><td colSpan={4}>No beneficiaries match this campaign status view.</td></tr>
                ) : beneficiaryStatusRows.map((row) => (
                  <tr key={row.family_id}>
                    <td>{row.family_name}</td>
                    <td>{row.family_head_name ?? "Not recorded"}</td>
                    <td>{row.status_label}</td>
                    <td>{row.received_at ? formatDate(row.received_at) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SharedPagination pagination={beneficiaryPagination} onPageChange={setBeneficiaryPage} label="Beneficiary status" />
        </section>
      ) : null}

      {selectedCampaign ? <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span>Campaign Records</span>
          <h3>Distribution History</h3>
          <p>Confirmed relief records for {selectedCampaign.plan_name}.</p>
        </header>
        {state === "loading" ? (
          <div className={styles.emptyState}>Loading distribution history...</div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>No confirmed relief distributions for this campaign yet.</div>
        ) : (
          <div className={styles.historyList}>
            {history.map((record) => (
              <article key={record.distribution_id}>
                <div>
                  <strong>{record.family_name ?? "Family"}</strong>
                  <span>{record.family_head_name ?? "Family head not recorded"} • {record.barangay_name ?? `Barangay ${record.barangay_id}`} • {formatStatus(record.status)}</span>
                </div>
                <time>{formatDate(record.verified_at)}</time>
              </article>
            ))}
          </div>
        )}
        <SharedPagination pagination={historyPagination} onPageChange={setHistoryPage} label="Distribution history" />
      </section> : null}

      <Modal
        className={styles.switcherDialog}
        isOpen={isSwitcherOpen}
        labelledBy="relief-campaign-switcher-title"
        onClose={() => setIsSwitcherOpen(false)}
        size="xl"
      >
        <header className={styles.switcherHeader}>
          <div>
            <span>Relief Program Switcher</span>
            <h3 id="relief-campaign-switcher-title">Switch Relief Program</h3>
            <p>Select the campaign batch to use for records, verification, and duplicate checks.</p>
          </div>
          <button type="button" onClick={() => setIsSwitcherOpen(false)} aria-label="Close campaign switcher">
            x
          </button>
        </header>
        <div className={styles.switcherBody}>
          <CampaignGroup
            actionLabel="Open Distribution"
            campaigns={activeCampaigns}
            emptyText="No relief programs are currently in distribution."
            label="Active"
            onSelect={selectCampaign}
            selectedBatchId={selectedCampaign?.batch_id ?? null}
          />
          <CampaignGroup
            actionLabel="View Status"
            campaigns={notReadyCampaigns}
            emptyText="No accepted or notified campaigns are waiting for distribution."
            label="Not Ready"
            onSelect={selectCampaign}
            selectedBatchId={selectedCampaign?.batch_id ?? null}
          />
          <CampaignGroup
            actionLabel="View Records"
            campaigns={historicalCampaigns}
            emptyText="No completed, closed, or expired relief history yet."
            label="History"
            onSelect={selectCampaign}
            selectedBatchId={selectedCampaign?.batch_id ?? null}
          />
        </div>
      </Modal>
    </section>
  );
}

function CampaignGroup({
  actionLabel,
  campaigns,
  emptyText,
  label,
  onSelect,
  selectedBatchId,
}: {
  actionLabel: string;
  campaigns: ReliefCampaign[];
  emptyText: string;
  label: string;
  onSelect: (campaign: ReliefCampaign) => void;
  selectedBatchId: string | null;
}) {
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const paginatedCampaigns = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(campaigns.length / pageSize));
    const safePage = Math.min(page, totalPages);
    return {
      rows: campaigns.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: campaigns.length, totalPages } satisfies PaginationState,
    };
  }, [campaigns, page]);

  useEffect(() => {
    setPage(1);
  }, [campaigns]);

  useEffect(() => {
    if (page !== paginatedCampaigns.pagination.page) setPage(paginatedCampaigns.pagination.page);
  }, [page, paginatedCampaigns.pagination.page]);

  return (
    <div className={styles.campaignGroup}>
      <h4>{label}</h4>
      {campaigns.length === 0 ? <p className={styles.emptyState}>{emptyText}</p> : paginatedCampaigns.rows.map((campaign) => (
        <button
          className={cn(styles.campaignButton, selectedBatchId === campaign.batch_id && styles.selectedCampaignButton)}
          key={campaign.batch_id}
          type="button"
          onClick={() => onSelect(campaign)}
        >
          <span>{campaign.plan_name}</span>
          <strong>{formatStatus(campaign.status)}</strong>
          <small>{campaignTiming(campaign)}</small>
          <small>{campaign.progress?.total_distributions ?? 0} received</small>
          <em>{campaignReadinessCopy(campaign.status)}</em>
          <b>{actionLabel}</b>
        </button>
      ))}
      <SharedPagination pagination={paginatedCampaigns.pagination} onPageChange={setPage} label={`${label} campaigns`} />
    </div>
  );
}

function DistributionResultCard({
  allocation,
  beneficiary,
  campaign,
  distribution,
  onConfirm,
  onScanNext,
  result,
  state,
}: {
  allocation: ReliefDistributionAllocation | null;
  beneficiary: ReliefDistributionBeneficiary | null;
  campaign: ReliefCampaign;
  distribution: ReliefDistributionRecord | null;
  onConfirm: () => void;
  onScanNext: () => void;
  result: ReliefDistributionVerifyResponse | null;
  state: LoadState;
}) {
  const tone = useMemo(() => resultTone(result?.result), [result?.result]);

  if (!result) {
    return (
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span>Step 3</span>
          <h3>Beneficiary Result</h3>
          <p>Verification results for {campaign.plan_name} will appear here after scanning or manual entry.</p>
        </header>
        <div className={styles.emptyState}>No beneficiary verified yet.</div>
      </section>
    );
  }

  return (
    <section className={cn(styles.card, styles.resultCard, styles[tone])}>
      <header className={styles.cardHeader}>
        <span>Step 3</span>
        <h3>{resultTitle(result.result)}</h3>
        <p>{result.reason ?? resultSubtitle(result.result, campaign.plan_name)}</p>
      </header>

      {beneficiary ? (
        <dl className={styles.details}>
          <Detail label="Family" value={beneficiary.family_name} />
          <Detail label="Family Head" value={beneficiary.family_head_name ?? "Not recorded"} />
          <Detail label="Barangay" value={beneficiary.barangay_name} />
          <Detail label="Family Members" value={String(beneficiary.total_family_members || "Not recorded")} />
        </dl>
      ) : null}

      {allocation ? (
        <div className={styles.allocationBox}>
          <span>Active Emergency Allocation</span>
          <strong>{allocation.batch?.plan_name ?? campaign.plan_name}</strong>
          <p>{allocation.family_food_packs} food packs • {allocation.emergency_kits} emergency kits • {allocation.individual_relief_goods} relief goods</p>
        </div>
      ) : null}

      {distribution ? (
        <div className={styles.duplicateBox}>
          <strong>Received: {formatDate(distribution.verified_at)}</strong>
          <span>Verified by: {distribution.verified_by_name ?? shortId(distribution.verified_by)}</span>
          <span>Distribution ID: {shortId(distribution.distribution_id)}</span>
        </div>
      ) : null}

      {result.result === "ELIGIBLE" ? (
        <button className={styles.primaryButton} type="button" disabled={state === "confirming"} onClick={onConfirm}>
          {state === "confirming" ? "Confirming..." : "Confirm Relief Received"}
        </button>
      ) : null}

      {result.result === "RECEIVED" ? (
        <button className={styles.secondaryButton} type="button" onClick={onScanNext}>
          Scan Next Beneficiary
        </button>
      ) : null}
    </section>
  );
}


function Metric({ compact = false, label, value }: { compact?: boolean; label: string; value: number | string }) {
  return (
    <div className={cn(styles.metric, compact && styles.compactMetric)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function resultTone(result?: string) {
  if (result === "ELIGIBLE" || result === "RECEIVED") return "success";
  if (result === "ALREADY_RECEIVED") return "warning";
  if (!result) return "neutral";
  return "danger";
}

function resultTitle(result: string) {
  if (result === "ELIGIBLE") return "Eligible for Relief";
  if (result === "RECEIVED") return "Relief Distribution Confirmed";
  if (result === "ALREADY_RECEIVED") return "Relief Already Received";
  if (result === "CAMPAIGN_NOT_ACTIVE") return "Campaign Not Active";
  if (result === "WRONG_BARANGAY") return "Wrong Barangay";
  if (result === "NOT_ELIGIBLE") return "Beneficiary Not Eligible";
  if (result === "UNAUTHORIZED") return "Unauthorized";
  return "Beneficiary Not Eligible";
}

function resultSubtitle(result: string, campaignName = "this campaign") {
  if (result === "ELIGIBLE") return `This family can receive relief for ${campaignName}.`;
  if (result === "RECEIVED") return `This family has now been marked as received for ${campaignName}.`;
  if (result === "ALREADY_RECEIVED") return `This family already received relief for ${campaignName}.`;
  if (result === "CAMPAIGN_NOT_ACTIVE") return `${campaignName} cannot accept new distributions.`;
  return "The beneficiary could not be cleared for relief distribution.";
}

function resultMessage(response: ReliefDistributionVerifyResponse) {
  return response.reason || resultSubtitle(response.result);
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function campaignTiming(campaign: ReliefCampaign) {
  if (campaign.status === "in_distribution") return `Started ${formatDate(campaign.started_at ?? campaign.accepted_at ?? campaign.created_at)}`;
  if (campaign.status === "closed") return `Closed ${formatDate(campaign.closed_at)}`;
  if (campaign.status === "expired") return `Expired ${formatDate(campaign.expires_at)}`;
  if (campaign.status === "completed") return `Completed ${formatDate(campaign.closed_at ?? campaign.expires_at)}`;
  return `Created ${formatDate(campaign.created_at)}`;
}

function campaignReadinessCopy(status: string) {
  if (status === "in_distribution") return "Open for beneficiary verification.";
  if (status === "accepted") return "Distribution has not started yet.";
  if (status === "barangays_notified") return "Distribution not started. Family-head notification and preparation are still incomplete.";
  return "Read-only campaign records.";
}

function selectedStatusCopy(campaign: ReliefCampaign) {
  if (campaign.status === "in_distribution") return "Verification and confirmation are scoped to this selected batch.";
  if (campaign.status === "accepted") return "Distribution has not started yet. Records are view-only here.";
  if (campaign.status === "barangays_notified") return "Distribution not started. Family-head notification and distribution preparation are still incomplete.";
  return "Historical campaign selected. Verification and confirmation are disabled.";
}

function campaignScopeLabel(campaign: ReliefCampaign) {
  const barangays = campaign.progress?.barangays ?? [];
  if (barangays.length === 1) return barangays[0]?.barangay_name || "Assigned barangay";
  if (barangays.length > 1) return `${barangays.length} barangays`;
  return "Visible scope";
}

function distributionUnavailableCopy(campaign: ReliefCampaign) {
  if (campaign.status === "in_distribution") return "Your barangay allocation is not ready for beneficiary QR distribution yet.";
  if (campaign.status === "barangays_notified") return "Distribution not started. Family-head notification and distribution preparation are still incomplete.";
  if (campaign.status === "accepted") return "Distribution has not started yet.";
  return "Historical campaigns are view-only.";
}

function beneficiaryFilterLabel(filter: ReliefBeneficiaryStatusFilter) {
  if (filter === "received") return "Received";
  if (filter === "not_received") return "Not Received";
  return "All";
}

function shortId(value?: string | null) {
  if (!value) return "Not recorded";
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}

function formatStatus(value?: string | null) {
  const text = String(value ?? "").replace(/_/g, " ").trim();
  return text ? text.replace(/\b\w/g, (char) => char.toUpperCase()) : "Unknown";
}
