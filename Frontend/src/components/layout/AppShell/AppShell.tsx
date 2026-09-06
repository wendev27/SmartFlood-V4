"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { Topbar } from "@/components/layout/Topbar/Topbar";
import type { NavItem, PageKey } from "@/types/navigation";
import styles from "./AppShell.module.css";

export interface DashboardUserProfile {
  userId: string;
  displayName: string;
  email: string;
  roleLabel: string;
  roleSubtitle: string;
  initials: string;
  logLabel: string;
  barangayId?: number | null;
  barangayName?: string | null;
}

export type AdminViewContext = {
  role: "cswdd" | "barangay";
  label: string;
};

interface AppShellProps {
  activePage: PageKey;
  adminView?: AdminViewContext | null;
  isMobileNavOpen: boolean;
  hideTopbar?: boolean;
  navigationItems?: NavItem[];
  userProfile: DashboardUserProfile;
  onNavigate: (page: PageKey, adminView?: AdminViewContext) => void;
  onToggleMobileNav: () => void;
  unreadNotificationCount?: number;
  children: ReactNode;
}

export function AppShell({
  activePage,
  adminView,
  isMobileNavOpen,
  hideTopbar = false,
  navigationItems,
  userProfile,
  onNavigate,
  onToggleMobileNav,
  unreadNotificationCount = 0,
  children,
}: AppShellProps) {
  return (
    <main className={styles.shell}>
      <Sidebar
        activePage={activePage}
        adminView={adminView}
        isOpen={isMobileNavOpen}
        items={navigationItems}
        userProfile={userProfile}
        onNavigate={onNavigate}
        onToggleMobileNav={onToggleMobileNav}
      />
      <section className={styles.dashboard}>
        {hideTopbar ? null : <Topbar activePage={activePage} adminView={adminView} onNavigate={onNavigate} unreadNotificationCount={unreadNotificationCount} userProfile={userProfile} />}
        <div className={styles.content}>{children}</div>
      </section>
    </main>
  );
}
