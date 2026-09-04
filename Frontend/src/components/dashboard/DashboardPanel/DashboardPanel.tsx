"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { MapPanel } from "@/components/dashboard/MapPanel/MapPanel";
import { StatCard } from "@/components/ui/StatCard/StatCard";
import { getFloodStatusClass } from "@/lib/statusStyles";
import { queryKeys, queryStaleTime } from "@/lib/queryKeys";
import { getSensors } from "@/services/sensorsService";
import type { DashboardStat } from "@/types/dashboard";
import styles from "./DashboardPanel.module.css";

export function DashboardPanel() {
  const sensorsQuery = useQuery({ queryKey: queryKeys.sensors.latest, queryFn: getSensors, staleTime: queryStaleTime.realTime, refetchInterval: 5_000, refetchIntervalInBackground: false });
  const sensors = sensorsQuery.data ?? [];
  const criticalAlerts = useMemo(() => sensors.filter((sensor) => getFloodStatusClass(sensor.computedStatus ?? sensor.risk, sensor.waterLevelM) === "severity"), [sensors]);
  const error = sensorsQuery.error instanceof Error ? sensorsQuery.error.message : sensorsQuery.error ? "Unable to load dashboard data." : "";
  const stats = useMemo<DashboardStat[]>(() => [
    { label: "Sensor Nodes", value: sensorsQuery.isPending ? "..." : String(sensors.length), caption: "Total active telemetry points", tone: "blue", captionTone: "info" },
    { label: "Critical Alerts", value: sensorsQuery.isPending ? "..." : String(criticalAlerts.length), caption: "Total active telemetry points", tone: "cyan", captionTone: "danger" },
  ], [criticalAlerts.length, sensors.length, sensorsQuery.isPending]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.statsGrid} aria-label="Dashboard statistics">
        {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </section>
      {error ? <ErrorState title="Unable to Load Sensor Nodes" message={error} retryLabel="Retry" onRetry={() => sensorsQuery.refetch()} /> : null}
      <section className={styles.mapSection} aria-label="Barangay flood monitoring map">
        <MapPanel
          variant="embedded"
          sensors={sensors}
          isLoading={sensorsQuery.isPending}
          showWithoutSensors
        />
      </section>
    </div>
  );
}
