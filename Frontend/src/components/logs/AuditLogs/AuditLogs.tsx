"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SmartFloodIcon, type SmartFloodIconName } from "@/components/icons/SmartFloodIcon";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { cn } from "@/lib/cn";
import { formatBarangayName } from "@/lib/formatters";
import { queryKeys, queryStaleTime } from "@/lib/queryKeys";
import { getAuditLogs } from "@/services/logsService";
import type { AuditLog } from "@/types/logs";
import styles from "./AuditLogs.module.css";

export function AuditLogs() {
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const logsQuery = useQuery({
    queryKey: queryKeys.logs.audit,
    queryFn: getAuditLogs,
    staleTime: queryStaleTime.logs,
  });
  const logs = (logsQuery.data ?? []) as unknown as AuditLog[];
  const isLoading = logsQuery.isPending;

  const paginatedLogs = (() => {
    const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
    const safePage = Math.min(page, totalPages);
    return {
      rows: logs.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: logs.length, totalPages } satisfies PaginationState,
    };
  })();

  useEffect(() => {
    if (page !== paginatedLogs.pagination.page) setPage(paginatedLogs.pagination.page);
  }, [page, paginatedLogs.pagination.page]);

  return (
    <article className={styles.card}>
      <div className={styles.logList} aria-label="Audit log events">
        {paginatedLogs.rows.map((log, index) => (
          <section className={cn(styles.logItem, log.tone && styles[log.tone])} key={`${log.timestamp ?? log.created_at}-${log.title ?? log.action}-${index}`}>
            <span className={styles.logIcon}>
              <SmartFloodIcon name={auditIconMap[log.title ?? log.action] ?? "alertLevelUpdate"} size={20} />
            </span>
            <div className={styles.logBody}>
              <div className={styles.logMeta}>
                <strong>{log.title ?? log.action}</strong>
                <span>{log.category ?? log.module}</span>
                <span>{formatBarangayName(log.department ?? log.actor_role)}</span>
              </div>
              <p>{formatBarangayName(log.description)}</p>
              <small>{log.action}</small>
              <div className={styles.trace}>
                <span>{log.timestamp ?? log.created_at}</span>
                <span>Target: {log.target_id ?? log.ipAddress ?? "-"}</span>
              </div>
            </div>
            <span className={cn(styles.status, log.status === "Failed" && styles.failed)}>{log.status ?? "Success"}</span>
          </section>
        ))}
        {isLoading ? <p className={styles.empty}>Loading audit logs...</p> : null}
        {logsQuery.error ? <p className={styles.empty}>{logsQuery.error instanceof Error ? logsQuery.error.message : "Unable to load audit logs."}</p> : null}
        {logsQuery.isFetching && !logsQuery.isPending ? <p className={styles.empty}>Refreshing audit logs...</p> : null}
        {!isLoading && logs.length === 0 ? <p className={styles.empty}>No audit logs found.</p> : null}
      </div>
      <SharedPagination pagination={paginatedLogs.pagination} onPageChange={setPage} label="Audit log events" />
    </article>
  );
}

const auditIconMap: Record<string, SmartFloodIconName> = {
  "Account Updated": "accountUpdated",
  "Alert Level Updated": "alertLevelUpdate",
  "Login Failed": "loginFailed",
  "Login Success": "loginSuccess",
  Logout: "loginSuccess",
  "Resident Added": "residentAdded",
  "Resident Deleted": "residentAdded",
  "Sensor Configured": "sensorConfiguration",
};
