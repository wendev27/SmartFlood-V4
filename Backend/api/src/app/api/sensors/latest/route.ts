import { NextRequest, NextResponse } from "next/server";
import { getDashboardViewer } from "@/lib/dashboardViewer";
import { getDb } from "@/lib/mongodb";
import { isValidSensorDocument, normalizeBarangay, resolveSensorCoordinates } from "@/lib/sensorMapping";
import { filterSensorsForUserScope } from "@/lib/sensorScope";

export async function GET(req: NextRequest) {
  try {
    const viewer = await getDashboardViewer(req);
    if (!viewer) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const db = await getDb();
    const sensors = await db.collection("sensors").find({}).toArray();
    const readings = await db.collection("sensor_readings").aggregate([
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: "$sensorId",
        doc: { $first: "$$ROOT" }
      }}
    ]).toArray();

    const latestReadingMap = new Map(readings.map((reading) => [String(reading._id), reading.doc]));
    const data = filterSensorsForUserScope(sensors.filter(isValidSensorDocument).map(sensor => {
      const sensorId = String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id);
      const reading = latestReadingMap.get(sensorId) ?? latestReadingMap.get(String(sensor._id));
      const mappedBarangay = normalizeBarangay(sensor.barangayName ?? sensor.barangay);
      const coordinates = resolveSensorCoordinates(sensor);

      return {
        sensorId,
        name: sensor.name,
        barangay: mappedBarangay.barangay_name,
        barangayName: mappedBarangay.barangay_name,
        rawBarangay: sensor.barangay,
        rawBarangayName: sensor.barangayName,
        barangay_id: mappedBarangay.barangay_id,
        street: sensor.street || null,
        status: sensor.status,
        waterLevelM: reading?.waterLevelM ?? reading?.waterLevel ?? null,
        distanceCm: reading?.distanceCm ?? null,
        rainfallMm: reading?.rainfallMm ?? null,
        batteryPct: reading?.batteryPct ?? null,
        computedStatus: reading?.computedStatus ?? reading?.status ?? null,
        latestReadingAt: reading?.createdAt ?? null,
        location: coordinates ?? sensor.location ?? null,
        geo: sensor.geo ?? null,
        lastSeenAt: sensor.lastSeenAt,
        latestReading: reading || null
      };
    }), viewer);

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
