import { cn } from "@/lib/cn";
import styles from "./Badge.module.css";

interface BadgeProps {
  children: string;
  tone?: "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray";
}

export function Badge({ children, tone = "blue" }: BadgeProps) {
  return <span className={cn(styles.badge, styles[tone])}>{children}</span>;
}
