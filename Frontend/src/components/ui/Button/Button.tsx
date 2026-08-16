import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: "primary" | "success" | "danger" | "muted" | "purple";
  size?: "sm" | "md";
}

export function Button({ children, tone = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button className={cn(styles.button, styles[tone], styles[size], className)} type={type} {...props}>
      {children}
    </button>
  );
}
