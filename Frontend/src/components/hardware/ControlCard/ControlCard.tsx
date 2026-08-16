import type { ReactNode } from "react";
import styles from "./ControlCard.module.css";

interface ControlCardProps {
  label: string;
  children: ReactNode;
}

export function ControlCard({ label, children }: ControlCardProps) {
  return (
    <article className={styles.card}>
      <span className={styles.label}>{label}</span>
      {children}
    </article>
  );
}
