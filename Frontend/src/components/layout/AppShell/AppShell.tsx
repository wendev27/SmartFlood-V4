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

interface AppShellProps {
  activePage: PageKey;
  isMobileNavOpen: boolean;
  hideTopbar?: boolean;
  navigationItems?: NavItem[];
  userProfile: DashboardUserProfile;
  onNavigate: (page: PageKey) => void;
  onToggleMobileNav: () => void;
  children: ReactNode;
}

export function AppShell({
  activePage,
  isMobileNavOpen,
  hideTopbar = false,
  navigationItems,
  userProfile,
  onNavigate,
  onToggleMobileNav,
  children,
}: AppShellProps) {
  return (
    <main className={styles.shell}>
      <Sidebar
        activePage={activePage}
        isOpen={isMobileNavOpen}
        items={navigationItems}
        onNavigate={onNavigate}
        onToggleMobileNav={onToggleMobileNav}
      />
      <section className={styles.dashboard}>
        {hideTopbar ? null : <Topbar activePage={activePage} userProfile={userProfile} />}
        {children}
      </section>
    </main>
  );
}
