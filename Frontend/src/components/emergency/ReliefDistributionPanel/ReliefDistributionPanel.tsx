"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/Modal/Modal";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { AdminReliefAuditPanel } from "@/components/emergency/ReliefDistributionPanel/AdminReliefAuditPanel";
import { cn } from "@/lib/cn";
import { normalizeBarangayForCompare } from "@/lib/formatters";
import { getCurrentUser, normalizeUserRole, userDisplayName } from "@/lib/authSession";
import { downloadReliefHistoryReport } from "@/lib/reliefHistoryReport";
import {
  confirmReliefDistribution,
  getReliefBeneficiaryStatus,
  getReliefCampaignHistory,
  getReliefDistributionHistory,
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

export function ReliefDistributionPanel({
  mode = "distribution",
  barangayScope,
  forceBarangayView = false,
}: {
  mode?: "distribution" | "history";
  barangayScope?: string;
  forceBarangayView?: boolean;
}) {
  const currentUser = getCurrentUser();
  const role = normalizeUserRole(currentUser);
  if (!forceBarangayView && (role === "super" || role === "cswdd")) return <AdminReliefAuditPanel />;

  const [campaigns, setCampaigns] = useState<ReliefCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<ReliefCampaign | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<ReliefDistributionVerifyResponse | null>(null);
  const [verificationError, setVerificationError] = useState("");
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
  const [historyType, setHistoryType] = useState<"Family / Individual" | "Family" | "Individual">("Family / Individual");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [isHistoryDateOpen, setIsHistoryDateOpen] = useState(false);
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
  const barangayCount = barangayScope ? 1 : selectedCampaign?.progress?.total_barangays ?? selectedCampaign?.progress?.barangays?.length ?? 0;
  const selectedScope = barangayScope || (selectedCampaign ? campaignScopeLabel(selectedCampaign) : "No campaign selected");
  const filteredDistributionHistory = useMemo(() => history.filter((record) => {
    const timestamp = record.verified_at ?? record.created_at;
    if (!timestamp) return !historyStartDate && !historyEndDate;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return false;
    const day = localDateKey(date);
    return (!historyStartDate || day >= historyStartDate) && (!historyEndDate || day <= historyEndDate);
  }), [history, historyEndDate, historyStartDate]);

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
          const scopedDistributions = barangayScope
            ? response.distributions.filter((record) => sameBarangay(record.barangay_name, barangayScope))
            : response.distributions;
          setHistory(scopedDistributions);
          setHistoryPagination(response.pagination ? { ...response.pagination, total: scopedDistributions.length, totalPages: Math.max(1, Math.ceil(scopedDistributions.length / pageSize)) } : null);
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
  }, [barangayScope, selectedCampaign, historyPage, historyRefreshVersion]);

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
          const scopedBeneficiaries = barangayScope
            ? response.beneficiaries.filter((beneficiary) => sameBarangay(beneficiary.barangay_name, barangayScope))
            : response.beneficiaries;
          setBeneficiaryStatusRows(scopedBeneficiaries);
          const scopedReceived = scopedBeneficiaries.filter((beneficiary) => beneficiary.status === "received").length;
          setBeneficiarySummary(barangayScope ? {
            ...response.summary,
            barangays: scopedBeneficiaries.length > 0 ? 1 : 0,
            eligible: scopedBeneficiaries.length,
            received: scopedReceived,
            not_received: scopedBeneficiaries.length - scopedReceived,
            coverage: scopedBeneficiaries.length > 0 ? Math.round((scopedReceived / scopedBeneficiaries.length) * 100) : 0,
          } : response.summary);
          setBeneficiaryPagination({ ...response.pagination, total: scopedBeneficiaries.length, totalPages: Math.max(1, Math.ceil(scopedBeneficiaries.length / pageSize)) });
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
  }, [barangayScope, selectedCampaign, beneficiaryFilter, beneficiarySearch, beneficiaryPage, beneficiaryRefreshVersion]);

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

  async function openQrCode() {
    if (!selectedCampaign) return;
    setIsQrOpen(true);
    setQrError("");
    try {
      setQrDataUrl(await QRCode.toDataURL(JSON.stringify({
        type: "SMARTFLOOD_RELIEF_CAMPAIGN",
        batchId: selectedCampaign.batch_id,
        campaign: selectedCampaign.plan_name,
        barangay: selectedScope,
      }), { width: 360, margin: 2, errorCorrectionLevel: "M" }));
    } catch {
      setQrError("Unable to generate the campaign QR code.");
    }
  }

  async function exportCampaignRecords() {
    if (!selectedCampaign) return;
    const allHistory = await fetchAllDistributionHistory(selectedCampaign.batch_id);
    downloadReliefHistoryReport({
      campaign: selectedCampaign,
      history: allHistory,
      summary: beneficiarySummary,
      scopeLabel: selectedScope,
      generatedBy: userDisplayName(currentUser) || undefined,
    });
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCampaign) {
      setVerificationError("Select a relief campaign before verifying beneficiaries.");
      return;
    }
    const trimmed = identifier.trim();
    if (!trimmed) {
      setVerificationError("Enter a beneficiary QR, family ID, or resident ID.");
      return;
    }

    try {
      setState("verifying");
      setMessage(null);
      setError(null);
      setVerificationError("");
      const verification = await verifyReliefDistribution(selectedCampaign.batch_id, trimmed);
      setResult(verification);
      if (verification.result === "ELIGIBLE") setMessage(`Beneficiary is eligible for ${selectedCampaign.plan_name}.`);
      if (verification.result === "ALREADY_RECEIVED") setMessage(`Relief already received for ${selectedCampaign.plan_name}.`);
      if (!["ELIGIBLE", "ALREADY_RECEIVED"].includes(verification.result)) setMessage(null);
    } catch {
      setVerificationError("Invalid UUID");
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

  if (mode === "history") {
    const showFamilies = historyType !== "Individual";
    const showIndividuals = historyType !== "Family";
    return (
      <section className={styles.polishedHistory} aria-label="Relief distribution history">
        {error ? <p className={styles.errorMessage}>{error}</p> : null}
        <div className={styles.historyFilterRow}>
          <label><span>Barangay</span><select value={selectedCampaign?.batch_id ?? ""} onChange={(event) => { const campaign = campaigns.find((item) => item.batch_id === event.target.value); if (campaign) selectCampaign(campaign); }}>{campaigns.length === 0 ? <option value="">No barangay campaigns</option> : campaigns.map((campaign) => <option key={campaign.batch_id} value={campaign.batch_id}>{campaignScopeLabel(campaign)}</option>)}</select></label>
          <label><span>Type of</span><select value={historyType} onChange={(event) => setHistoryType(event.target.value as typeof historyType)}><option>Family / Individual</option><option>Family</option><option>Individual</option></select></label>
          <div className={styles.dateRangeControl}>
            <span>Date Range</span>
            <button type="button" aria-expanded={isHistoryDateOpen} onClick={() => setIsHistoryDateOpen((open) => !open)}><CalendarIcon />{historyDateLabel(historyStartDate, historyEndDate)}<ChevronIcon /></button>
            {isHistoryDateOpen ? <div className={styles.datePopover}>
              <label>Start date<input type="date" value={historyStartDate} max={historyEndDate || undefined} onChange={(event) => setHistoryStartDate(event.target.value)} /></label>
              <label>End date<input type="date" value={historyEndDate} min={historyStartDate || undefined} onChange={(event) => setHistoryEndDate(event.target.value)} /></label>
              <button type="button" onClick={() => setIsHistoryDateOpen(false)}>Apply Date Range</button>
            </div> : null}
          </div>
        </div>

        <section className={styles.historyTables} aria-label="Relief distribution records">
          {showFamilies ? <HistoryRecordsTable label="Family" records={filteredDistributionHistory} /> : null}
          {showIndividuals ? <HistoryRecordsTable label="Individual" records={[]} /> : null}
        </section>
        <SharedPagination compact pagination={historyPagination} onPageChange={setHistoryPage} label="Distribution history" />
      </section>
    );
  }

  if (mode === "distribution") {
    return (
      <section className={styles.polishedDistribution} aria-label="Relief distribution">
        {message ? <p className={styles.stateMessage}>{message}</p> : null}
        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        <section className={styles.allocationSummaryCard}>
          <div className={styles.allocationTitleRow}>
            <h2>{selectedCampaign ? `${selectedScope} Allocation` : "No Relief Program Selected"}</h2>
          </div>
          {selectedCampaign ? <>
            <dl className={styles.polishedDetails}>
              <Detail label="Visit Date" value={formatDate(selectedCampaign.started_at ?? selectedCampaign.accepted_at ?? selectedCampaign.created_at)} />
              <Detail label="Barangay" value={String(barangayCount)} />
              <Detail label="Received" value={String(receivedCount)} />
              <Detail label="Barangay Scope" value={selectedScope} />
            </dl>
            <div className={styles.polishedActions}>
              <button type="button" disabled={!selectedCampaign} onClick={openQrCode}><ScanIcon />Open QR Code</button>
              <button type="button" onClick={exportCampaignRecords}><DownloadIcon />Export Excel</button>
            </div>
          </> : <div className={styles.polishedEmpty}>Select an active relief program to begin distribution.</div>}
        </section>

        <div className={styles.verificationGrid}>
          <section>
            <form onSubmit={handleVerify}>
              <label htmlFor="beneficiary-identifier">Enter Family/Individual UUID*</label>
              <div className={styles.identifierRow}>
                <input type="text" id="beneficiary-identifier" value={identifier} onChange={(event) => { setIdentifier(event.target.value); setVerificationError(""); setResult(null); }} placeholder="Enter family or individual UUID" disabled={!selectedCampaign} />
                <button type="submit" disabled={!selectedCampaign || !identifier.trim() || state === "verifying"}>{state === "verifying" ? "Verifying..." : "Verify"}</button>
              </div>
            </form>
          </section>
          <section>
            <h2>Beneficiary Result</h2>
            <div
              className={cn(
                styles.resultField,
                result && styles.resultFieldActive,
                (verificationError || (result && !["ELIGIBLE", "RECEIVED", "ALREADY_RECEIVED"].includes(result.result))) && styles.resultFieldError,
              )}
              role={verificationError || (result && !["ELIGIBLE", "RECEIVED", "ALREADY_RECEIVED"].includes(result.result)) ? "alert" : undefined}
            >
              {verificationError || (result ? resultTitle(result.result) : "Result")}
            </div>
            {result?.result === "ELIGIBLE" ? <button className={styles.confirmButton} type="button" disabled={state === "confirming"} onClick={handleConfirm}>{state === "confirming" ? "Confirming..." : "Confirm Relief Received"}</button> : null}
          </section>
        </div>
        <p className={styles.uuidHint}>Enter the UUID (Universal Unique Identifier) if the QR cannot be scanned.</p>

        <section className={styles.distributionFilters}>
          <button className={styles.allFilter} type="button" onClick={() => { setBeneficiaryFilter("all"); setBeneficiarySearch(""); setBeneficiaryPage(1); }}>All</button>
          <label><SearchIcon /><input value={beneficiarySearch} onChange={(event) => { setBeneficiarySearch(event.target.value); setBeneficiaryPage(1); }} placeholder="Search family name or full name" /></label>
          <button className={styles.zoneFilter} type="button"><PinIcon />Barangay Zone</button>
        </section>

        <section className={styles.distributionTableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.reportTable}>
              <thead><tr><th>Family</th><th>Assigned Relief</th><th>Status</th><th>Scheduled Date</th><th>Received At</th></tr></thead>
              <tbody>
                {beneficiaryStatusRows.length === 0 ? <tr><td colSpan={5}>No beneficiaries match this relief program.</td></tr> : beneficiaryStatusRows.map((row) => (
                  <tr key={row.family_id}>
                    <td>{row.family_name}</td><td>Relief allocation</td><td className={styles.statusCell}>{row.status_label}</td>
                    <td>{formatDate(selectedCampaign?.started_at ?? selectedCampaign?.accepted_at ?? selectedCampaign?.created_at)}</td>
                    <td>{row.received_at ? formatDate(row.received_at) : "——"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <SharedPagination compact pagination={beneficiaryPagination} onPageChange={setBeneficiaryPage} label="Beneficiaries" />

        <Modal className={styles.switcherDialog} isOpen={isSwitcherOpen} labelledBy="relief-campaign-switcher-title" onClose={() => setIsSwitcherOpen(false)} size="xl">
          <header className={styles.switcherHeader}><div><span>Relief Program Switcher</span><h3 id="relief-campaign-switcher-title">Switch Relief Program</h3><p>Select the campaign batch to use for records and verification.</p></div><button type="button" onClick={() => setIsSwitcherOpen(false)} aria-label="Close campaign switcher">×</button></header>
          <div className={styles.switcherBody}>
            <CampaignGroup actionLabel="Open Distribution" campaigns={activeCampaigns} emptyText="No relief programs are currently in distribution." label="Active" onSelect={selectCampaign} selectedBatchId={selectedCampaign?.batch_id ?? null} />
            <CampaignGroup actionLabel="View Status" campaigns={notReadyCampaigns} emptyText="No accepted or notified campaigns are waiting for distribution." label="Not Ready" onSelect={selectCampaign} selectedBatchId={selectedCampaign?.batch_id ?? null} />
          </div>
        </Modal>
        <Modal className={styles.qrDialog} isOpen={isQrOpen} labelledBy="relief-qr-title" onClose={() => setIsQrOpen(false)} size="sm">
          <header className={styles.qrHeader}>
            <div><span>Resident Relief Distribution</span><h3 id="relief-qr-title">Scan Relief QR Code</h3><p>Residents can scan this code for the selected relief campaign.</p></div>
            <button type="button" onClick={() => setIsQrOpen(false)} aria-label="Close QR code">×</button>
          </header>
          <div className={styles.qrBody}>
            {qrDataUrl ? <img src={qrDataUrl} alt={`QR code for ${selectedCampaign?.plan_name ?? "relief campaign"}`} /> : null}
            {!qrDataUrl && !qrError ? <p>Generating QR code...</p> : null}
            {qrError ? <p className={styles.qrError}>{qrError}</p> : null}
            <div className={styles.qrCampaign}><span>{selectedScope}</span></div>
            {qrDataUrl ? <a href={qrDataUrl} download={`smartflood-${selectedCampaign?.batch_id ?? "relief"}-qr.png`}>Download QR Code</a> : null}
          </div>
        </Modal>
      </section>
    );
  }

  return (
    <section className={cn(styles.stack, mode === "history" ? styles.historyMode : styles.distributionMode)} aria-label={mode === "history" ? "Relief distribution history" : "QR relief distribution"}>
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
            <h3>{selectedScope} Allocation</h3>
            <p>{selectedIsActive ? "This campaign is open for barangay beneficiary verification." : "This campaign is read-only."}</p>
          </header>
          <dl className={styles.details}>
            <Detail label="Visit Date" value={formatDate(selectedCampaign.started_at ?? selectedCampaign.accepted_at ?? selectedCampaign.created_at)} />
            <Detail label="Barangay" value={String(barangayCount)} />
            <Detail label="Received" value={String(receivedCount)} />
            <Detail label="Barangay Scope" value={selectedScope} />
          </dl>
          <div className={styles.actionRow}>
            <button className={styles.primaryButton} type="button" disabled={!selectedCampaign} onClick={openQrCode}>
              Open QR Code
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
            <h3>Enter Family/Individual UUID*</h3>
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
                placeholder="Historical campaigns are view-only"
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
              {(["all", "received", "not_received"] as string[]).map((filterValue) => {
                const filter = filterValue as ReliefBeneficiaryStatusFilter;
                return (
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
                );
              })}
            </div>
            <label className={styles.searchField}>
              <span>Search</span>
              <input
                placeholder="Search family name or full name"
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
                  <th>Assigned Relief</th>
                  <th>Status</th>
                  <th>Scheduled Date</th>
                  <th>Received At</th>
                </tr>
              </thead>
              <tbody>
                {beneficiaryStatusRows.length === 0 ? (
                  <tr><td colSpan={5}>No beneficiaries match this campaign status view.</td></tr>
                ) : beneficiaryStatusRows.map((row) => (
                  <tr key={row.family_id}>
                    <td>{row.family_name}</td>
                    <td>Relief allocation</td>
                    <td>{row.status_label}</td>
                    <td>{formatDate(selectedCampaign.started_at ?? selectedCampaign.accepted_at ?? selectedCampaign.created_at)}</td>
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

function HistoryRecordsTable({ label, records }: { label: "Family" | "Individual"; records: ReliefDistributionRecord[] }) {
  return (
    <div className={styles.historyTableBlock}>
      <table className={styles.polishedHistoryTable}>
        <thead><tr><th>ID</th><th>{label === "Family" ? "Family Name" : "Last Name"}</th><th>{label === "Family" ? "Family Head" : "First Name"}</th><th>Status</th><th>Type of</th></tr></thead>
        <tbody>
          {records.length === 0 ? <tr><td colSpan={5}>No {label.toLowerCase()} distribution records found.</td></tr> : records.map((record) => (
            <tr key={record.distribution_id}>
              <td>{shortId(record.family_id)}</td>
              <td>{record.family_name ?? "Family"}</td>
              <td>{record.family_head_name ?? "Not recorded"}</td>
              <td className={styles.receivedStatus}>{formatStatus(record.status)}</td>
              <td className={styles.receivedStatus}>{label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScanIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M8 8h8v8H8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function DownloadIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function SearchIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function PinIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2"/></svg>; }
function CalendarIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function ChevronIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>; }


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
  if (["INVALID_UUID", "INVALID_IDENTIFIER", "NOT_FOUND"].includes(result)) return "Invalid UUID";
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

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function historyDateLabel(start: string, end: string) {
  if (!start && !end) return "Select date range";
  const format = (value: string) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "Any date";
  return `${format(start)} • ${format(end)}`;
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

function sameBarangay(value: string | null | undefined, scope: string) {
  return normalizeBarangayForCompare(value ?? "") === normalizeBarangayForCompare(scope);
}

async function fetchAllDistributionHistory(batchId: string) {
  const limit = 100;
  const firstPage = await getReliefDistributionHistory(batchId, 1, limit);
  const rows = [...firstPage.distributions];
  const totalPages = firstPage.pagination?.totalPages ?? 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await getReliefDistributionHistory(batchId, page, limit);
    rows.push(...nextPage.distributions);
  }

  return rows;
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
