"use client";

import { useEffect, useState } from "react";
import { EmergencyNotificationsPanel } from "@/components/emergency/EmergencyNotificationsPanel/EmergencyNotificationsPanel";
import { ReliefEndorsement } from "@/components/relief/ReliefEndorsement/ReliefEndorsement";
import type { PageKey } from "@/types/navigation";
import styles from "./BarangayReliefPanel.module.css";

const modules = [
  { view: "allocation", title: "Relief Allocation Notification", icon: "/images/dashboard/relief-allocation.svg" },
  { view: "distribution", title: "Relief Distribution", icon: "/images/dashboard/relief-distribution.svg" },
  { view: "history", title: "Relief Distribution History", icon: "/images/dashboard/relief-history.svg" },
  { view: "endorsement", title: "Resident Relief Request Endorsement", icon: "/images/dashboard/relief-allocation.svg" },
] as const;

/** Local page composition; scope and all mutations remain in the existing controllers. */
export function BarangayReliefPanel({ onNavigate, onOpenDistribution, notificationRequest, onNotificationHandled }: {
  onNavigate: (page: PageKey) => void;
  onOpenDistribution?: (view: "distribution" | "history") => void;
  notificationRequest?: { id: string; version: number } | null;
  onNotificationHandled?: (version: number) => void;
}) {
  const [view, setView] = useState<"main" | "allocation" | "endorsement">("main");
  useEffect(() => { if (notificationRequest) setView("allocation"); }, [notificationRequest]);
  return <>
    {view === "main" ? <section className={styles.moduleGrid} aria-label="Barangay relief management modules">
      {modules.map((module) => <button className={styles.moduleCard} key={module.view} type="button" onClick={() => {
        if (module.view === "distribution" || module.view === "history") {
          if (onOpenDistribution) onOpenDistribution(module.view);
          else onNavigate("reliefDistribution");
        }
        else setView(module.view);
      }}>
        <span className={styles.moduleIcon}><img src={module.icon} alt="" /></span><strong>{module.title}</strong>
      </button>)}
    </section> : null}
    <section className={styles.subpage} hidden={view === "main"}>
      <button className={styles.backButton} type="button" onClick={() => setView("main")}>← Back</button>
      <h1>{view === "allocation" ? "Relief Allocation Notification" : "Resident Relief Request Endorsement"}</h1>
      <div className={styles.content}>
        <div hidden={view !== "allocation"}><EmergencyNotificationsPanel openRequest={notificationRequest} onOpenRequestHandled={onNotificationHandled} /></div>
        {view === "endorsement" ? <ReliefEndorsement /> : null}
      </div>
    </section>
  </>;
}
