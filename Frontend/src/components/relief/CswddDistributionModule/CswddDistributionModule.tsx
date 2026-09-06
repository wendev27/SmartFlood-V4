"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AdminReliefAuditPanel } from "@/components/emergency/ReliefDistributionPanel/AdminReliefAuditPanel";
import { Pagination } from "@/components/ui/Pagination/Pagination";
import { queryKeys, queryStaleTime } from "@/lib/queryKeys";
import { getReliefCampaignHistory, getReliefDistributionHistory } from "@/services/emergencyService";
import { toDistributionPresentation, type DistributionPresentationRow } from "./distributionPresentation";
import styles from "./CswddDistributionModule.module.css";

type View = "main" | "list" | "history" | "audit";
const pageSize = 6;

/** REY navigation and tables backed by V3.2's campaign-scoped history service. */
export function CswddDistributionModule({ onBack, initialView }: { onBack?: () => void; initialView?: "distribution" | "history" }) {
  const [view, setView] = useState<View>(initialView === "distribution" ? "list" : initialView ?? "main");
  const [page, setPage] = useState(1);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  useEffect(() => {
    setView(initialView === "distribution" ? "list" : initialView ?? "main");
    setPage(1);
  }, [initialView]);
  const campaignsQuery = useQuery({
    queryKey: queryKeys.relief.campaigns,
    queryFn: getReliefCampaignHistory,
    staleTime: queryStaleTime.operational,
    enabled: view === "list" || view === "history",
  });
  const campaigns = campaignsQuery.data ?? [];
  const campaign = campaigns.find((item) => item.batch_id === selectedBatchId)
    ?? campaigns.find((item) => item.status === "in_distribution") ?? campaigns[0] ?? null;
  const historyQuery = useQuery({
    queryKey: queryKeys.relief.distributionHistory(campaign?.batch_id, page, pageSize),
    queryFn: () => getReliefDistributionHistory(campaign?.batch_id, page, pageSize),
    enabled: Boolean(campaign?.batch_id) && (view === "list" || view === "history"),
    staleTime: queryStaleTime.operational,
  });
  const rows = (historyQuery.data?.distributions ?? []).map(toDistributionPresentation);
  const error = campaignsQuery.error ?? historyQuery.error;
  const loading = campaignsQuery.isPending || (Boolean(campaign) && historyQuery.isPending);

  function openView(next: View) { setPage(1); setView(next); }

  if (view === "main") return (
    <section className={styles.page}>
      {onBack ? <button className={styles.back} type="button" onClick={onBack}>← Back</button> : null}
      <h1>Relief Distribution List</h1>
      <div className={styles.optionGrid}>
        <button type="button" onClick={() => openView("list")}><span><ClipboardList /></span><strong>Distribution List</strong></button>
        <button type="button" onClick={() => openView("history")}><span><Clock3 /></span><strong>Distribution History</strong></button>
      </div>
      <button className={styles.auditLink} type="button" onClick={() => openView("audit")}>Campaign Audit &amp; Coverage →</button>
    </section>
  );

  if (view === "audit") return (
    <section className={styles.page}>
      <button className={styles.back} type="button" onClick={() => openView("main")}>← Back</button>
      <h1>Campaign Audit &amp; Coverage</h1>
      <div className={styles.auditContent}><AdminReliefAuditPanel /></div>
    </section>
  );

  return (
    <section className={`${styles.recordsPage} ${view === "list" ? styles.listPage : styles.distributionHistoryPage}`}>
      <button className={styles.back} type="button" onClick={() => openView("main")}>← Back</button>
      <div className={styles.titleRow}>
        <h1>{view === "list" ? "Distribution List" : "Distribution History"}</h1>
        <button type="button" disabled={campaignsQuery.isFetching || historyQuery.isFetching} onClick={() => { void campaignsQuery.refetch(); if (campaign) void historyQuery.refetch(); }} aria-label="Refresh distribution records"><RefreshCw className={campaignsQuery.isFetching || historyQuery.isFetching ? styles.spinning : ""} /></button>
      </div>
      <div className={styles.filters}>
        <label>Relief Campaign<select value={campaign?.batch_id ?? ""} disabled={campaignsQuery.isPending || campaigns.length === 0} onChange={(event) => { setSelectedBatchId(event.target.value); setPage(1); }}>
          {campaigns.length === 0 ? <option value="">No relief campaigns</option> : campaigns.map((item) => <option value={item.batch_id} key={item.batch_id}>{item.plan_name}</option>)}
        </select></label>
        <label>Barangay<select disabled aria-describedby="distribution-filter-note"><option>Authorized campaign scope</option></select></label>
        <label>Distribution Date<input type="date" disabled aria-describedby="distribution-filter-note" /></label>
      </div>
      <p className={styles.filterNote} id="distribution-filter-note">Barangay and date filters are unavailable for distribution history. Records use your authorized campaign scope.</p>
      {error ? <p className={styles.error} role="alert">{error instanceof Error ? error.message : "Unable to load distribution records."}</p> : null}
      {loading ? <p className={styles.message} role="status">Loading distribution records...</p> : null}
      {view === "list" ? <DistributionList rows={rows} /> : <>
        <div className={styles.historyTable}>
          <h2>Individual</h2>
          <table><thead><tr><th>ID</th><th>Last Name</th><th>First Name</th><th>Type of recommendation</th><th>Status</th></tr></thead><tbody><tr><td colSpan={5} className={styles.unavailable}>Individual distribution records are unavailable. Existing receipts are recorded per family.</td></tr></tbody></table>
        </div>
        <div className={styles.historyTable}>
          <h2>Family</h2>
          <table><thead><tr><th>ID</th><th>Family Name</th><th>Family Head</th><th>Type of recommendation</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>
            <td className={styles.recordId}>{row.id}</td><td>{row.familyName}</td><td>{row.familyHead}</td><td className={styles.recommendationType}>{campaign?.plan_name ?? "Not recorded"}</td><td className={row.received ? styles.received : undefined}>{row.status}</td>
          </tr>)}</tbody></table>
        </div>
      </>}
      {!loading && !error && rows.length === 0 ? <p className={styles.empty}>No confirmed relief distributions are available for this campaign.</p> : null}
      <button className={styles.auditLink} type="button" onClick={() => openView("audit")}>Campaign Audit, Coverage &amp; Export →</button>
      <Pagination pagination={historyQuery.data?.pagination ?? null} onPageChange={setPage} label="Distribution records" />
    </section>
  );
}

function DistributionList({ rows }: { rows: DistributionPresentationRow[] }) {
  return <div className={styles.tableWrap}><table><thead><tr><th>ID</th><th>Name</th><th>Barangay</th><th>Date &amp; Time</th><th>Status</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>
    <td className={styles.recordId}>{row.id}</td><td><strong>{row.familyHead === "Not recorded" ? row.familyName : row.familyHead}</strong><small>{row.familyHead === "Not recorded" ? "Family" : "Family Head"}</small></td><td>{row.barangay}</td><td>{row.verifiedDate}{row.verifiedTime ? <small>{row.verifiedTime}</small> : null}</td><td className={row.received ? styles.received : undefined}>{row.status}</td>
  </tr>)}</tbody></table></div>;
}

function ClipboardList() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4" /></svg>; }
function Clock3() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>; }
function RefreshCw({ className = "" }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 0-15-6.7L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /><path d="M21 21v-5h-5" /></svg>; }
