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
  const isBarangayModuleLanding = activePage === "reliefDistribution" && /barangay/i.test(userProfile.roleLabel);
  const isBarangayRbi = activePage === "residents" && /barangay/i.test(userProfile.roleLabel);
  const isBarangayRegistration = activePage === "accounts" && /barangay/i.test(userProfile.roleLabel);
  const isSystemLogsPage = activePage === "systemLogs";
  const isCswddRelief = activePage === "relief" && /cswdd/i.test(userProfile.roleLabel);
  const isCdrrmoAccount = activePage === "logs" && /cdrrmo|command center|super admin/i.test(`${userProfile.roleLabel} ${userProfile.displayName}`);
  const isActionsOnly = activePage === "monitoring" || activePage === "emergencyNotifications" || isBarangayModuleLanding || isBarangayRbi || isBarangayRegistration || isSystemLogsPage || isCswddRelief || isCdrrmoAccount;
  const copy = activePage === "systemLogs"
    ? { ...pageCopy[activePage], title: userProfile.logLabel }
    : pageCopy[activePage];

  return (
    <header className={isActionsOnly ? styles.actionsOnly : styles.topbar}>
      {isActionsOnly ? null : <div>
        <h2>{copy.title}</h2>
        {copy.subtitle ? <p>{copy.subtitle}</p> : null}
      </div>}
      <DashboardHeaderActions />
    </header>
  );
}
