import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button/Button";
import styles from "./StateBlocks.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  searchResult?: boolean;
}

export function EmptyState({ title, description, icon, actionLabel, onAction, searchResult }: EmptyStateProps) {
  const showSearchDesign = searchResult ?? /match|search|filter/i.test(`${title} ${description}`);

  return (
    <div className={showSearchDesign ? `${styles.emptyState} ${styles.searchEmptyState}` : styles.emptyState} role="status">
      {showSearchDesign
        ? <img className={styles.noResultsImage} src="/images/empty-states/no-results.svg" alt="" aria-hidden="true" />
        : <span className={styles.emptyIcon} aria-hidden="true">{icon ?? "i"}</span>}
      <strong>{showSearchDesign ? "Nothing found here" : title}</strong>
      <p>{description}</p>
      {actionLabel && onAction ? <Button size="sm" onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
