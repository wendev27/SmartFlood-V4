"use client";

import { useState } from "react";
import { CswddDistributionModule } from "@/components/relief/CswddDistributionModule/CswddDistributionModule";
import { ReliefPanel } from "@/components/relief/ReliefPanel/ReliefPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./CswddReliefPanel.module.css";

export type CswddReliefView = "main" | "recommendation" | "history" | "distribution" | "endorsement";

const modules: Array<{ view: Exclude<CswddReliefView, "main">; title: string; icon: string }> = [
  { view: "recommendation", title: "AI-Optimized Relief Recommendation", icon: "/images/cswdd/relief-recommendation.svg" },
  { view: "history", title: "Recommendation History", icon: "/images/cswdd/recommendation-history.svg" },
  { view: "distribution", title: "Relief Distribution List", icon: "/images/cswdd/distribution-list.svg" },
  { view: "endorsement", title: "Resident Relief Request Endorsement", icon: "/images/cswdd/request-endorsement.svg" },
];

export function CswddReliefPanel({ initialView = "main", onViewChange }: { initialView?: CswddReliefView; onViewChange?: (isSubpage: boolean) => void }) {
  const [view, setViewState] = useState<CswddReliefView>(initialView);
  const setView = (next: CswddReliefView) => {
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
  if (view === "distribution") return <CswddDistributionModule onBack={() => setView("main")} />;
  return (
    <section className={styles.subpage} aria-label={title}>
      <button className={styles.backButton} type="button" onClick={() => setView("main")}>← Back</button>
      {view === "recommendation" ? null : <h1>{title}</h1>}
      <div className={styles.content}>
        {view === "recommendation" ? <ReliefPanel mode="recommendation" /> : null}
        {view === "history" ? <ReliefPanel mode="history" /> : null}
        {view === "endorsement" ? <CswddEndorsement /> : null}
      </div>
    </section>
  );
}

function CswddEndorsement() {
  const [kind, setKind] = useState<"family" | "individual">("family");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const hasFilters = Boolean(status || date || search.trim());

  function clearFilters() {
    setStatus("");
    setDate("");
    setSearch("");
  }

  return (
    <div className={styles.endorsement}>
      <div className={styles.controlsRow}>
        <div className={styles.tabs} role="tablist" aria-label="Relief request type">
          <span className={kind === "individual" ? styles.tabIndicatorRight : styles.tabIndicator} />
          <button type="button" role="tab" aria-selected={kind === "family"} onClick={() => setKind("family")}>Family Head Requests</button>
          <button type="button" role="tab" aria-selected={kind === "individual"} onClick={() => setKind("individual")}>Individual Requests</button>
        </div>
        <section className={styles.filterBar} aria-label="Request filters">
          <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Status</option><option value="pending">Pending</option><option value="endorsed">Endorsed</option><option value="rejected">Rejected</option></select></label>
          <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <input type="search" aria-label="Search requests" placeholder="Search by resident or reference..." value={search} onChange={(event) => setSearch(event.target.value)} />
          {hasFilters ? <button className={styles.clearFilters} type="button" onClick={clearFilters}>Clear Filters</button> : null}
        </section>
      </div>
      <div className={styles.emptyCard}><EmptyState title={hasFilters ? "No requests match your filters" : `No ${kind} relief requests available`} description={hasFilters ? "Try changing or clearing the status, date, or search filters." : "Resident relief requests will appear here when they are submitted through the mobile application."} actionLabel={hasFilters ? "Clear Filters" : undefined} onAction={hasFilters ? clearFilters : undefined} /></div>
    </div>
  );
}
