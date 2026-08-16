export type BarangayMapping = {
  barangay_id: number | null;
  barangay_name: string;
};

export type SensorCoordinates = {
  lat: number;
  lng: number;
};

const barangayMappings: Record<string, BarangayMapping> = {
  "1": { barangay_id: 1, barangay_name: "Barangay Tañong" },
  "barangay 1": { barangay_id: 1, barangay_name: "Barangay Tañong" },
  "barangay tanong": { barangay_id: 1, barangay_name: "Barangay Tañong" },
  "barangay tañong": { barangay_id: 1, barangay_name: "Barangay Tañong" },
  tanong: { barangay_id: 1, barangay_name: "Barangay Tañong" },
  tañong: { barangay_id: 1, barangay_name: "Barangay Tañong" },
  "2": { barangay_id: 2, barangay_name: "Barangay Catmon" },
  "barangay 2": { barangay_id: 2, barangay_name: "Barangay Catmon" },
  "barangay catmon": { barangay_id: 2, barangay_name: "Barangay Catmon" },
  catmon: { barangay_id: 2, barangay_name: "Barangay Catmon" },
  "3": { barangay_id: 3, barangay_name: "Barangay Potrero" },
  "barangay 3": { barangay_id: 3, barangay_name: "Barangay Potrero" },
  "barangay potrero": { barangay_id: 3, barangay_name: "Barangay Potrero" },
  potrero: { barangay_id: 3, barangay_name: "Barangay Potrero" },
};

export function normalizeBarangay(value: unknown): BarangayMapping {
  const name = String(value ?? "").trim();
  const mapped = barangayMappings[name.toLowerCase()];

  return mapped ?? {
    barangay_id: null,
    barangay_name: name || "Unknown",
  };
}

export function barangayKey(value: unknown) {
  const mapped = normalizeBarangay(value);
  return mapped.barangay_id ? String(mapped.barangay_id) : mapped.barangay_name.toLowerCase();
}

export function resolveSensorCoordinates(sensor: Record<string, unknown>): SensorCoordinates | null {
  const location = sensor.location as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown } | undefined;
  const locationLat = toFiniteNumber(location?.lat ?? location?.latitude);
  const locationLng = toFiniteNumber(location?.lng ?? location?.longitude);

  if (locationLat != null && locationLng != null) {
    return { lat: locationLat, lng: locationLng };
  }

  const geo = sensor.geo as { coordinates?: unknown } | undefined;
  const coordinates = Array.isArray(geo?.coordinates) ? geo.coordinates : null;
  const geoLng = toFiniteNumber(coordinates?.[0]);
  const geoLat = toFiniteNumber(coordinates?.[1]);

  if (geoLat != null && geoLng != null) {
    return { lat: geoLat, lng: geoLng };
  }

  const rootLat = toFiniteNumber(sensor.lat ?? sensor.latitude);
  const rootLng = toFiniteNumber(sensor.lng ?? sensor.longitude);

  if (rootLat != null && rootLng != null) {
    return { lat: rootLat, lng: rootLng };
  }

  return null;
}

export function isValidSensorDocument(sensor: Record<string, unknown>) {
  const sensorId = String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? "").trim();
  const name = String(sensor.name ?? "").trim();
  const barangay = normalizeBarangay(sensor.barangayName ?? sensor.barangay);
  const hasKnownBarangay = Boolean(barangay.barangay_id) || barangay.barangay_name.toLowerCase() !== "unknown";

  return /^sns-/i.test(sensorId) || Boolean(resolveSensorCoordinates(sensor)) || Boolean(name && hasKnownBarangay);
}

function toFiniteNumber(value: unknown) {
  if (value == null || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
