import { pageCopy } from "@/data/pageCopy";
import { DashboardHeaderActions } from "@/components/layout/DashboardHeaderActions/DashboardHeaderActions";
import type { DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import type { DashboardRole, PageKey } from "@/types/navigation";
import styles from "./Topbar.module.css";

interface TopbarProps {
  actionsOnly?: boolean;
  userRole?: DashboardRole;
  activePage: PageKey;
  userProfile: DashboardUserProfile;
}

export function Topbar({ activePage, userProfile, userRole, actionsOnly = false }: TopbarProps) {
  const copy = activePage === "systemLogs"
    ? { ...pageCopy[activePage], title: userProfile.logLabel }
    : pageCopy[activePage];

  const hasPageHeading = actionsOnly || ["logs", "systemLogs", "residents", "accounts", "monitoring", "relief", "emergencyNotifications"].includes(activePage);
  const subtitle = activePage === "dashboard" && (userRole === "super" || userRole === "cdrrmo")
    ? "Monitor city-wide flood operations efficiently and effectively."
    : copy.subtitle;

  return (
    <header className={hasPageHeading ? styles.actionsOnly : `${styles.topbar} ${activePage === "dashboard" ? styles.dashboardTopbar : ""}`}>
      {hasPageHeading ? null : <div>
        <h2>{copy.title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>}
      <DashboardHeaderActions userProfile={userProfile} />
    </header>
  );
}
