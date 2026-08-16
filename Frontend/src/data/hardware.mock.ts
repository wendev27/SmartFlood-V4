import type { HardwareStatus } from "@/types/hardware";

export const hardwareStatusMock: HardwareStatus = {
  esp32Status: "Disconnected",
  status: "Unknown",
  lastUpdate: "Waiting for boot",
  waterLevel: "2.5m",
  waterLevelPercent: 25,
  updateInterval: "30s",
  updateIntervalPercent: 50,
  logs: [
    { time: "14:30:45", message: "Sensor reading: 2.5m", tone: "blue" },
    { time: "14:30:30", message: "Connection established", tone: "green" },
    { time: "14:30:15", message: "ESP32 initialized", tone: "blue" },
  ],
};
