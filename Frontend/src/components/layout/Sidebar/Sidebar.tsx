"use client";

import { navigationItems } from "@/data/navigation";
import { cn } from "@/lib/cn";
import type { NavItem, PageKey } from "@/types/navigation";
import { NavLinkItem, SidebarIcon } from "@/components/navigation/NavLinkItem/NavLinkItem";
import type { DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import { clearStoredSession } from "@/lib/authSession";
import { formatBarangayName } from "@/lib/formatters";
import styles from "./Sidebar.module.css";

const commandCenterAccess = [
  {
    label: "CSWDD",
    seal: "/images/cswdd/cswdd-seal.png",
    items: [
      { key: "dashboard", label: "Home", icon: "home" },
      { key: "monitoring", label: "Flood Monitoring Module", icon: "droplet" },
      { key: "relief", label: "Relief Management", icon: "cube" },
      { key: "residents", label: "Resident Information", icon: "users" },
      { key: "systemLogs", label: "CSWDD System Logs", icon: "document" },
    ] as NavItem[],
  },
  ...[
    ["Barangay Longos", "/images/dashboard/barangay-longos-seal.png"],
    ["Barangay Tañong", "/images/dashboard/barangay-tanong-seal.jpg"],
    ["Barangay Potrero", "/images/dashboard/barangay-potrero-seal.png"],
  ].map(([label, seal]) => ({
    label,
    seal,
    items: [
      { key: "dashboard", label: "Home", icon: "home" },
      { key: "monitoring", label: "Flood Monitoring Module", icon: "droplet" },
      { key: "emergencyNotifications", label: "Relief Management", icon: "cube" },
      { key: "reliefDistribution", label: "Emergency Report Management", icon: "document" },
      { key: "residents", label: "Registry of Barangay Inhabitants (RBI)", icon: "users" },
      { key: "accounts", label: "Resident Account Registration Management", icon: "check" },
      { key: "systemLogs", label: `${label} System Logs`, icon: "document" },
    ] as NavItem[],
  })),
];

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
  const isCdrrmo = /cdrrmo|command center|super admin/i.test(`${userProfile.roleLabel} ${userProfile.displayName}`);
  const isBarangay = !isCswdd && !isCdrrmo;
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
              item={item.key === "systemLogs" && isBarangay ? { ...item, label: systemLogLabel } : item}
              isActive={item.key === activePage}
              onNavigate={onNavigate}
            />
          ))}
          {isCdrrmo ? (
            <div className={styles.accessGroups}>
              {commandCenterAccess.map((group) => (
                <details className={styles.accessGroup} key={group.label}>
                  <summary>
                    <img src={group.seal} alt="" />
                    <span>{group.label}</span>
                    <svg className={styles.chevron} viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
                  </summary>
                  <div className={styles.accessItems}>
                    {group.items.map((item) => (
                      <button type="button" key={`${group.label}-${item.key}`} onClick={() => onNavigate(item.key)}>
                        <span className={styles.accessIcon}><SidebarIcon item={item} /></span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : null}
        </div>
        <div className={styles.profileCard}>
          {barangaySeal
            ? <img className={styles.profileSeal} src={barangaySeal} alt="" />
            : <span className={styles.profileAvatar}>{isCdrrmo ? "CO" : userProfile.initials}</span>}
          <div>
            <strong>{isCswdd ? "CSWDD Official" : isCdrrmo ? "CDRRMO Command Center" : formatBarangayName(userProfile.displayName || userProfile.roleLabel)}</strong>
            <small>Disaster Response</small>
          </div>
          <button type="button" onClick={logout} aria-label="Log out">
            <svg className={styles.logoutIcon} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M13.9698 20.4147H13.8506C9.78063 20.4147 7.81899 18.8105 7.47982 15.2172C7.44315 14.8413 7.71815 14.5022 8.10315 14.4655C8.47899 14.4288 8.81815 14.713 8.85482 15.0888C9.12065 17.9672 10.4773 19.0397 13.8598 19.0397H13.979C17.7098 19.0397 19.0298 17.7197 19.0298 13.9888V8.01214C19.0298 4.2813 17.7098 2.9613 13.979 2.9613H13.8598C10.459 2.9613 9.10232 4.05214 8.85482 6.98547C8.80899 7.3613 8.49732 7.64547 8.10315 7.6088C7.71815 7.5813 7.44314 7.24214 7.47064 6.8663C7.78231 3.21797 9.75313 1.5863 13.8506 1.5863H13.9698C18.4706 1.5863 20.3956 3.5113 20.3956 8.01214V13.9888C20.3956 18.4897 18.4706 20.4147 13.9698 20.4147Z" fill="#0088FF" />
              <path d="M13.6402 11.6875H1.8335C1.45766 11.6875 1.146 11.3758 1.146 11C1.146 10.6242 1.45766 10.3125 1.8335 10.3125H13.6402C14.016 10.3125 14.3277 10.6242 14.3277 11C14.3277 11.3758 14.0252 11.6875 13.6402 11.6875Z" fill="#0088FF" />
              <path d="M11.5959 14.7581C11.4217 14.7581 11.2475 14.6939 11.11 14.5564C10.8442 14.2906 10.8442 13.8506 11.11 13.5848L13.695 10.9998L11.11 8.41482C10.8442 8.14898 10.8442 7.70898 11.11 7.44315C11.3759 7.17732 11.8159 7.17732 12.0817 7.44315L15.1525 10.5139C15.4184 10.7798 15.4184 11.2198 15.1525 11.4856L12.0817 14.5564C11.9442 14.6939 11.77 14.7581 11.5959 14.7581Z" fill="#0088FF" />
            </svg>
          </button>
        </div>
      </nav>
    </aside>
  );
}
