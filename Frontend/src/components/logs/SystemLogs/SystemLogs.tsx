"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { getCurrentUser, logLabelForRole, normalizeUserRole } from "@/lib/authSession";
import { cn } from "@/lib/cn";
import { formatBarangayName, normalizeBarangayForCompare } from "@/lib/formatters";
import { filterLogsForViewer } from "@/lib/logVisibility";
import { queryKeys, queryStaleTime } from "@/lib/queryKeys";
import { getAuditLogs } from "@/services/logsService";
import type { AuditLog } from "@/types/logs";
import type { AdminViewContext } from "@/components/layout/AppShell/AppShell";
import styles from "./SystemLogs.module.css";

export function SystemLogs({ adminView }: { adminView?: AdminViewContext | null }) {
  const pageSize = 7;
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [previewLog, setPreviewLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const user = getCurrentUser();
  const role = normalizeUserRole(user) ?? "barangay";
  const isUniversalViewer = role === "cdrrmo" || role === "super";
  const title = isUniversalViewer
    ? "CDRRMO Command Center System Logs"
    : adminView
    ? `${adminView.label} System Logs`
    : logLabelForRole(role, user);
  const emptyMessage = role === "cswdd" ? "No CSWDD logs found." : "No logs available for your role or assigned barangay.";
  const logsQuery = useQuery({
    queryKey: queryKeys.logs.audit,
    queryFn: getAuditLogs,
    staleTime: queryStaleTime.logs,
  });
  const logsSource = useMemo(() => (logsQuery.data ?? []) as unknown as AuditLog[], [logsQuery.data]);
  const isLoading = logsQuery.isPending;
  const error = logsQuery.error instanceof Error ? logsQuery.error.message : logsQuery.error ? "Unable to load logs." : "";

  const roleScopedLogs = useMemo(() => filterLogsForViewer(logsSource, user), [logsSource, user]);
  const departmentOptions = useMemo(() => unique(roleScopedLogs.map(departmentForLog)), [roleScopedLogs]);
  const moduleOptions = useMemo(() => unique(roleScopedLogs.map((log) => log.module ?? "")), [roleScopedLogs]);
  const actionOptions = useMemo(() => unique(roleScopedLogs.map((log) => log.action)), [roleScopedLogs]);

  const logs = useMemo(() => {
    const normalizedQuery = normalizeBarangayForCompare(query);
    return roleScopedLogs.filter((log) => {
      const searchable = [
        log.actor_name,
        log.actor_role,
        log.action,
        log.module,
        log.description,
        log.barangay_name,
        log.created_at,
      ].join(" ");
      const matchesQuery = !normalizedQuery || normalizeBarangayForCompare(searchable).includes(normalizedQuery);
      return matchesQuery
        && (!departmentFilter || departmentForLog(log) === departmentFilter)
        && (!moduleFilter || log.module === moduleFilter)
        && (!actionFilter || log.action === actionFilter);
    });
  }, [actionFilter, departmentFilter, moduleFilter, query, roleScopedLogs]);

  const paginatedLogs = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      rows: logs.slice(start, start + pageSize),
      pagination: { page: safePage, limit: pageSize, total: logs.length, totalPages } satisfies PaginationState,
    };
  }, [logs, page]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, departmentFilter, moduleFilter, query]);

  useEffect(() => {
    if (page !== paginatedLogs.pagination.page) setPage(paginatedLogs.pagination.page);
  }, [page, paginatedLogs.pagination.page]);

  return (
    <section className={styles.panel} aria-label={title}>
      <h1>{title}</h1>
      <article className={cn(styles.logCard, !isLoading && paginatedLogs.rows.length === 0 && styles.emptyCard)}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search by name, email, or employee ID..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {isUniversalViewer ? <select aria-label="Filter logs by department or office" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="">All Departments / Offices</option>
          {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
        </select> : null}
        <select aria-label="Filter logs by module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
          <option value="">All Modules</option>
          {moduleOptions.map((module) => <option key={module} value={module}>{formatBarangayName(module)}</option>)}
        </select>
        <select aria-label="Filter logs by action" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          <option value="">All Actions</option>
          {actionOptions.map((action) => <option key={action} value={action}>{formatBarangayName(action)}</option>)}
        </select>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {logsQuery.isFetching && !logsQuery.isPending ? <p className={styles.error} role="status">Refreshing logs...</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Email</th>
              <th>Department</th>
              <th>Action</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.rows.map((log) => (
              <tr key={log.log_id ?? `${log.created_at}-${log.action}`}>
                <td className={styles.event}>{log.action}</td>
                <td>{formatBarangayName(log.actor_name || "-")}</td>
                <td>{departmentForLog(log)}</td>
                <td>{formatBarangayName(log.description || log.module || "-")}</td>
                <td>{formatDateTime(log.created_at ?? "")}</td>
              </tr>
            ))}
            {isLoading ? (
              <tr>
                <td className={styles.empty} colSpan={5}>Loading logs...</td>
              </tr>
            ) : null}
            {!isLoading && logs.length === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={5}>
                  <EmptyState
                    searchResult={Boolean(query || departmentFilter || moduleFilter || actionFilter)}
                    title="No logs match your filters"
                    description={query || departmentFilter || moduleFilter || actionFilter ? "We couldn’t find any system logs matching your search or active filters." : emptyMessage}
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </article>
      <Pagination compact pagination={paginatedLogs.pagination} onPageChange={setPage} label="System logs" />

      <Modal isOpen={Boolean(previewLog)} onClose={() => setPreviewLog(null)} labelledBy="log-preview-title" size="md">
        {previewLog ? (
          <>
            <header className={styles.modalHeader}>
              <div>
                <h3 id="log-preview-title">Log Details</h3>
                <p>Complete activity record</p>
              </div>
              <button type="button" onClick={() => setPreviewLog(null)} aria-label="Close log preview">x</button>
            </header>
            <div className={styles.modalBody}>
              <dl className={styles.detailGrid}>
                <Detail label="Date/Time" value={formatDateTime(previewLog.created_at ?? previewLog.timestamp ?? "")} />
                <Detail label="Actor" value={previewLog.actor_name || previewLog.user || "-"} />
                <Detail label="Role" value={previewLog.actor_role || "-"} />
                <Detail label="Action" value={previewLog.action} />
                <Detail label="Module" value={previewLog.module || "-"} />
                <Detail label="Barangay" value={previewLog.barangay_name || "-"} />
                {previewLog.status ? <Detail label="Status / Result" value={previewLog.status} /> : null}
                <Detail label="Description" value={previewLog.description || "-"} wide />
              </dl>
              {getMetadata(previewLog).length > 0 ? (
                <section className={styles.metadata} aria-label="Log metadata">
                  <h4>Metadata</h4>
                  <dl className={styles.detailGrid}>
                    {getMetadata(previewLog).map(([label, value]) => <Detail key={label} label={label} value={value} />)}
                  </dl>
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </Modal>
    </section>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? styles.wideDetail : undefined}>
      <dt>{label}</dt>
      <dd>{formatBarangayName(value)}</dd>
    </div>
  );
}

function getMetadata(log: AuditLog): Array<[string, string]> {
  return [
    ["Log ID", log.log_id],
    ["Actor User ID", log.actor_user_id],
    ["Target Type", log.target_type],
    ["Target ID", log.target_id],
    ["Barangay ID", log.barangay_id],
    ["Category", log.category],
    ["Department", log.department],
    ["IP Address", log.ipAddress],
  ].flatMap(([label, value]) => value == null || value === "" ? [] : [[String(label), String(value)]]);
}

function getActionTone(action: string) {
  const value = action.toUpperCase().replace(/[\s-]+/g, "_");

  if (
    value.includes("DELETE")
    || value.includes("REJECT")
    || value.includes("BLOCK")
    || value.includes("DISABLE")
    || value.includes("FAILED")
    || value.includes("ERROR")
  ) return "badgeDanger";

  if (
    value.includes("EDIT")
    || value.includes("UPDATE")
    || value.includes("CHANGE")
    || value.includes("REVIEW")
    || value.includes("MODIFY")
  ) return "badgeWarning";

  if (
    value.includes("LOGIN_SUCCESS")
    || value.includes("LOGOUT")
    || value.includes("CREATE")
    || value.includes("ADD")
    || value.includes("APPROVE")
    || value.includes("GENERATED")
    || value.includes("REGISTER")
    || value.includes("ENABLE")
  ) return "badgeSuccess";

  return "badgeNeutral";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function departmentForLog(log: AuditLog) {
  const explicitDepartment = String(log.department ?? "").trim();
  if (explicitDepartment && !/^(system|sensor|authentication)$/i.test(explicitDepartment)) {
    return formatBarangayName(explicitDepartment);
  }
  if (log.barangay_name) return formatBarangayName(log.barangay_name);

  const source = `${log.actor_role ?? ""} ${log.module ?? ""}`;
  if (/cswdd|city welfare/i.test(source)) return "CSWDD";
  if (/barangay/i.test(source)) return "Barangay";
  if (/cdrrmo|ndrrmo|command center|disaster/i.test(source)) return "CDRRMO";
  return explicitDepartment ? formatBarangayName(explicitDepartment) : "System";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
