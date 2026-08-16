import { NextRequest, NextResponse } from "next/server";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { getDb } from "@/lib/mongodb";
import { isValidSensorDocument, normalizeBarangay, resolveSensorCoordinates } from "@/lib/sensorMapping";
import { filterSensorsForUserScope } from "@/lib/sensorScope";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export async function GET(req: NextRequest) {
  try {
    const viewer = await getDashboardViewer(req);
    if (!viewer) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const sensorId = searchParams.get("sensorId")?.trim();
    const barangayParam = searchParams.get("barangay")?.trim();
    const barangay = barangayParam ? normalizeBarangay(barangayParam).barangay_name.toLowerCase() : "";
    const db = await getDb();
    const sensors = await db.collection("sensors").find({}).toArray();
    const validSensors = filterSensorsForUserScope(sensors.filter(isValidSensorDocument).map((sensor) => {
      const mappedBarangay = normalizeBarangay(sensor.barangayName ?? sensor.barangay);
      return {
        ...sensor,
        barangay_id: mappedBarangay.barangay_id,
        barangay_name: mappedBarangay.barangay_name,
      } as Record<string, unknown>;
    }), viewer);
    const sensorMap = new Map<string, (typeof validSensors)[number]>();

    validSensors.forEach((sensor) => {
      sensorAliases(sensor).forEach((alias) => sensorMap.set(alias, sensor));
    });

    const readings = await db.collection("sensor_readings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const normalizedReadings = readings.flatMap((reading) => {
      const readingSensorId = readingSensorKey(reading);
      const sensor = sensorMap.get(readingSensorId);
      if (!sensor) return [];
      const normalizedSensorId = sensorKey(sensor) || readingSensorId;
      if (sensorId && normalizedSensorId !== sensorId && readingSensorId !== sensorId) return [];

      const mappedBarangay = normalizeBarangay(
        reading.barangayName
        ?? reading.barangay
        ?? sensor.barangayName
        ?? sensor.barangay,
      );
      if (barangay && mappedBarangay.barangay_name.toLowerCase() !== barangay) return [];

      const coordinates = resolveSensorCoordinates(sensor);
      const waterLevelM = finiteNumber(reading.waterLevelM ?? reading.waterLevel);

      return [{
        readingId: String(reading._id),
        sensorId: normalizedSensorId,
        sensorName: String(reading.sensorName ?? reading.name ?? sensor.name ?? normalizedSensorId),
        barangay: mappedBarangay.barangay_name,
        barangayName: mappedBarangay.barangay_name,
        street: String(reading.street ?? sensor.street ?? ""),
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null,
        waterLevelM,
        waterLevel: waterLevelM,
        distanceCm: finiteNumber(reading.distanceCm),
        rainfallMm: finiteNumber(reading.rainfallMm),
        batteryPct: finiteNumber(reading.batteryPct),
        computedStatus: String(reading.computedStatus ?? reading.status ?? "no_reading"),
        status: String(reading.status ?? reading.computedStatus ?? "no_reading"),
        createdAt: reading.createdAt ?? null,
      }];
    });
    const data = sensorId
      ? normalizedReadings.slice(0, limit)
      : limitReadingsPerSensor(normalizedReadings, limit);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function limitReadingsPerSensor<T extends { sensorId: string }>(readings: T[], limit: number) {
  const counts = new Map<string, number>();

  return readings.filter((reading) => {
    const count = counts.get(reading.sensorId) ?? 0;
    if (count >= limit) return false;

    counts.set(reading.sensorId, count + 1);
    return true;
  });
}

function readingSensorKey(reading: Record<string, any>) {
  const nestedSensor = isRecord(reading.sensor) ? reading.sensor : {};
  return firstText(
    reading.sensorId,
    reading.sensor_id,
    reading.sensor_id_string,
    nestedSensor._id,
    reading._id,
  );
}

function sensorKey(sensor: Record<string, unknown>) {
  return firstText(sensor.sensorId, sensor.sensor_id, sensor.sensor_id_string, sensor._id);
}

function sensorAliases(sensor: Record<string, unknown>) {
  return [
    sensor._id,
    sensor.sensorId,
    sensor.sensor_id,
    sensor.sensor_id_string,
  ].map((value) => String(value ?? "").trim()).filter(Boolean);
}

function firstText(...values: unknown[]) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown) {
  if (value == null || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
