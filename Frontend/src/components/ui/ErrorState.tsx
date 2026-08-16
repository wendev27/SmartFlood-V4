import { Button } from "@/components/ui/Button/Button";
import styles from "./StateBlocks.module.css";

interface ErrorStateProps {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, retryLabel, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.errorState} role="alert">
      <span className={styles.errorIcon} aria-hidden="true">!</span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      {retryLabel && onRetry ? <Button size="sm" tone="danger" onClick={onRetry}>{retryLabel}</Button> : null}
    </div>
  );
}
