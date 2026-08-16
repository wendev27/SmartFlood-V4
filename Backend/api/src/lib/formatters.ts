export function toHash(value: string) {
  return `#${value}`;
}

export function formatSensorUpdatedTime(value?: string | Date | null) {
  if (!value) return "No update time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No update time";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatBarangayName(value?: string | null) {
  if (!value) return "";
  return value.replace(/\bTanong\b/gi, "Tañong");
}

export function normalizeBarangayForCompare(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("ñ", "n")
    .trim();
}
