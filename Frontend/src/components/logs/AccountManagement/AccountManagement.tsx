"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ActionResultModal, type ActionResultType } from "@/components/ui/ActionResultModal";
import { Badge } from "@/components/ui/Badge/Badge";
import { Button } from "@/components/ui/Button/Button";
import { DataTable } from "@/components/ui/DataTable/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal/Modal";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { withAuditActor } from "@/lib/auditClient";
import { formatBarangayName, normalizeBarangayForCompare } from "@/lib/formatters";
import { fetchJson } from "@/services/apiClient";
import { getAccountUsers } from "@/services/logsService";
import styles from "./AccountManagement.module.css";

type AccountStatus = "active" | "inactive" | "blocked";
type AccountFormMode = "add" | "edit";

type AccountUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile_number: string;
  address: string;
  sex: string;
  role_id: number | null;
  role_label: string;
  role_name: string;
  department: string;
  barangay_id: number | null;
  barangay_name: string;
  status: AccountStatus;
  failed_login_attempts: number;
  locked_until: string;
  last_login_at: string;
  created_at: string;
  updated_at: string;
};

type AccountFormState = {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password: string;
  confirm_password: string;
  address: string;
  sex: string;
  role_id: string;
  barangay_id: string;
  status: AccountStatus;
};

const emptyForm: AccountFormState = {
  first_name: "",
  last_name: "",
  email: "",
  mobile_number: "",
  password: "",
  confirm_password: "",
  address: "",
  sex: "",
  role_id: "",
  barangay_id: "",
  status: "active",
};

const roleOptions = [
  "Super Admin",
  "NDRRMO Officer",
  "City Welfare",
  "Barangay Official",
];

const barangayOptions = [
  { id: "1", label: "Barangay Tanong" },
  { id: "2", label: "Barangay Catmon" },
  { id: "3", label: "Barangay Potrero" },
];

export function AccountManagement() {
  const pageSize = 5;
  const [users, setUsers] = useState<AccountUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formMode, setFormMode] = useState<AccountFormMode>("add");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AccountUserRow | null>(null);
  const [previewUser, setPreviewUser] = useState<AccountUserRow | null>(null);
  const [passwordUser, setPasswordUser] = useState<AccountUserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resultModal, setResultModal] = useState({
    open: false,
    type: "success" as ActionResultType,
    title: "",
    description: "",
    details: "",
  });

  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getAccountUsers();
      setUsers(data.map(mapAccountUser));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load account users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const departmentOptions = useMemo(() => uniqueSorted(users.map((user) => user.department)), [users]);
  const roleFilterOptions = useMemo(() => {
    const labels = new Set(roleOptions);
    users.forEach((user) => labels.add(user.role_label || "Unassigned"));
    return Array.from(labels).sort((a, b) => roleSortValue(a) - roleSortValue(b) || a.localeCompare(b));
  }, [users]);

  const displayedUsers = useMemo(() => users.filter((user) => {
    const normalizedSearch = normalizeBarangayForCompare(search);
    const normalizedStatus = statusLabel(user.status);
    const matchesSearch = !normalizedSearch || [
      user.first_name,
      user.last_name,
      user.full_name,
      user.email,
      user.mobile_number,
      user.role_label,
      user.role_name,
      user.department,
      user.barangay_name,
      normalizedStatus,
    ].some((value) => normalizeBarangayForCompare(value).includes(normalizedSearch));

    return matchesSearch
      && (!departmentFilter || normalizeBarangayForCompare(user.department) === normalizeBarangayForCompare(departmentFilter))
      && (!roleFilter || user.role_label === roleFilter)
      && (!statusFilter || user.status === statusFilter);
  }), [departmentFilter, roleFilter, search, statusFilter, users]);
  const paginatedUsers = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(displayedUsers.length / pageSize));
    const safePage = Math.min(page, totalPages);
    return {
      rows: displayedUsers.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: displayedUsers.length, totalPages } satisfies PaginationState,
    };
  }, [displayedUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [departmentFilter, roleFilter, search, statusFilter]);

  useEffect(() => {
    if (page !== paginatedUsers.pagination.page) setPage(paginatedUsers.pagination.page);
  }, [page, paginatedUsers.pagination.page]);

  function openAddForm() {
    setFormMode("add");
    setSelectedUser(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(user: AccountUserRow) {
    setFormMode("edit");
    setSelectedUser(user);
    setPreviewUser(null);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mobile_number: user.mobile_number,
      password: "",
      confirm_password: "",
      address: user.address,
      sex: user.sex,
      role_id: user.role_id ? String(user.role_id) : "",
      barangay_id: user.barangay_id ? String(user.barangay_id) : "",
      status: user.status,
    });
    setFormError("");
    setIsFormOpen(true);
  }

  function updateForm<K extends keyof AccountFormState>(field: K, value: AccountFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const validationError = validateAccountForm(form, formMode);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      mobile_number: normalizePhilippineMobile(form.mobile_number),
      address: form.address,
      sex: form.sex,
      role_id: Number(form.role_id),
      barangay_id: form.barangay_id ? Number(form.barangay_id) : null,
      status: formMode === "add" ? "active" : form.status,
      ...(formMode === "add" ? { password: form.password } : {}),
    };

    setIsSubmitting(true);
    try {
      if (formMode === "edit" && selectedUser) {
        await fetchJson(`/api/app-users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(withAuditActor(payload)),
        });
      } else {
        await fetchJson("/api/app-users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(withAuditActor(payload)),
        });
      }

      setIsFormOpen(false);
      await refreshUsers();
      setResultModal({
        open: true,
        type: "success",
        title: formMode === "edit" ? "Account Updated Successfully" : "Account Created Successfully",
        description: formMode === "edit" ? "The dashboard account profile and RBAC settings were updated." : "The dashboard account is ready for login with its assigned role.",
        details: "Password hashes are stored server-side and never returned to the client.",
      });
    } catch (saveError) {
      setResultModal({
        open: true,
        type: "error",
        title: formMode === "edit" ? "Failed to Update Account" : "Failed to Create Account",
        description: saveError instanceof Error ? saveError.message : "Unable to save account.",
        details: "Check required fields, unique email, and role/barangay settings.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordUser || !newPassword.trim()) return;

    setIsSubmitting(true);
    try {
      await fetchJson(`/api/app-users/${passwordUser.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withAuditActor({ new_password: newPassword })),
      });
      setPasswordUser(null);
      setNewPassword("");
      await refreshUsers();
      setResultModal({
        open: true,
        type: "success",
        title: "Password Changed Successfully",
        description: "The account password has been updated and failed login attempts were reset.",
        details: "The new password was hashed before storage.",
      });
    } catch (passwordError) {
      setResultModal({
        open: true,
        type: "error",
        title: "Failed to Change Password",
        description: passwordError instanceof Error ? passwordError.message : "Unable to change password.",
        details: "Please enter a new password and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateStatus(user: AccountUserRow, status: AccountStatus) {
    setIsSubmitting(true);
    try {
      await fetchJson(`/api/app-users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withAuditActor({ status })),
      });
      await refreshUsers();
      setPreviewUser((current) => current?.id === user.id ? { ...current, status } : current);
      setResultModal({
        open: true,
        type: status === "active" ? "success" : "warning",
        title: status === "active" ? "Account Enabled" : "Account Status Updated",
        description: `${user.full_name || user.email} is now ${statusLabel(status).toLowerCase()}.`,
        details: "The account status was updated in app_users.",
      });
    } catch (statusError) {
      setResultModal({
        open: true,
        type: "error",
        title: "Failed to Update Status",
        description: statusError instanceof Error ? statusError.message : "Unable to update account status.",
        details: "Please try the status action again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span />
          <input
            type="search"
            placeholder="Search by name, email, mobile, role, or status..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select aria-label="Department" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
          <option value="">All Departments</option>
          {departmentOptions.map((department) => <option key={department} value={department}>{formatBarangayName(department)}</option>)}
        </select>
        <select aria-label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">All Roles</option>
          {roleFilterOptions.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <select aria-label="Status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All Status</option>
          <option value="active">Enabled</option>
          <option value="inactive">Disabled</option>
          <option value="blocked">Blocked</option>
        </select>
        <button type="button" className={styles.exportButton} onClick={() => {
          setSearch("");
          setDepartmentFilter("");
          setRoleFilter("");
          setStatusFilter("");
          setPage(1);
        }}>Reset</button>
        <button type="button" className={styles.addButton} onClick={openAddForm}>+ Add New</button>
      </div>
      {error ? <ErrorState title="Unable to Load Accounts" message={error} retryLabel="Retry" onRetry={refreshUsers} /> : null}
      <DataTable className={styles.tableScroll} headers={["Name / Email", "Role", "Department / Barangay", "Status", "Actions"]} minWidth={880}>
        {paginatedUsers.rows.map((user, index) => (
          <tr key={user.id || `${user.email}-${index}`}>
            <td>
              <strong className={styles.userName}>{user.full_name || "Unnamed account"}</strong>
              <a className={styles.emailLink} href={`mailto:${user.email}`}>{user.email}</a>
            </td>
            <td>{user.role_label}</td>
            <td><Badge tone={departmentTone(user.department)}>{formatBarangayName(user.department)}</Badge></td>
            <td><Badge tone={statusTone(user.status)}>{statusLabel(user.status)}</Badge></td>
            <td>
              <div className={styles.rowActions}>
                <button className={styles.actionPill} type="button" onClick={() => setPreviewUser(user)}>
                  <span className={`${styles.actionIcon} ${styles.eyeIcon}`} aria-hidden="true" />
                  Preview
                </button>
              </div>
            </td>
          </tr>
        ))}
        {isLoading ? (
          <tr>
            <td colSpan={5}><LoadingState message="Loading account users..." /></td>
          </tr>
        ) : null}
        {!isLoading && displayedUsers.length === 0 ? (
          <tr>
            <td colSpan={5}>
              <EmptyState
                title={users.length === 0 ? "No accounts found" : "No accounts match your filters"}
                description={users.length === 0 ? "System accounts will appear here once they are created." : "Try another name, email, role, department, or status filter."}
                actionLabel={users.length === 0 ? "Add Account" : undefined}
                onAction={users.length === 0 ? openAddForm : undefined}
              />
            </td>
          </tr>
        ) : null}
      </DataTable>
      <SharedPagination pagination={paginatedUsers.pagination} onPageChange={setPage} label="Account users" />

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} labelledBy="account-form-title" className={styles.accountDialog}>
        <header className={styles.modalHeader}>
          <div>
            <h3 id="account-form-title">{formMode === "edit" ? "Edit Account" : "Add New Account"}</h3>
            <p>{formMode === "edit" ? "Update profile and RBAC settings" : "Create a login-ready dashboard account"}</p>
          </div>
          <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Close account form">x</button>
        </header>
        <form className={styles.accountForm} onSubmit={submitAccount}>
          {formError ? <p className={styles.formError}>{formError}</p> : null}
          <div className={styles.formGrid}>
            <label>First Name<input value={form.first_name} onChange={(event) => updateForm("first_name", event.target.value)} /></label>
            <label>Last Name<input value={form.last_name} onChange={(event) => updateForm("last_name", event.target.value)} /></label>
            <label>Email<input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} /></label>
            <label>Mobile Number<input
              value={form.mobile_number}
              onBlur={() => {
                const normalized = normalizePhilippineMobile(form.mobile_number);
                if (normalized) updateForm("mobile_number", normalized);
              }}
              onChange={(event) => updateForm("mobile_number", event.target.value)}
              placeholder="e.g., +639123456789"
            /></label>
            {formMode === "add" ? <label>Password<input type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} /></label> : null}
            {formMode === "add" ? <label>Confirm Password<input type="password" value={form.confirm_password} onChange={(event) => updateForm("confirm_password", event.target.value)} /></label> : null}
            <label>Role<select value={form.role_id} onChange={(event) => updateForm("role_id", event.target.value)}>
              <option value="">Select role</option>
              {roleOptions.map((role, index) => <option key={role} value={String(index + 1)}>{role}</option>)}
            </select></label>
            <label>Department / Barangay<select value={form.barangay_id} onChange={(event) => updateForm("barangay_id", event.target.value)}>
              <option value="">No barangay</option>
              {barangayOptions.map((barangay) => <option key={barangay.id} value={barangay.id}>{formatBarangayName(barangay.label)}</option>)}
            </select></label>
            <label>Sex<select value={form.sex} onChange={(event) => updateForm("sex", event.target.value)}>
              <option value="">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select></label>
            <label>Status<select value={form.status} onChange={(event) => updateForm("status", event.target.value as AccountStatus)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              {formMode === "edit" ? <option value="blocked">Blocked</option> : null}
            </select></label>
            <label className={styles.wideField}>Address<input value={form.address} onChange={(event) => updateForm("address", event.target.value)} /></label>
          </div>
          <footer className={styles.formActions}>
            <Button tone="muted" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : formMode === "edit" ? "Save Changes" : "Create Account"}</Button>
          </footer>
        </form>
      </Modal>

      <Modal isOpen={Boolean(previewUser)} onClose={() => setPreviewUser(null)} labelledBy="account-preview-title" className={styles.accountDialog}>
        {previewUser ? (
          <>
            <header className={styles.modalHeader}>
              <div>
                <h3 id="account-preview-title">{previewUser.full_name || previewUser.email}</h3>
                <p>Account details and RBAC assignment</p>
              </div>
              <button type="button" onClick={() => setPreviewUser(null)} aria-label="Close account preview">x</button>
            </header>
            <dl className={styles.detailGrid}>
              <Detail label="Full Name" value={previewUser.full_name || "Unnamed account"} />
              <Detail label="Email" value={previewUser.email} />
              <Detail label="Mobile" value={previewUser.mobile_number} />
              <Detail label="Role" value={previewUser.role_label} />
              <Detail label="Department / Barangay" value={previewUser.department} />
              <Detail label="Address" value={previewUser.address || "-"} />
              <Detail label="Sex" value={previewUser.sex || "-"} />
              <Detail label="Status" value={statusLabel(previewUser.status)} />
              <Detail label="Created At" value={formatDateTime(previewUser.created_at, "Not available")} />
              <Detail label="Updated At" value={formatDateTime(previewUser.updated_at, "Not available")} />
              <Detail label="Last Login" value={formatDateTime(previewUser.last_login_at)} />
              <Detail label="Failed Login Attempts" value={String(previewUser.failed_login_attempts)} />
              <Detail label="Locked Until" value={formatDateTime(previewUser.locked_until, "Not locked")} />
            </dl>
            <div className={styles.previewActions}>
              <Button size="sm" onClick={() => setPasswordUser(previewUser)}><span className={`${styles.buttonIcon} ${styles.keyIcon}`} aria-hidden="true" />Change Password</Button>
              {previewUser.status === "active" ? (
                <Button size="sm" tone="muted" onClick={() => updateStatus(previewUser, "inactive")} disabled={isSubmitting}><span className={`${styles.buttonIcon} ${styles.powerIcon}`} aria-hidden="true" />Disable Account</Button>
              ) : null}
              {previewUser.status === "inactive" ? (
                <Button size="sm" tone="success" onClick={() => updateStatus(previewUser, "active")} disabled={isSubmitting}><span className={`${styles.buttonIcon} ${styles.checkIcon}`} aria-hidden="true" />Enable Account</Button>
              ) : null}
              {previewUser.status !== "blocked" ? (
                <Button size="sm" tone="danger" onClick={() => updateStatus(previewUser, "blocked")} disabled={isSubmitting}><span className={`${styles.buttonIcon} ${styles.shieldIcon}`} aria-hidden="true" />Block Account</Button>
              ) : (
                <Button size="sm" tone="success" onClick={() => updateStatus(previewUser, "active")} disabled={isSubmitting}><span className={`${styles.buttonIcon} ${styles.checkIcon}`} aria-hidden="true" />Unblock Account</Button>
              )}
              <Button size="sm" tone="purple" onClick={() => openEditForm(previewUser)}><span className={`${styles.buttonIcon} ${styles.pencilButtonIcon}`} aria-hidden="true" />Edit Account</Button>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal isOpen={Boolean(passwordUser)} onClose={() => setPasswordUser(null)} labelledBy="password-title" className={styles.passwordDialog}>
        <header className={styles.modalHeader}>
          <div>
            <h3 id="password-title">Change Password</h3>
            <p>{passwordUser?.full_name || passwordUser?.email}</p>
          </div>
          <button type="button" onClick={() => setPasswordUser(null)} aria-label="Close password form">x</button>
        </header>
        <form className={styles.accountForm} onSubmit={changePassword}>
          <label>New Password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <footer className={styles.formActions}>
            <Button tone="muted" onClick={() => setPasswordUser(null)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !newPassword.trim()}>{isSubmitting ? "Saving..." : "Change Password"}</Button>
          </footer>
        </form>
      </Modal>

      <ActionResultModal
        open={resultModal.open}
        type={resultModal.type}
        title={resultModal.title}
        description={resultModal.description}
        details={resultModal.details}
        primaryLabel="OK"
        onPrimary={() => setResultModal((current) => ({ ...current, open: false }))}
        onClose={() => setResultModal((current) => ({ ...current, open: false }))}
      />
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{formatBarangayName(value)}</dd>
    </div>
  );
}

function validateAccountForm(form: AccountFormState, mode: AccountFormMode) {
  if (!isValidPersonName(form.first_name)) return "First name is required and can only contain letters, spaces, apostrophes, hyphens, and periods.";
  if (!isValidPersonName(form.last_name)) return "Last name is required and can only contain letters, spaces, apostrophes, hyphens, and periods.";
  if (!form.email.trim()) return "Email is required.";
  if (!normalizePhilippineMobile(form.mobile_number)) return "Mobile number must be a valid Philippine mobile number like +639123456789.";
  if (mode === "add" && form.status === "blocked") return "New accounts cannot be created as blocked.";
  if (mode === "add" && !form.password.trim()) return "Password is required.";
  if (mode === "add" && form.password !== form.confirm_password) return "Password and confirm password must match.";
  if (!form.role_id) return "Role is required.";
  if (Number(form.role_id) === 4 && !form.barangay_id) return "Barangay is required for Barangay Official accounts.";
  return "";
}

function isValidPersonName(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 60 && /^[A-Za-z .'-]+$/.test(trimmed);
}

function normalizePhilippineMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  if (/^9\d{9}$/.test(digits)) return `+63${digits}`;
  return "";
}

function departmentTone(department: string): "green" | "orange" | "purple" {
  if (department.startsWith("Barangay")) return "green";
  if (department === "City Welfare") return "orange";
  return "purple";
}

function statusTone(status: AccountStatus): "green" | "red" | "gray" {
  if (status === "active") return "green";
  if (status === "blocked") return "red";
  return "gray";
}

function statusLabel(status: AccountStatus) {
  if (status === "active") return "Enabled";
  if (status === "blocked") return "Blocked";
  return "Disabled";
}

function mapAccountUser(row: Record<string, unknown>): AccountUserRow {
  const firstName = String(row.first_name ?? "");
  const lastName = String(row.last_name ?? "");
  const roleId = row.role_id == null ? null : Number(row.role_id);
  const roleName = String(row.role_name ?? row.role_label ?? "");
  const roleLabel = formatRole(row.role_label ?? row.role_name ?? roleId);
  const status = normalizeStatus(row.status);

  return {
    id: String(row.id ?? row.user_id ?? ""),
    first_name: firstName,
    last_name: lastName,
    full_name: [firstName, lastName].filter(Boolean).join(" "),
    email: String(row.email ?? ""),
    mobile_number: String(row.mobile_number ?? ""),
    address: String(row.address ?? ""),
    sex: String(row.sex ?? ""),
    role_id: roleId,
    role_label: roleLabel,
    role_name: roleName,
    department: formatDepartment(row, roleLabel),
    barangay_id: row.barangay_id == null ? null : Number(row.barangay_id),
    barangay_name: String(row.barangay_name ?? row.barangay ?? ""),
    status,
    failed_login_attempts: Number(row.failed_login_attempts ?? 0),
    locked_until: String(row.locked_until ?? ""),
    last_login_at: String(row.last_login_at ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function formatDepartment(row: Record<string, unknown>, roleLabel: string) {
  const barangay = String(row.barangay_name ?? row.barangay ?? "").trim();
  const department = String(row.department ?? "").trim();
  if (roleLabel === "Super Admin" || roleLabel === "NDRRMO Officer") return "NDRRMO";
  if (roleLabel === "City Welfare") return "City Welfare";
  if (roleLabel === "Barangay Official") return barangay || department || "Unassigned";
  if (department) return department;
  if (barangay) return barangay;
  return "Unassigned";
}

function formatRole(value: unknown) {
  const role = String(value || "");
  if (/super/i.test(role) || role === "1" || role === "SUPER_ADMIN") return "Super Admin";
  if (/ndrrmo/i.test(role) || role === "2" || role === "NDRRMO_OFFICER") return "NDRRMO Officer";
  if (/welfare|cswdd/i.test(role) || role === "3" || role === "CITY_WELFARE") return "City Welfare";
  if (/barangay/i.test(role) || role === "4" || role === "BARANGAY_OFFICIAL") return "Barangay Official";
  return role || "Unassigned";
}

function normalizeStatus(value: unknown): AccountStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "active" || status === "enabled") return "active";
  if (status === "blocked") return "blocked";
  return "inactive";
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim() || "Unassigned"))).sort((a, b) => a.localeCompare(b));
}

function roleSortValue(role: string) {
  const order = ["Super Admin", "NDRRMO Officer", "City Welfare", "Barangay Official", "Unassigned"];
  const index = order.indexOf(role);
  return index === -1 ? order.length : index;
}

function formatDateTime(value: string, emptyLabel = "No login yet") {
  if (!value) return emptyLabel;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
