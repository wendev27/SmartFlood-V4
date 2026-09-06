"use client";

import styles from "./DashboardHeaderActions.module.css";

interface DashboardHeaderActionsProps {
  onNavigate?: () => void;
  userProfile?: unknown;
}

export function DashboardHeaderActions({ onNavigate }: DashboardHeaderActionsProps = {}) {
  function handleNotificationClick() {
    if (onNavigate) {
      onNavigate();
      return;
    }

    window.location.hash = "notifications";
  }

  return (
    <div className={styles.actions}>
      <button className={styles.actionButton} type="button" aria-label="Notifications" onClick={handleNotificationClick}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
        <span>Notification</span>
        <i aria-hidden="true" />
      </button>
    </div>
  );
}
