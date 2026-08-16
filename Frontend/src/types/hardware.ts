export interface HardwareStatus {
  esp32Status: string;
  status: string;
  lastUpdate: string;
  waterLevel: string;
  waterLevelPercent: number;
  updateInterval: string;
  updateIntervalPercent: number;
  logs: Array<{
    time: string;
    message: string;
    tone: "blue" | "green";
  }>;
}
