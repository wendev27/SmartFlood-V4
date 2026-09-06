import { Ripple } from "@/components/ui/Ripple";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.screen} role="status" aria-live="polite">
      <Ripple className={styles.ripple} aria-hidden="true" />
      <p>Loading SmartFlood...</p>
    </main>
  );
}
