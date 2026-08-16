"use client";

import { cn } from "@/lib/cn";
import type { NavItem, PageKey } from "@/types/navigation";
import { SmartFloodIcon, type SmartFloodIconName } from "@/components/icons/SmartFloodIcon";
import styles from "./NavLinkItem.module.css";

interface NavLinkItemProps {
  item: NavItem;
  isActive: boolean;
  onNavigate: (page: PageKey) => void;
}

export function NavLinkItem({ item, isActive, onNavigate }: NavLinkItemProps) {
  return (
    <a
      className={cn(styles.link, isActive && styles.active)}
      href={`#${item.key}`}
      aria-current={isActive ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(item.key);
      }}
    >
      <span className={styles.icon}>
        <SmartFloodIcon name={navIconMap[item.icon]} size={32} />
      </span>
      {item.label}
    </a>
  );
}

const navIconMap: Record<NavItem["icon"], SmartFloodIconName> = {
  check: "accountCheck",
  cube: "cube",
  document: "systemLogs",
  droplet: "floodHeatmap",
  folder: "auditLogs",
  home: "dashboard",
  monitor: "hardware",
  signal: "sensorConfiguration",
  users: "resident",
};
