import { cn } from "@/lib/cn";
import styles from "./ModuleCard.module.css";

interface ModuleCardProps {
  label: string;
  value: string;
  caption: string;
  emphasis?: boolean;
}

export function ModuleCard({ label, value, caption, emphasis }: ModuleCardProps) {
  return (
    <article className={cn(styles.card, emphasis && styles.emphasis)}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
    </article>
  );
}
