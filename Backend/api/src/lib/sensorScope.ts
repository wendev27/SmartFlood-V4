import { isSameBarangayForUser, type BarangayScopedRecord } from "@/lib/barangayScope";

export type SensorScopeUser = BarangayScopedRecord & {
  role_id?: unknown;
  role?: unknown;
  role_name?: unknown;
  role_label?: unknown;
  roleLabel?: unknown;
};

export function isBarangayOfficial(user: SensorScopeUser | null | undefined) {
  return Number(user?.role_id) === 4 || roleText(user).includes("barangay");
}

export function isSuperOrCdrrmo(user: SensorScopeUser | null | undefined) {
  const roleId = Number(user?.role_id);
  const role = roleText(user);
  return roleId === 1
    || roleId === 2
    || role.includes("super")
    || role.includes("cdrrmo")
    || role.includes("ndrrmo");
}

export function filterSensorsForUserScope<T extends BarangayScopedRecord>(sensors: readonly T[], user: SensorScopeUser | null | undefined) {
  if (isSuperOrCdrrmo(user)) return [...sensors];

  if (isBarangayOfficial(user)) {
    return sensors.filter((sensor) => isSameBarangayForUser(user, sensor));
  }

  return [...sensors];
}

function roleText(user: SensorScopeUser | null | undefined) {
  return [
    user?.role,
    user?.role_name,
    user?.role_label,
    user?.roleLabel,
  ].map((value) => String(value ?? "")).join(" ").toLowerCase();
}
