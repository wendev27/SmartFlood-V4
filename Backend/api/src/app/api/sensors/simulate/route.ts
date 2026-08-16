import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const SIMULATED_SENSOR_IDS = new Set(["SNS-002", "SNS-003"]);
const SIMULATION_MODES = ["no_reading", "normal", "flood_alert", "flood_warning", "severe"] as const;

type SimulationMode = (typeof SIMULATION_MODES)[number];

type SensorSimulation = {
  sensorId: string;
  mode: SimulationMode;
  active: boolean;
};

type ReadingPreset = {
  minWaterLevelM: number;
  maxWaterLevelM: number;
  status: Exclude<SimulationMode, "no_reading">;
};

const READING_PRESETS: Record<Exclude<SimulationMode, "no_reading">, ReadingPreset> = {
  normal: { minWaterLevelM: 0, maxWaterLevelM: 0.24, status: "normal" },
  flood_alert: { minWaterLevelM: 0.25, maxWaterLevelM: 0.5, status: "flood_alert" },
  flood_warning: { minWaterLevelM: 0.75, maxWaterLevelM: 1, status: "flood_warning" },
  severe: { minWaterLevelM: 1.2, maxWaterLevelM: 1.5, status: "severe" },
};

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const simulations = parseSimulations(body);
    const db = await getDb();
    const sensors = db.collection<{ _id: string }>("sensors");
    const readings = db.collection("sensor_readings");

    for (const simulation of simulations) {
      const sensor = await sensors.findOne({ _id: simulation.sensorId });

      if (!sensor) {
        return NextResponse.json(
          { success: false, error: `Sensor ${simulation.sensorId} was not found.` },
          { status: 404 },
        );
      }
    }

    const data = [];

    for (const simulation of simulations) {
      const now = new Date();
      if (!simulation.active) {
        await sensors.updateOne(
          { _id: simulation.sensorId },
          { $set: { status: "inactive", updatedAt: now } },
        );
        data.push({
          sensorId: simulation.sensorId,
          active: false,
          mode: simulation.mode,
          status: "inactive",
          waterLevelM: null,
        });
        continue;
      }

      await sensors.updateOne(
        { _id: simulation.sensorId },
        { $set: { status: "active", lastSeenAt: now, updatedAt: now } },
      );

      if (simulation.mode === "no_reading") {
        await readings.deleteMany({ sensorId: simulation.sensorId });
        data.push({
          sensorId: simulation.sensorId,
          active: true,
          mode: simulation.mode,
          status: "no_reading",
          waterLevelM: null,
        });
        continue;
      }

      const preset = READING_PRESETS[simulation.mode];
      const waterLevelM = randomWaterLevel(preset);
      const distanceCm = Math.max(30, Math.round((220 - waterLevelM * 100) * 100) / 100);
      await readings.insertOne({
        sensorId: simulation.sensorId,
        waterLevelM,
        waterLevel: waterLevelM,
        distanceCm,
        rainfallMm: null,
        batteryPct: null,
        computedStatus: preset.status,
        status: preset.status,
        source: "manual-simulator",
        createdAt: now,
        updatedAt: now,
        __v: 0,
      });
      data.push({
        sensorId: simulation.sensorId,
        active: true,
        mode: simulation.mode,
        status: preset.status,
        waterLevelM,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sensor simulation applied.",
      data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to apply sensor simulation.";
    const status = error instanceof SimulationRequestError ? 400 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

function randomWaterLevel(preset: ReadingPreset) {
  const value = preset.minWaterLevelM + Math.random() * (preset.maxWaterLevelM - preset.minWaterLevelM);
  return Math.round(value * 100) / 100;
}

function parseSimulations(body: unknown): SensorSimulation[] {
  if (!isRecord(body) || !Array.isArray(body.sensors) || body.sensors.length === 0) {
    throw new SimulationRequestError("Request body must include a non-empty sensors array.");
  }

  const seenSensorIds = new Set<string>();

  return body.sensors.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new SimulationRequestError(`Sensor entry at index ${index} must be an object.`);
    }

    const sensorId = typeof entry.sensorId === "string" ? entry.sensorId.trim().toUpperCase() : "";
    if (!SIMULATED_SENSOR_IDS.has(sensorId)) {
      throw new SimulationRequestError(`Sensor ${sensorId || `at index ${index}`} is not supported by this simulator.`);
    }

    if (seenSensorIds.has(sensorId)) {
      throw new SimulationRequestError(`Sensor ${sensorId} was included more than once.`);
    }
    seenSensorIds.add(sensorId);

    if (typeof entry.mode !== "string" || !isSimulationMode(entry.mode)) {
      throw new SimulationRequestError(`Sensor ${sensorId} has an invalid mode.`);
    }

    if (typeof entry.active !== "boolean") {
      throw new SimulationRequestError(`Sensor ${sensorId} must include an active boolean.`);
    }

    return { sensorId, mode: entry.mode, active: entry.active };
  });
}

function isSimulationMode(value: string): value is SimulationMode {
  return SIMULATION_MODES.some((mode) => mode === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

class SimulationRequestError extends Error {}
