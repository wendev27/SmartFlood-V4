import { cn } from "@/lib/cn";
import type { DashboardStat } from "@/types/dashboard";
import styles from "./StatCard.module.css";

interface StatCardProps {
  stat: DashboardStat;
  isActive?: boolean;
  onClick?: () => void;
}

export function StatCard({ stat, isActive = false, onClick }: StatCardProps) {
  return (
    <article
      className={cn(styles.card, styles[stat.tone], onClick && styles.interactive, isActive && styles.active)}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className={styles.statIcon} aria-hidden="true">
        {/Alerts$/.test(stat.label) ? <BellIcon /> : <SensorIcon />}
      </span>
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      <p className={stat.captionTone ? styles[stat.captionTone] : undefined}>{stat.caption}</p>
    </article>
  );
}

function SensorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.48M7.76 16.24a6 6 0 0 1 0-8.48M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M10.27 21h3.46M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    </svg>
  );
}
