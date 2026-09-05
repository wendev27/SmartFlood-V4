"use client";

import { navigationItems } from "@/data/navigation";
import { cn } from "@/lib/cn";
import type { NavItem, PageKey } from "@/types/navigation";
import { NavLinkItem } from "@/components/navigation/NavLinkItem/NavLinkItem";
import type { DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import { clearStoredSession } from "@/lib/authSession";
import { formatBarangayName } from "@/lib/formatters";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activePage: PageKey;
  isOpen: boolean;
  items?: NavItem[];
  userProfile: DashboardUserProfile;
  onNavigate: (page: PageKey) => void;
  onToggleMobileNav: () => void;
}

export function Sidebar({ activePage, isOpen, items = navigationItems, userProfile, onNavigate, onToggleMobileNav }: SidebarProps) {
  const isCswdd = /cswdd|city welfare/i.test(`${userProfile.roleLabel} ${userProfile.displayName}`);
  const barangayKey = String(userProfile.barangayName ?? "").toLowerCase().replace("ñ", "n");
  const barangaySeal = isCswdd
    ? "/images/cswdd/cswdd-seal.png"
    : barangayKey.includes("longos")
    ? "/images/dashboard/barangay-longos-seal.png"
    : barangayKey.includes("tanong")
      ? "/images/dashboard/barangay-tanong-seal.jpg"
      : barangayKey.includes("potrero")
        ? "/images/dashboard/barangay-potrero-seal.png"
        : "";
  const activeItemIndex = items.findIndex((item) => item.key === activePage);
  const barangayLabel = formatBarangayName(String(userProfile.barangayName || userProfile.displayName || "Barangay"))
    .replace(/^barangay\s+/i, "")
    .trim();
  const systemLogLabel = barangayLabel ? `Barangay ${barangayLabel} System Logs` : "Barangay System Logs";

  function logout() {
    fetch("/api/auth/logout", { method: "POST", keepalive: true }).catch(() => undefined);
    clearStoredSession();
    window.location.href = "/";
  }

  return (
    <aside className={styles.sidebar} aria-label="Main navigation">
      <nav className={cn(styles.navCard, isOpen && styles.open)}>
        <button
          className={styles.mobileToggle}
          type="button"
          aria-expanded={isOpen}
          aria-controls="smartflood-nav-links"
          onClick={onToggleMobileNav}
        >
          <span />
          Menu
        </button>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          <h1>SmartFlood</h1>
        </div>
        <div className={styles.navLinks} id="smartflood-nav-links">
          {activeItemIndex >= 0 ? (
            <span
              className={styles.activeIndicator}
              style={{ transform: `translateY(${activeItemIndex * 70}px)` }}
              aria-hidden="true"
            />
          ) : null}
          {items.map((item) => (
            <NavLinkItem
              key={item.key}
              item={item.key === "systemLogs" && !isCswdd ? { ...item, label: systemLogLabel } : item}
              isActive={item.key === activePage}
              onNavigate={onNavigate}
            />
          ))}
        </div>
        <div className={styles.profileCard}>
          {barangaySeal
            ? <img className={styles.profileSeal} src={barangaySeal} alt="" />
            : <span className={styles.profileAvatar}>{userProfile.initials}</span>}
          <div>
            <strong>{isCswdd ? "CSWDD Official" : formatBarangayName(userProfile.displayName || userProfile.roleLabel)}</strong>
            <small>Disaster Response</small>
          </div>
          <button type="button" onClick={logout} aria-label="Log out">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9" /></svg>
          </button>
        </div>
      </nav>
    </aside>
  );
}
