import type { SensorReading } from "@/types/sensors";

export const sensorsMock: SensorReading[] = [
  { id: "SNS-001", barangay: "Barangay Tanyong", coordinates: "00.0000,000.0000", status: "Active", latestReading: "3.8m", level: "Normal" },
  { id: "SNS-002", barangay: "Barangay Tanyong", coordinates: "3.8m", status: "Degraded", latestReading: "1.2m", level: "Flood Warning" },
  { id: "SNS-003", barangay: "Barangay Tanyong", coordinates: "1.2m", status: "Active", latestReading: "4.5m", level: "Normal" },
  { id: "SNS-004", barangay: "Barangay Tanyong", coordinates: "4.5m", status: "Offline", latestReading: "2.1m", level: "Severe" },
  { id: "SNS-005", barangay: "Barangay Tanyong", coordinates: "2.1m", status: "Active", latestReading: "1.1m", level: "Normal" },
];
