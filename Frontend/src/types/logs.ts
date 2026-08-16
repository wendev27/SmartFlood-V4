export interface AccountUser {
  name: string;
  department: "CDRRMO" | "Barangay" | "CSWDD";
  role: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

export interface AuditLog {
  log_id?: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  action: string;
  module?: string;
  description?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  barangay_id?: number | null;
  barangay_name?: string | null;
  created_at?: string;
  title?: string;
  timestamp?: string;
  user?: string;
  category?: string;
  department?: "CDRRMO" | "Barangay" | "CSWDD" | "Resident" | "System" | "Sensor" | "Authentication";
  status?: "Success" | "Failed";
  tone?: "blue" | "green" | "purple" | "orange" | "red" | "gray";
  ipAddress?: string;
}
