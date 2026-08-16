import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./DataTable.module.css";

interface DataTableProps {
  headers: string[];
  children: ReactNode;
  minWidth?: number;
  className?: string;
}

export function DataTable({ headers, children, minWidth = 820, className }: DataTableProps) {
  return (
    <div className={cn(styles.wrap, className)}>
      <table className={styles.table} style={{ minWidth }}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`${header}-${index}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
