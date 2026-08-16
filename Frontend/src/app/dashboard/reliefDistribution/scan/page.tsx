"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  confirmReliefDistribution,
  getReliefCampaignHistory,
  verifyReliefDistribution,
} from "@/services/emergencyService";
import type { ReliefCampaign, ReliefDistributionVerifyResponse } from "@/types/emergency";
import styles from "./scanner.module.css";

type ScannerState = "loading" | "idle" | "verifying" | "confirming";

export default function ReliefDistributionScannerPage() {
  const [batchId, setBatchId] = useState("");
  const [campaign, setCampaign] = useState<ReliefCampaign | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<ReliefDistributionVerifyResponse | null>(null);
  const [state, setState] = useState<ScannerState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const distributable = useMemo(() => Boolean(
    campaign?.status === "in_distribution"
    && (campaign.progress?.barangays ?? []).some((barangay) => barangay.barangay_status === "family_heads_notified"),
  ), [campaign]);

  const barangayName = campaignScopeLabel(campaign);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedBatchId = params.get("batchId") ?? "";
    setBatchId(selectedBatchId);

    async function loadCampaign() {
      try {
        setState("loading");
        setError(null);
        const campaigns = await getReliefCampaignHistory();
        const selected = campaigns.find((row) => row.batch_id === selectedBatchId) ?? null;
        setCampaign(selected);
        if (!selected) setError("Selected relief campaign was not found or is not available to this account.");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load selected relief campaign.");
      } finally {
        setState("idle");
      }
    }

    loadCampaign();
  }, []);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!batchId || !campaign) {
      setError("Selected relief campaign was not found.");
      return;
    }
    if (!distributable) {
      setError("Selected campaign is not ready for barangay QR distribution.");
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
      const verification = await verifyReliefDistribution(batchId, trimmed);
      setResult(verification);
      if (verification.result === "ELIGIBLE") setMessage("Beneficiary is eligible. Confirm only after relief is physically received.");
      if (verification.result === "ALREADY_RECEIVED") setMessage("Relief already received for this campaign.");
      if (!["ELIGIBLE", "ALREADY_RECEIVED"].includes(verification.result)) setError(verification.reason ?? "Beneficiary is not eligible.");
    } catch (verifyError) {
      setResult(null);
      setError(verifyError instanceof Error ? verifyError.message : "Unable to verify beneficiary.");
    } finally {
      setState("idle");
    }
  }

  async function handleConfirm() {
    if (!batchId || !identifier.trim() || result?.result !== "ELIGIBLE") return;

    try {
      setState("confirming");
      setMessage(null);
      setError(null);
      const confirmation = await confirmReliefDistribution(batchId, identifier.trim(), result.data?.allocation?.item_id);
      setResult(confirmation);
      if (confirmation.result === "RECEIVED") {
        setMessage("Relief distribution confirmed.");
      } else if (confirmation.result === "ALREADY_RECEIVED") {
        setMessage("Relief already received for this campaign.");
      } else {
        setError(confirmation.reason ?? "Unable to confirm relief distribution.");
      }
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Unable to confirm relief distribution.");
    } finally {
      setState("idle");
    }
  }

  function scanNext() {
    setIdentifier("");
    setResult(null);
    setMessage(null);
    setError(null);
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div>
            <span>SmartFlood</span>
            <h1>Relief Distribution Scanner</h1>
          </div>
          <strong>{campaign ? formatStatus(campaign.status) : state === "loading" ? "Loading" : "Unavailable"}</strong>
        </header>

        <section className={styles.campaignBar}>
          <div>
            <span>Selected Campaign</span>
            <strong>{campaign?.plan_name ?? "No campaign selected"}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{campaign ? formatStatus(campaign.status) : "-"}</strong>
          </div>
          <div>
            <span>Barangay</span>
            <strong>{barangayName}</strong>
          </div>
        </section>

        {message ? <p className={styles.stateMessage}>{message}</p> : null}
        {error ? <p className={styles.errorMessage}>{error}</p> : null}

        <section className={styles.scannerGrid}>
          <div className={styles.scannerBox} aria-label="QR scanner placeholder">
            <div>
              <strong>QR Scanner</strong>
              <span>Camera Placeholder</span>
            </div>
          </div>

          <section className={styles.manualCard}>
            <header>
              <span>Enter QR / Identifier Manually</span>
              <h2>Manual Verification</h2>
              <p>Camera QR scanning will be enabled here. Manual entry uses the same campaign-scoped verification API.</p>
            </header>

            {distributable ? (
              <form className={styles.form} onSubmit={handleVerify}>
                <label>
                  Beneficiary QR / Identifier
                  <input
                    autoComplete="off"
                    placeholder="family:uuid or resident:uuid"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                  />
                </label>
                <button type="submit" disabled={state === "verifying" || state === "confirming"}>
                  {state === "verifying" ? "Verifying..." : "Verify Beneficiary"}
                </button>
              </form>
            ) : (
              <div className={styles.emptyState}>This selected campaign is not ready for QR distribution for this account.</div>
            )}
          </section>
        </section>

        <section className={styles.resultCard}>
          <header>
            <span>Beneficiary Result</span>
            <h2>{result ? resultTitle(result.result) : "Waiting for Verification"}</h2>
            <p>{result?.reason ?? "Verification does not confirm receipt. Use the confirmation button only after the family receives relief."}</p>
          </header>

          {result?.data?.beneficiary ? (
            <dl className={styles.details}>
              <div>
                <dt>Family</dt>
                <dd>{result.data.beneficiary.family_name}</dd>
              </div>
              <div>
                <dt>Family Head</dt>
                <dd>{result.data.beneficiary.family_head_name ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Barangay</dt>
                <dd>{result.data.beneficiary.barangay_name}</dd>
              </div>
              <div>
                <dt>Members</dt>
                <dd>{result.data.beneficiary.total_family_members || "Not recorded"}</dd>
              </div>
            </dl>
          ) : null}

          {result?.data?.existing_distribution || result?.data?.distribution ? (
            <div className={styles.receivedBox}>
              <strong>Relief Already Recorded</strong>
              <span>Received at: {formatDateTime((result.data.distribution ?? result.data.existing_distribution)?.verified_at)}</span>
              <span>Verified by: {(result.data.distribution ?? result.data.existing_distribution)?.verified_by_name ?? "Not recorded"}</span>
            </div>
          ) : null}

          {result?.result === "ELIGIBLE" ? (
            <button className={styles.confirmButton} type="button" disabled={state === "confirming"} onClick={handleConfirm}>
              {state === "confirming" ? "Confirming..." : "Confirm Relief Received"}
            </button>
          ) : null}

          {result?.result === "RECEIVED" ? (
            <button className={styles.secondaryButton} type="button" onClick={scanNext}>
              Scan Next Beneficiary
            </button>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function campaignScopeLabel(campaign: ReliefCampaign | null) {
  const barangays = campaign?.progress?.barangays ?? [];
  if (barangays.length === 1) return barangays[0]?.barangay_name || "Assigned barangay";
  if (barangays.length > 1) return `${barangays.length} barangays`;
  return "Assigned barangay";
}

function resultTitle(result: string) {
  if (result === "ELIGIBLE") return "Eligible for Relief";
  if (result === "RECEIVED") return "Relief Distribution Confirmed";
  if (result === "ALREADY_RECEIVED") return "Relief Already Received";
  if (result === "CAMPAIGN_NOT_ACTIVE") return "Campaign Not Active";
  if (result === "WRONG_BARANGAY") return "Wrong Barangay";
  if (result === "UNAUTHORIZED") return "Unauthorized";
  return "Beneficiary Not Eligible";
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(value?: string | null) {
  const text = String(value ?? "").replace(/_/g, " ").trim();
  return text ? text.replace(/\b\w/g, (char) => char.toUpperCase()) : "Unknown";
}
