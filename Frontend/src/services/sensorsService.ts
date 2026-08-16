import { getCurrentUser } from "@/lib/authSession";
import { filterSensorsForUserScope } from "@/lib/sensorScope";
import { fetchJson } from "@/services/apiClient";

export async function getSensors() {
  const sensors = await fetchJson<Record<string, unknown>[]>("/api/sensors/latest");
  return filterSensorsForUserScope(sensors, getCurrentUser());
}
