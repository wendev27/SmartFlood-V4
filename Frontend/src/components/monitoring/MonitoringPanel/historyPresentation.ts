import type { FloodHistoryRow } from "@/services/floodService";
import { formatBarangayName } from "@/lib/formatters";

export interface HistoryNarrativePresentation {
  summary: string;
  waterLevelAnalysis: string;
  highestEvent: string;
  lowestEvent: string;
  observationPeriod: string;
}

/** Describe recorded measurements without inferring flood duration or resident impact. */
export function historyNarrativePresentation(readings: readonly FloodHistoryRow[]): HistoryNarrativePresentation {
  const measured = readings.filter((reading) => reading.waterLevelM != null && Number.isFinite(reading.waterLevelM));
  const highest = measured.reduce<FloodHistoryRow | null>((result, reading) =>
    !result || reading.waterLevelM! > result.waterLevelM! ? reading : result, null);
  const lowest = measured.reduce<FloodHistoryRow | null>((result, reading) =>
    !result || reading.waterLevelM! < result.waterLevelM! ? reading : result, null);
  const timestamps = readings.flatMap((reading) => {
    if (!reading.createdAt) return [];
    const timestamp = new Date(reading.createdAt).getTime();
    return Number.isFinite(timestamp) ? [timestamp] : [];
  });
  const sensorCount = new Set(readings.map((reading) => reading.sensorId).filter(Boolean)).size;

  return {
    summary: readings.length
      ? `The selected records contain ${readings.length} readings from ${sensorCount} sensor nodes. ${measured.length} records include a measured water level.`
      : "No sensor records match the selected filters. Adjust the filters to review recorded readings.",
    waterLevelAnalysis: highest && lowest
      ? `Recorded water levels range from ${lowest.waterLevelM!.toFixed(2)}m to ${highest.waterLevelM!.toFixed(2)}m in the selected records.`
      : "Water-level analysis is unavailable because the selected records contain no measured water levels.",
    highestEvent: describeReading(highest),
    lowestEvent: describeReading(lowest),
    observationPeriod: timestamps.length
      ? `Available timestamps span ${new Date(Math.min(...timestamps)).toLocaleString()} to ${new Date(Math.max(...timestamps)).toLocaleString()}. These sensor records do not establish flood duration or resident impact.`
      : "No valid observation timestamps are available. Flood duration and resident impact are not recorded in these sensor readings.",
  };
}

function describeReading(reading: FloodHistoryRow | null): string {
  if (!reading || reading.waterLevelM == null) return "No measured water level available.";
  const location = [reading.sensorName || reading.sensorId, formatBarangayName(reading.barangayName)].filter(Boolean).join(" · ");
  const timestamp = reading.createdAt ? new Date(reading.createdAt) : null;
  const recordedAt = timestamp && Number.isFinite(timestamp.getTime()) ? ` · ${timestamp.toLocaleString()}` : "";
  return `${reading.waterLevelM.toFixed(2)}m${location ? ` · ${location}` : ""}${recordedAt}`;
}
