export type FloodLevel = "normal" | "flood_alert" | "flood_warning" | "severity" | "no_reading";
export type BadgeTone = "blue" | "green" | "red" | "yellow" | "purple" | "orange" | "gray";

export function normalizeFloodLevel(status?: unknown): FloodLevel {
  const normalized = String(status ?? "").trim().toLowerCase().replace(/_/g, " ");
  if (normalized.includes("severity") || normalized.includes("severe") || normalized.includes("critical")) return "severity";
  if (normalized.includes("warning")) return "flood_warning";
  if (normalized.includes("alert")) return "flood_alert";
  if (normalized.includes("normal")) return "normal";
  if (normalized.includes("no reading") || normalized.includes("unknown")) return "no_reading";
  return "no_reading";
}

export function classifyWaterLevel(waterLevel?: unknown): FloodLevel {
  if (waterLevel == null || waterLevel === "" || String(waterLevel).trim().toLowerCase() === "no reading") return "no_reading";

  const level = Number.parseFloat(String(waterLevel).replace(/m$/i, ""));
  if (!Number.isFinite(level)) return "no_reading";
  if (level >= 1.2) return "severity";
  if (level >= 0.75) return "flood_warning";
  if (level >= 0.25) return "flood_alert";
  return "normal";
}

export function normalizeFloodStatus(status?: unknown, waterLevel?: unknown): FloodLevel {
  const readingLevel = classifyWaterLevel(waterLevel);
  return readingLevel === "no_reading" ? normalizeFloodLevel(status) : readingLevel;
}

export function getFloodStatusLabel(status?: unknown, waterLevel?: unknown) {
  const normalized = normalizeFloodStatus(status, waterLevel);
  if (normalized === "severity") return "Severe";
  if (normalized === "flood_warning") return "Flood Warning";
  if (normalized === "flood_alert") return "Flood Alert";
  if (normalized === "normal") return "Normal";
  return "No reading";
}

export function getFloodStatusClass(status?: unknown, waterLevel?: unknown) {
  return normalizeFloodStatus(status, waterLevel);
}

export function getFloodStatusColor(status?: unknown, waterLevel?: unknown) {
  const normalized = normalizeFloodStatus(status, waterLevel);
  if (normalized === "normal") return "#17a34a";
  if (normalized === "flood_alert") return "#f7bd00";
  if (normalized === "flood_warning") return "#ff7417";
  if (normalized === "severity") return "#ff3347";
  return "#94a3b8";
}

export function getFloodBadgeTone(status?: unknown, waterLevel?: unknown): BadgeTone {
  const normalized = normalizeFloodStatus(status, waterLevel);
  if (normalized === "normal") return "green";
  if (normalized === "flood_alert") return "yellow";
  if (normalized === "flood_warning") return "orange";
  if (normalized === "severity") return "red";
  return "gray";
}
