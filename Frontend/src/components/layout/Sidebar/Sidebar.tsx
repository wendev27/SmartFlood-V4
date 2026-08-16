"use client";

import { navigationItems } from "@/data/navigation";
import { cn } from "@/lib/cn";
import type { NavItem, PageKey } from "@/types/navigation";
import { NavLinkItem } from "@/components/navigation/NavLinkItem/NavLinkItem";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activePage: PageKey;
  isOpen: boolean;
  items?: NavItem[];
  onNavigate: (page: PageKey) => void;
  onToggleMobileNav: () => void;
}

export function Sidebar({ activePage, isOpen, items = navigationItems, onNavigate, onToggleMobileNav }: SidebarProps) {
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
          <svg className={styles.brandMark} viewBox="0 0 92 52" aria-hidden="true">
            <path d="M13 34h46c8 0 14-6 14-14S67 6 59 6c-5 0-9 2-12 6-3-6-8-9-15-9C21 3 12 12 12 23c0 4 1 8 4 11h-3z" />
            <circle cx="27" cy="24" r="5" />
            <circle cx="47" cy="24" r="5" />
            <path d="M20 41c8 5 16 5 24 0 8-5 16-5 24 0" />
          </svg>
          <div>
            <p>smartflood</p>
            <h1>SmartFlood</h1>
          </div>
        </div>
        <div className={styles.navLinks} id="smartflood-nav-links">
          {items.map((item) => (
            <NavLinkItem
              key={item.key}
              item={item}
              isActive={item.key === activePage}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
