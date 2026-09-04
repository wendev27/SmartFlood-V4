"use client";

import { useEffect, useState } from "react";
import { getFloodStatusClass } from "@/lib/statusStyles";
import { getSensors } from "@/services/sensorsService";
import styles from "./DashboardHeaderActions.module.css";

interface DashboardHeaderActionsProps {
  userProfile?: unknown;
}

export function DashboardHeaderActions({}: DashboardHeaderActionsProps = {}) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAlertCount() {
      try {
        const sensors = await getSensors();
        if (!cancelled) {
          setAlertCount(sensors.filter((sensor) => {
            const level = getFloodStatusClass(sensor.computedStatus, sensor.waterLevelM);
            return level === "flood_warning" || level === "severity";
          }).length);
        }
      } catch {
        if (!cancelled) setAlertCount(0);
      }
    }

    loadAlertCount();
    const interval = window.setInterval(loadAlertCount, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className={styles.actions}>
      <button className={styles.actionButton} type="button" aria-label={`${alertCount} notifications`}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
        <span>Notification</span>
        <i />
      </button>
    </div>
  );
}
