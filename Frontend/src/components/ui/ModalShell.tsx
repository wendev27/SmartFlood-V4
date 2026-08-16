"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/Modal/Modal";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ModalShell({ open, onClose, title, subtitle, children, size = "lg" }: ModalShellProps) {
  const labelledBy = title ? "modal-shell-title" : "modal-shell";

  return (
    <Modal isOpen={open} onClose={onClose} labelledBy={labelledBy} size={size}>
      {title ? (
        <header>
          <h2 id={labelledBy}>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      ) : null}
      {children}
    </Modal>
  );
}
