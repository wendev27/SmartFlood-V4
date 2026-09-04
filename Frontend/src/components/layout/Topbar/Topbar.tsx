import { pageCopy } from "@/data/pageCopy";
import { DashboardHeaderActions } from "@/components/layout/DashboardHeaderActions/DashboardHeaderActions";
import type { DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import type { PageKey } from "@/types/navigation";
import styles from "./Topbar.module.css";

interface TopbarProps {
  activePage: PageKey;
  userProfile: DashboardUserProfile;
}

export function Topbar({ activePage, userProfile }: TopbarProps) {
  const copy = activePage === "systemLogs"
    ? { ...pageCopy[activePage], title: userProfile.logLabel }
    : pageCopy[activePage];

  return (
    <header className={activePage === "monitoring" || activePage === "emergencyNotifications" ? styles.actionsOnly : styles.topbar}>
      {activePage === "monitoring" || activePage === "emergencyNotifications" ? null : <div>
        <h2>{copy.title}</h2>
        {copy.subtitle ? <p>{copy.subtitle}</p> : null}
      </div>}
      <DashboardHeaderActions />
    </header>
  );
}
