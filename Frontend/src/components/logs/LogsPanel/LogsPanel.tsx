import { AccountManagement } from "@/components/logs/AccountManagement/AccountManagement";
import styles from "./LogsPanel.module.css";

export function LogsPanel() {
  return (
    <section className={styles.panel} aria-label="Account management">
      <AccountManagement />
    </section>
  );
}
