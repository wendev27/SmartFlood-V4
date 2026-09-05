"use client";

import { useState } from "react";
import { ReliefDistributionPanel } from "@/components/emergency/ReliefDistributionPanel/ReliefDistributionPanel";
import { ReliefPanel } from "@/components/relief/ReliefPanel/ReliefPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./CswddReliefPanel.module.css";

type View = "main" | "recommendation" | "history" | "distribution" | "endorsement";

const modules: Array<{ view: Exclude<View, "main">; title: string; icon: string }> = [
  { view: "recommendation", title: "AI-Optimized Relief Recommendation", icon: "/images/cswdd/relief-recommendation.svg" },
  { view: "history", title: "Recommendation History", icon: "/images/cswdd/recommendation-history.svg" },
  { view: "distribution", title: "Relief Distribution List", icon: "/images/cswdd/distribution-list.svg" },
  { view: "endorsement", title: "Resident Relief Request Endorsement", icon: "/images/cswdd/request-endorsement.svg" },
];

export function CswddReliefPanel({ onViewChange }: { onViewChange?: (isSubpage: boolean) => void }) {
  const [view, setViewState] = useState<View>("main");
  const setView = (next: View) => {
    setViewState(next);
    onViewChange?.(next !== "main");
  };

  if (view === "main") {
    return (
      <section className={styles.moduleGrid} aria-label="CSWDD relief management modules">
        {modules.map((module) => (
          <button className={styles.moduleCard} key={module.view} type="button" onClick={() => setView(module.view)}>
            <span className={styles.moduleIcon}><img src={module.icon} alt="" /></span>
            <h1>{module.title}</h1>
          </button>
        ))}
      </section>
    );
  }

  const title = modules.find((module) => module.view === view)?.title ?? "Relief Management";
  return (
    <section className={styles.subpage} aria-label={title}>
      <button className={styles.backButton} type="button" onClick={() => setView("main")}>← Back</button>
      <h1>{title}</h1>
      <div className={styles.content}>
        {view === "recommendation" ? <ReliefPanel mode="recommendation" /> : null}
        {view === "history" ? <ReliefPanel mode="history" /> : null}
        {view === "distribution" ? <ReliefDistributionPanel /> : null}
        {view === "endorsement" ? <CswddEndorsement /> : null}
      </div>
    </section>
  );
}

function CswddEndorsement() {
  const [kind, setKind] = useState<"family" | "individual">("family");
  return (
    <div className={styles.endorsement}>
      <div className={styles.tabs} role="tablist" aria-label="Relief request type">
        <span className={kind === "individual" ? styles.tabIndicatorRight : styles.tabIndicator} />
        <button type="button" role="tab" aria-selected={kind === "family"} onClick={() => setKind("family")}>Family Head Requests</button>
        <button type="button" role="tab" aria-selected={kind === "individual"} onClick={() => setKind("individual")}>Individual Requests</button>
      </div>
      <section className={styles.filterBar} aria-label="Request filters">
        <label>Status<select><option>All Status</option><option>Pending</option><option>Endorsed</option><option>Rejected</option></select></label>
        <label>Date Range<input type="date" /></label>
        <input type="search" aria-label="Search requests" placeholder="Search requests..." />
      </section>
      <div className={styles.emptyCard}><EmptyState title={`No ${kind} relief requests available`} description="Resident relief requests will appear here when they are submitted through the mobile application." /></div>
    </div>
  );
}
