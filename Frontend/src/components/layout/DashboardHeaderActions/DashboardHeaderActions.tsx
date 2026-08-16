"use client";

import { useEffect, useState } from "react";
import type { DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import { clearStoredSession } from "@/lib/authSession";
import { getFloodStatusClass } from "@/lib/statusStyles";
import { getSensors } from "@/services/sensorsService";
import styles from "./DashboardHeaderActions.module.css";

interface DashboardHeaderActionsProps {
  userProfile: DashboardUserProfile;
}

export function DashboardHeaderActions({ userProfile }: DashboardHeaderActionsProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  function logout() {
    fetch("/api/auth/logout", {
      method: "POST",
      keepalive: true,
    }).catch(() => undefined);
    clearStoredSession();
    window.location.href = "/";
  }

  return (
    <div className={styles.actions}>
      <button className={styles.alertButton} type="button" aria-label="Notifications">
        <span className={styles.bell} />
        <strong>{alertCount}</strong>
      </button>
      <div
        className={styles.profileMenu}
        onMouseEnter={() => setIsProfileOpen(true)}
        onMouseLeave={() => setIsProfileOpen(false)}
      >
        <button
          className={styles.profileChip}
          type="button"
          aria-expanded={isProfileOpen}
          aria-haspopup="menu"
          onClick={() => setIsProfileOpen((current) => !current)}
        >
          <div>
            <b>{userProfile.roleLabel}</b>
            <span>{userProfile.roleSubtitle}</span>
          </div>
          <span className={styles.avatar}>{userProfile.initials}</span>
        </button>
        {isProfileOpen ? (
          <div className={styles.profileDropdown} role="menu">
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownAvatar}>{userProfile.initials}</span>
              <div>
                <b>{userProfile.displayName}</b>
                <span>{userProfile.email || "No email available"}</span>
              </div>
            </div>
            <dl className={styles.profileDetails}>
              <div>
                <dt>Role</dt>
                <dd>{userProfile.roleLabel}</dd>
              </div>
              <div>
                <dt>Access</dt>
                <dd>{userProfile.logLabel}</dd>
              </div>
            </dl>
            <button className={styles.logoutButton} type="button" role="menuitem" onClick={logout}>
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
