"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, type AdminViewContext, type DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel/DashboardPanel";
import { WeatherForecastPanel } from "@/components/weather/WeatherForecastPanel/WeatherForecastPanel";
import { LogsPanel } from "@/components/logs/LogsPanel/LogsPanel";
import { SystemLogs } from "@/components/logs/SystemLogs/SystemLogs";
import { MonitoringPanel, type MonitoringView } from "@/components/monitoring/MonitoringPanel/MonitoringPanel";
import { ReliefPanel } from "@/components/relief/ReliefPanel/ReliefPanel";
import { BarangayReliefPanel } from "@/components/relief/BarangayReliefPanel/BarangayReliefPanel";
import { CswddReliefPanel } from "@/components/relief/CswddReliefPanel/CswddReliefPanel";
import { ReliefManagementPanel } from "@/components/emergency/ReliefManagementPanel/ReliefManagementPanel";
import { ReliefDistributionPanel } from "@/components/emergency/ReliefDistributionPanel/ReliefDistributionPanel";
import { EmergencyReportPanel } from "@/components/emergency/EmergencyReportPanel/EmergencyReportPanel";
import { SensorsPanel } from "@/components/sensors/SensorsPanel/SensorsPanel";
import { ResidentsPanel } from "@/components/residents/ResidentsPanel/ResidentsPanel";
import { VerificationPanel } from "@/components/verification/VerificationPanel/VerificationPanel";
import { NotificationPanel, unreadNotificationCount } from "@/components/notifications/NotificationPanel/NotificationPanel";
import { navigationItemsForRole } from "@/data/navigation";
import { getCurrentUser, normalizeUserRole, profileForUser } from "@/lib/authSession";
import type { DashboardRole, PageKey } from "@/types/navigation";

const pageKeys: PageKey[] = [
  "dashboard",
  "weatherForecast",
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
  "notifications",
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
  const [monitoringInitialView, setMonitoringInitialView] = useState<MonitoringView>("main");
  const [monitoringResetVersion, setMonitoringResetVersion] = useState(0);
  const [reliefInitialView, setReliefInitialView] = useState<"main" | "endorsement">("main");
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>([]);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [adminView, setAdminView] = useState<AdminViewContext | null>(null);
  const navigationItems = useMemo(() => session ? navigationItemsForRole(session.role) : [], [session]);
  const allowedPages = useMemo(
    () => session && (session.role === "cdrrmo" || session.role === "super")
      ? pageKeys
      : [...navigationItems.map((item) => item.key), "notifications", "weatherForecast"],
    [navigationItems, session],
  );

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
    const storedReadIds = window.localStorage.getItem("smartflood-read-notifications");
    if (storedReadIds) {
      try {
        const parsedReadIds: unknown = JSON.parse(storedReadIds);
        if (Array.isArray(parsedReadIds)) {
          setReadNotificationIds(parsedReadIds.filter((id): id is number => typeof id === "number"));
        }
      } catch {
        window.localStorage.removeItem("smartflood-read-notifications");
      }
    }
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

  function handleNavigate(page: PageKey, nextAdminView?: AdminViewContext) {
    const targetPage = allowedPages.includes(page) ? page : "dashboard";
    setAdminView(nextAdminView ?? null);
    setActivePage(targetPage);
    setMonitoringView("main");
    setMonitoringInitialView("main");
    setReliefInitialView("main");
    if (targetPage === "monitoring") {
      setMonitoringResetVersion((version) => version + 1);
    }
    setIsMobileNavOpen(false);
    window.history.replaceState(null, "", `#${targetPage}`);
  }

  function handleNotificationNavigate(page: PageKey) {
    if (page === "monitoring") {
      handleNavigate("monitoring");
      setMonitoringInitialView("heatmap");
      return;
    }

    if (page !== "relief") {
      handleNavigate(page);
      return;
    }

    const effectiveRole = adminView?.role ?? session?.role;
    const reliefPage = effectiveRole === "barangay" ? "emergencyNotifications" : "relief";
    const reliefAdminView = adminView ?? (session?.role === "cdrrmo" || session?.role === "super"
      ? { role: "cswdd" as const, label: "CSWDD" }
      : undefined);
    handleNavigate(reliefPage, reliefAdminView);
    setReliefInitialView("endorsement");
  }

  function handleNotificationRead(notificationId: number) {
    setReadNotificationIds((currentIds) => {
      if (currentIds.includes(notificationId)) return currentIds;
      const nextIds = [...currentIds, notificationId];
      window.localStorage.setItem("smartflood-read-notifications", JSON.stringify(nextIds));
      return nextIds;
    });
  }

  if (!session) {
    return null;
  }

  return (
    <AppShell
      activePage={activePage}
      adminView={adminView}
      hideTopbar={activePage === "monitoring" && monitoringView !== "main"}
      isMobileNavOpen={isMobileNavOpen}
      navigationItems={navigationItems}
      onNavigate={handleNavigate}
      onToggleMobileNav={() => setIsMobileNavOpen((isOpen) => !isOpen)}
      unreadNotificationCount={Math.max(0, unreadNotificationCount - readNotificationIds.length)}
      userProfile={session.profile}
    >
      {activePage === "dashboard" ? <DashboardPanel onOpenWeather={() => handleNavigate("weatherForecast")} /> : null}
      {activePage === "weatherForecast" ? <WeatherForecastPanel onBack={() => handleNavigate("dashboard")} /> : null}
      {activePage === "logs" ? <LogsPanel /> : null}
      {activePage === "systemLogs" ? <SystemLogs adminView={adminView} /> : null}
      {activePage === "monitoring" ? <MonitoringPanel initialView={monitoringInitialView} resetSignal={monitoringResetVersion} onViewChange={setMonitoringView} userProfile={session.profile} /> : null}
      {activePage === "relief" ? (session.role === "cswdd" || adminView?.role === "cswdd" ? <CswddReliefPanel initialView={reliefInitialView} /> : <ReliefPanel />) : null}
      {activePage === "reliefManagement" ? <ReliefManagementPanel /> : null}
      {activePage === "emergencyNotifications" ? <BarangayReliefPanel barangayScope={adminView?.role === "barangay" ? adminView.label : undefined} initialView={reliefInitialView} /> : null}
      {activePage === "reliefDistribution" ? (session.role === "barangay" || adminView?.role === "barangay" ? <EmergencyReportPanel /> : <ReliefDistributionPanel />) : null}
      {activePage === "sensors" ? <SensorsPanel /> : null}
      {activePage === "residents" ? (
        <ResidentsPanel title={adminView?.role === "cswdd" || session.role === "cswdd" ? "Resident Information" : undefined} />
      ) : null}
      {activePage === "accounts" ? <VerificationPanel /> : null}
      {activePage === "notifications" ? <NotificationPanel onBack={() => handleNavigate("dashboard")} onNavigate={handleNotificationNavigate} onRead={handleNotificationRead} readNotificationIds={readNotificationIds} /> : null}
    </AppShell>
  );
}
