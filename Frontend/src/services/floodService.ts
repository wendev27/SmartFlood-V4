import { fetchJson } from "@/services/apiClient";
import { getCurrentUser } from "@/lib/authSession";
import { filterSensorsForUserScope } from "@/lib/sensorScope";
import { getSensors } from "@/services/sensorsService";

export type FloodHistoryRow = {
  readingId: string;
  sensorId: string;
  sensorName: string;
  barangay: string;
  barangayName: string;
  street: string;
  lat: number | null;
  lng: number | null;
  waterLevelM: number | null;
  waterLevel: number | null;
  distanceCm: number | null;
  rainfallMm: number | null;
  batteryPct: number | null;
  computedStatus: string;
  status: string;
  deviceStatus?: string;
  createdAt: string | null;
};

export async function getSensorHistory(limit = 100) {
  const history = await fetchJson<FloodHistoryRow[]>(`/api/sensors/history?limit=${limit}`);
  return filterSensorsForUserScope(history, getCurrentUser());
}

export async function getLatestSensors() {
  return getSensors();
}

export async function getFloodMonitoringData() {
  const [latestSensors, history] = await Promise.all([getLatestSensors(), getSensorHistory()]);
  return { latestSensors, history };
}
