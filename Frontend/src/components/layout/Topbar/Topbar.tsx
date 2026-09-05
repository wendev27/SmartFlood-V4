import { pageCopy } from "@/data/pageCopy";
import { DashboardHeaderActions } from "@/components/layout/DashboardHeaderActions/DashboardHeaderActions";
import type { AdminViewContext, DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import type { PageKey } from "@/types/navigation";
import styles from "./Topbar.module.css";

interface TopbarProps {
  activePage: PageKey;
  adminView?: AdminViewContext | null;
  userProfile: DashboardUserProfile;
}

export function Topbar({ activePage, adminView, userProfile }: TopbarProps) {
  const effectiveRole = adminView?.role ?? (/barangay/i.test(userProfile.roleLabel) ? "barangay" : /cswdd/i.test(userProfile.roleLabel) ? "cswdd" : "cdrrmo");
  const isBarangayModuleLanding = activePage === "reliefDistribution" && effectiveRole === "barangay";
  const isResidentPage = activePage === "residents";
  const isBarangayRegistration = activePage === "accounts" && effectiveRole === "barangay";
  const isSystemLogsPage = activePage === "systemLogs";
  const isCswddRelief = activePage === "relief" && effectiveRole === "cswdd";
  const isCdrrmoAccount = activePage === "logs" && /cdrrmo|command center|super admin/i.test(`${userProfile.roleLabel} ${userProfile.displayName}`);
  const isActionsOnly = activePage === "monitoring" || activePage === "emergencyNotifications" || isBarangayModuleLanding || isResidentPage || isBarangayRegistration || isSystemLogsPage || isCswddRelief || isCdrrmoAccount;
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
