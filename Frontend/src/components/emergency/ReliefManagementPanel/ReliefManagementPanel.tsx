"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { cn } from "@/lib/cn";
import { closeReliefCampaign, getReliefCampaignHistory, startReliefCampaign } from "@/services/emergencyService";
import type { ReliefCampaign } from "@/types/emergency";
import styles from "./ReliefManagementPanel.module.css";

type State = "idle" | "loading" | "starting" | "closing";

export function ReliefManagementPanel() {
  const pageSize = 5;
  const [campaigns, setCampaigns] = useState<ReliefCampaign[]>([]);
  const [selectedClose, setSelectedClose] = useState<ReliefCampaign | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const activeCampaign = useMemo(
    () => campaigns.find((campaign) => ["accepted", "barangays_notified", "in_distribution"].includes(campaign.status)) ?? null,
    [campaigns],
  );
  const paginatedCampaigns = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(campaigns.length / pageSize));
    const safePage = Math.min(page, totalPages);
    return {
      rows: campaigns.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: campaigns.length, totalPages } satisfies PaginationState,
    };
  }, [campaigns, page]);

  useEffect(() => {
    if (page !== paginatedCampaigns.pagination.page) setPage(paginatedCampaigns.pagination.page);
  }, [page, paginatedCampaigns.pagination.page]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setState("loading");
      const rows = await getReliefCampaignHistory();
      setCampaigns(rows);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load relief campaigns.");
    } finally {
      setState("idle");
    }
  }

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeCampaign) return;
    if (!expiresAt) {
      setError("Set an expiration date/time before starting distribution.");
      return;
    }

    try {
      setState("starting");
      setMessage("");
      setError("");
      await startReliefCampaign(activeCampaign.batch_id, new Date(expiresAt).toISOString());
      setMessage("Relief campaign started.");
      setExpiresAt("");
      await loadCampaigns();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start campaign.");
    } finally {
      setState("idle");
    }
  }

  async function handleClose() {
    if (!selectedClose) return;
    if (!closureReason.trim()) {
      setError("Closure reason is required.");
      return;
    }

    try {
      setState("closing");
      setMessage("");
      setError("");
      await closeReliefCampaign(selectedClose.batch_id, closureReason.trim());
      setMessage("Relief campaign closed.");
      setSelectedClose(null);
      setClosureReason("");
      await loadCampaigns();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Unable to close campaign.");
    } finally {
      setState("idle");
    }
  }

  return (
    <section className={styles.stack} aria-label="Emergency relief campaign management">
      {message ? <p className={styles.stateMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}

      <section className={styles.summary}>
        <div>
          <span>Active Relief Operation</span>
          <h3>{activeCampaign?.plan_name ?? "No active relief operation"}</h3>
          <p>{activeCampaign ? `${formatStatus(activeCampaign.status)} • ${activeCampaign.batch_id.slice(0, 8)}` : "Accepted, notified, and in-distribution campaigns will appear here."}</p>
        </div>
        {activeCampaign ? (
          <div className={styles.stats}>
            <Metric label="Barangays" value={activeCampaign.progress?.total_barangays ?? 0} />
            <Metric label="Received" value={activeCampaign.progress?.total_distributions ?? 0} />
          </div>
        ) : null}
      </section>

      {activeCampaign ? (
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <span>Lifecycle</span>
            <h3>Campaign Controls</h3>
            <p>Starting distribution opens QR/manual beneficiary verification until the configured expiration time.</p>
          </header>
          {activeCampaign.status === "in_distribution" ? (
            <div className={styles.actionRow}>
              <div>
                <strong>Distribution is active</strong>
                <span>Expires {formatDate(activeCampaign.expires_at)}</span>
              </div>
              <button className={styles.dangerButton} type="button" onClick={() => setSelectedClose(activeCampaign)}>
                End Distribution
              </button>
            </div>
          ) : (
            <form className={styles.startForm} onSubmit={handleStart}>
              <label>
                Expiration
                <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
              </label>
              <button className={styles.primaryButton} type="submit" disabled={state === "starting"}>
                {state === "starting" ? "Starting..." : "Start Distribution"}
              </button>
            </form>
          )}
        </section>
      ) : null}

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span>History</span>
          <h3>Relief Campaigns</h3>
          <p>Historical campaigns stay queryable after closure, completion, or expiration.</p>
        </header>
        {state === "loading" ? (
          <div className={styles.emptyState}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className={styles.emptyState}>No relief campaigns found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Expires</th>
                  <th>Distributions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCampaigns.rows.map((campaign) => (
                  <tr key={campaign.batch_id}>
                    <td>{campaign.plan_name}</td>
                    <td><span className={cn(styles.status, styles[statusTone(campaign.status)])}>{formatStatus(campaign.status)}</span></td>
                    <td>{formatDate(campaign.started_at)}</td>
                    <td>{formatDate(campaign.expires_at)}</td>
                    <td>{campaign.progress?.total_distributions ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SharedPagination pagination={paginatedCampaigns.pagination} onPageChange={setPage} label="Relief campaigns" />
      </section>

      <Modal isOpen={Boolean(selectedClose)} onClose={() => setSelectedClose(null)} labelledBy="close-campaign-title" size="sm">
        {selectedClose ? (
          <>
            <header className={styles.modalHeader}>
              <h2 id="close-campaign-title">End this relief operation?</h2>
              <p>Ending this operation prevents new relief distributions. Existing records remain available in history.</p>
            </header>
            <dl className={styles.closeStats}>
              <div>
                <dt>Families already served</dt>
                <dd>{selectedClose.progress?.total_distributions ?? 0}</dd>
              </div>
              <div>
                <dt>Barangays in campaign</dt>
                <dd>{selectedClose.progress?.total_barangays ?? 0}</dd>
              </div>
            </dl>
            <label className={styles.reasonField}>
              Closure reason
              <textarea value={closureReason} onChange={(event) => setClosureReason(event.target.value)} />
            </label>
            <footer className={styles.modalActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setSelectedClose(null)}>Cancel</button>
              <button className={styles.dangerButton} type="button" disabled={state === "closing"} onClick={handleClose}>
                {state === "closing" ? "Closing..." : "End Distribution"}
              </button>
            </footer>
          </>
        ) : null}
      </Modal>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function statusTone(status: string) {
  if (status === "in_distribution") return "active";
  if (status === "closed") return "closed";
  if (status === "expired") return "expired";
  if (status === "completed") return "completed";
  if (status === "rejected") return "rejected";
  return "pending";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
