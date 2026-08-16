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
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      <p className={stat.captionTone ? styles[stat.captionTone] : undefined}>{stat.caption}</p>
    </article>
  );
}
