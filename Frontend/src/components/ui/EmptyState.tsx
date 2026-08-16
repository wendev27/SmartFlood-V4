import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button/Button";
import styles from "./StateBlocks.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon} aria-hidden="true">{icon ?? "i"}</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction ? <Button size="sm" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
