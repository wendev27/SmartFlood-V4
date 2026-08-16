import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Tabs.module.css";

export interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: string;
  countTone?: "blue" | "green" | "red";
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  ariaLabel: string;
}

export function Tabs<T extends string>({ items, activeKey, onChange, ariaLabel }: TabsProps<T>) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.key}
          className={cn(styles.tab, item.key === activeKey && styles.active)}
          type="button"
          onClick={() => onChange(item.key)}
        >
          {item.icon}
          {item.label}
          {item.count ? <b className={cn(styles.count, item.countTone && styles[item.countTone])}>{item.count}</b> : null}
        </button>
      ))}
    </div>
  );
}
