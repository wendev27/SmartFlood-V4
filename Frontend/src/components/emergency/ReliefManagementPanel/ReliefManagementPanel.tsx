"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { cn } from "@/lib/cn";
import { queryKeys, queryStaleTime } from "@/lib/queryKeys";
import { closeReliefCampaign, getReliefCampaignHistory, startReliefCampaign } from "@/services/emergencyService";
import type { ReliefCampaign } from "@/types/emergency";
import styles from "./ReliefManagementPanel.module.css";

type State = "idle" | "starting" | "closing";

export function ReliefManagementPanel() {
  const pageSize = 5;
  const queryClient = useQueryClient();
  const [selectedClose, setSelectedClose] = useState<ReliefCampaign | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [page, setPage] = useState(1);
  const campaignsQuery = useQuery({
    queryKey: queryKeys.relief.campaigns,
    queryFn: getReliefCampaignHistory,
    staleTime: queryStaleTime.operational,
  });
  const campaigns = campaignsQuery.data ?? [];
  const error = actionError || (campaignsQuery.error instanceof Error ? campaignsQuery.error.message : campaignsQuery.error ? "Unable to load relief campaigns." : "");
  const isInitialLoading = campaignsQuery.isPending;
  const isBackgroundRefreshing = campaignsQuery.isFetching && !campaignsQuery.isPending;

  const invalidateCampaigns = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.relief.campaigns }),
      queryClient.invalidateQueries({ queryKey: queryKeys.relief.currentAllocation }),
      queryClient.invalidateQueries({ queryKey: ["relief", "distribution-history"] }),
      queryClient.invalidateQueries({ queryKey: ["relief", "beneficiary-status"] }),
    ]);
  };

  const startCampaignMutation = useMutation({
    mutationFn: ({ batchId, expiresAtIso }: { batchId: string; expiresAtIso: string }) => startReliefCampaign(batchId, expiresAtIso),
    onSuccess: invalidateCampaigns,
  });
  const closeCampaignMutation = useMutation({
    mutationFn: ({ batchId, closureReason }: { batchId: string; closureReason: string }) => closeReliefCampaign(batchId, closureReason),
    onSuccess: invalidateCampaigns,
  });

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

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeCampaign) return;
    if (!expiresAt) {
      setActionError("Set an expiration date/time before starting distribution.");
      return;
    }

    try {
      setState("starting");
      setMessage("");
      setActionError("");
      await startCampaignMutation.mutateAsync({ batchId: activeCampaign.batch_id, expiresAtIso: new Date(expiresAt).toISOString() });
      setMessage("Relief campaign started.");
      setExpiresAt("");
    } catch (startError) {
      setActionError(startError instanceof Error ? startError.message : "Unable to start campaign.");
    } finally {
      setState("idle");
    }
  }

  async function handleClose() {
    if (!selectedClose) return;
    if (!closureReason.trim()) {
      setActionError("Closure reason is required.");
      return;
    }

    try {
      setState("closing");
      setMessage("");
      setActionError("");
      await closeCampaignMutation.mutateAsync({ batchId: selectedClose.batch_id, closureReason: closureReason.trim() });
      setMessage("Relief campaign closed.");
      setSelectedClose(null);
      setClosureReason("");
    } catch (closeError) {
      setActionError(closeError instanceof Error ? closeError.message : "Unable to close campaign.");
    } finally {
      setState("idle");
    }
  }

  return (
    <section className={styles.stack} aria-label="Emergency relief campaign management">
      {message ? <p className={styles.stateMessage}>{message}</p> : null}
      {error ? <p className={styles.errorMessage}>{error}</p> : null}
      {isBackgroundRefreshing ? <p className={styles.stateMessage}>Refreshing campaign data...</p> : null}

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
        {isInitialLoading ? (
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
