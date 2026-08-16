import type { DashboardStat, SystemPulseItem } from "@/types/dashboard";

export const dashboardStatsMock: DashboardStat[] = [
  { label: "Network Nodes", value: "5", caption: "Total active telemetry points", tone: "teal" },
  { label: "Health Status", value: "0/5", caption: "1 nodes requiring checkup", tone: "blue", captionTone: "danger" },
  { label: "Pending Relief", value: "4", caption: "Request awaiting city approval", tone: "cyan", captionTone: "info" },
  { label: "Severe Alerts", value: "2", caption: "Immediate response recommended", tone: "sky" },
];

export const systemPulseMock: SystemPulseItem[] = [
  { label: "Database Connectivity", value: "Stable" },
  { label: "Sensor Network Mesh", value: "Encrypted" },
  { label: "Relief Logic Engine", value: "READY", tone: "ready" },
];
