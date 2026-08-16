"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, type DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel/DashboardPanel";
import { LogsPanel } from "@/components/logs/LogsPanel/LogsPanel";
import { SystemLogs } from "@/components/logs/SystemLogs/SystemLogs";
import { MonitoringPanel, type MonitoringView } from "@/components/monitoring/MonitoringPanel/MonitoringPanel";
import { ReliefPanel } from "@/components/relief/ReliefPanel/ReliefPanel";
import { ReliefManagementPanel } from "@/components/emergency/ReliefManagementPanel/ReliefManagementPanel";
import { EmergencyNotificationsPanel } from "@/components/emergency/EmergencyNotificationsPanel/EmergencyNotificationsPanel";
import { ReliefDistributionPanel } from "@/components/emergency/ReliefDistributionPanel/ReliefDistributionPanel";
import { SensorsPanel } from "@/components/sensors/SensorsPanel/SensorsPanel";
import { ResidentsPanel } from "@/components/residents/ResidentsPanel/ResidentsPanel";
import { VerificationPanel } from "@/components/verification/VerificationPanel/VerificationPanel";
import { navigationItemsForRole } from "@/data/navigation";
import { getCurrentUser, normalizeUserRole, profileForUser } from "@/lib/authSession";
import type { DashboardRole, PageKey } from "@/types/navigation";

const pageKeys: PageKey[] = [
  "dashboard",
  "logs",
  "systemLogs",
  "monitoring",
  "relief",
  "reliefManagement",
  "emergencyNotifications",
  "reliefDistribution",
  "sensors",
  "residents",
  "accounts",
];

function getPageFromHash(hash: string): PageKey {
  const value = hash.replace("#", "");
  if (value === "hardware" || value === "sensor-configuration") return "sensors";
  return pageKeys.includes(value as PageKey) ? (value as PageKey) : "dashboard";
}

type DashboardSession = {
  role: DashboardRole;
  profile: DashboardUserProfile;
};

export default function DashboardPage() {
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [monitoringView, setMonitoringView] = useState<MonitoringView>("main");
  const [monitoringResetVersion, setMonitoringResetVersion] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigationItems = useMemo(() => session ? navigationItemsForRole(session.role) : [], [session]);
  const allowedPages = useMemo(() => navigationItems.map((item) => item.key), [navigationItems]);

  useEffect(() => {
    const user = getCurrentUser();
    const role = normalizeUserRole(user);

    if (!user || !role) {
      window.location.replace("/");
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Current session user:", user);
      console.log("Normalized role:", role);
    }

    setSession({ role, profile: profileForUser(user, role) });
  }, []);

  useEffect(() => {
    if (!session) return;
    const pageFromHash = getPageFromHash(window.location.hash);
    setActivePage(allowedPages.includes(pageFromHash) ? pageFromHash : "dashboard");

    const handleHashChange = () => {
      const nextPage = getPageFromHash(window.location.hash);
      const allowedPage = allowedPages.includes(nextPage) ? nextPage : "dashboard";
      setActivePage(allowedPage);
      if (allowedPage === "monitoring") {
        setMonitoringView("main");
        setMonitoringResetVersion((version) => version + 1);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [allowedPages, session]);

  useEffect(() => {
    if (!session) return;
    if (allowedPages.includes(activePage)) return;
    setActivePage("dashboard");
    window.history.replaceState(null, "", "#dashboard");
  }, [activePage, allowedPages, session]);

  function handleNavigate(page: PageKey) {
    const targetPage = allowedPages.includes(page) ? page : "dashboard";
    setActivePage(targetPage);
    setMonitoringView("main");
    if (targetPage === "monitoring") {
      setMonitoringResetVersion((version) => version + 1);
    }
    setIsMobileNavOpen(false);
    window.history.replaceState(null, "", `#${targetPage}`);
  }

  if (!session) {
    return null;
  }

  return (
    <AppShell
      activePage={activePage}
      hideTopbar={activePage === "monitoring" && monitoringView !== "main"}
      isMobileNavOpen={isMobileNavOpen}
      navigationItems={navigationItems}
      onNavigate={handleNavigate}
      onToggleMobileNav={() => setIsMobileNavOpen((isOpen) => !isOpen)}
      userProfile={session.profile}
    >
      {activePage === "dashboard" ? <DashboardPanel /> : null}
      {activePage === "logs" ? <LogsPanel /> : null}
      {activePage === "systemLogs" ? <SystemLogs /> : null}
      {activePage === "monitoring" ? <MonitoringPanel resetSignal={monitoringResetVersion} onViewChange={setMonitoringView} userProfile={session.profile} /> : null}
      {activePage === "relief" ? <ReliefPanel /> : null}
      {activePage === "reliefManagement" ? <ReliefManagementPanel /> : null}
      {activePage === "emergencyNotifications" ? <EmergencyNotificationsPanel /> : null}
      {activePage === "reliefDistribution" ? <ReliefDistributionPanel /> : null}
      {activePage === "sensors" ? <SensorsPanel /> : null}
      {activePage === "residents" ? <ResidentsPanel /> : null}
      {activePage === "accounts" ? <VerificationPanel /> : null}
    </AppShell>
  );
}
