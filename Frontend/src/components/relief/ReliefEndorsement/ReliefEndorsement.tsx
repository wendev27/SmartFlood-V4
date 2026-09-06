"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./ReliefEndorsement.module.css";

/** Reference presentation only: V3.2 has no resident endorsement workflow. */
export function ReliefEndorsement() {
  const [kind, setKind] = useState<"family" | "individual">("family");
  return <div className={styles.endorsement}>
    <div className={styles.controlsRow}>
      <div className={styles.tabs} role="tablist" aria-label="Relief request type">
        <span className={kind === "individual" ? styles.tabIndicatorRight : styles.tabIndicator} />
        <button type="button" role="tab" aria-selected={kind === "family"} onClick={() => setKind("family")}>Family Head Requests</button>
        <button type="button" role="tab" aria-selected={kind === "individual"} onClick={() => setKind("individual")}>Individual Requests</button>
      </div>
      <section className={styles.filterBar} aria-label="Request filters unavailable">
        <label>Status<select disabled defaultValue=""><option value="">All Status</option><option>Pending</option><option>Endorsed</option><option>Rejected</option></select></label>
        <label>Date<input type="date" disabled /></label>
        <input type="search" aria-label="Search requests" placeholder="Search by resident or reference..." disabled />
      </section>
    </div>
    <div className={styles.emptyCard} role="status"><EmptyState title="Relief request endorsement is unavailable" description={`${kind === "family" ? "Family head" : "Individual"} request submission and endorsement are not available yet.`} /></div>
  </div>;
}
