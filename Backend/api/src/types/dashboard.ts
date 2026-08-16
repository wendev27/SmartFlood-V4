export interface DashboardStat {
  label: string;
  value: string;
  caption: string;
  tone: "teal" | "blue" | "cyan" | "sky";
  captionTone?: "success" | "danger" | "info";
}

export interface SystemPulseItem {
  label: string;
  value: string;
  tone?: "ready";
}
