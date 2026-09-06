import { Ripple } from "@/components/ui/Ripple";
import styles from "./StateBlocks.module.css";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className={styles.loadingState} role="status" aria-live="polite">
      <Ripple className={styles.ripple} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
