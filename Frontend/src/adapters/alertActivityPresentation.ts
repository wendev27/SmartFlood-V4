import { formatBarangayName } from "@/lib/formatters";
import { getFloodStatusClass, getFloodStatusLabel } from "@/lib/statusStyles";
import type { getSensors } from "@/services/sensorsService";

export interface AlertActivityView {
  key: string;
  title: string;
  meta: string;
  badge: string;
  tone: "critical" | "warning" | "alert";
}

/** Current readings from the existing scoped service, not a historical alert log. */
export function alertActivityPresentation(sensors: Awaited<ReturnType<typeof getSensors>>): AlertActivityView[] {
  return sensors.flatMap((sensor, index): AlertActivityView[] => {
    if (sensor.waterLevelM == null || sensor.waterLevelM === "") return [];
    const waterLevel = Number(sensor.waterLevelM);
    const level = getFloodStatusClass(sensor.computedStatus ?? sensor.risk, sensor.waterLevelM);
    if (!Number.isFinite(waterLevel) || !["flood_alert", "flood_warning", "severity"].includes(level)) return [];
    const badge = getFloodStatusLabel(level, waterLevel);
    const sensorId = String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? sensor.name ?? "Unknown sensor");
    const barangay = formatBarangayName(String(sensor.barangayName ?? sensor.barangay ?? "Unknown barangay"));
    const rawTimestamp = sensor.latestReadingAt ?? sensor.lastSeenAt ?? sensor.updatedAt;
    const date = typeof rawTimestamp === "string" ? new Date(rawTimestamp) : null;
    const timestamp = date && Number.isFinite(date.getTime()) ? ` · ${date.toLocaleString()}` : "";
    return [{
      key: `${sensorId}-${index}`,
      title: `${badge} level at ${barangay}`,
      meta: `${sensorId} recorded ${waterLevel.toFixed(2)}m${timestamp}`,
      badge,
      tone: level === "severity" ? "critical" : level === "flood_warning" ? "warning" : "alert",
    }];
  });
}
