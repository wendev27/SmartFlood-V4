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

export function DashboardPanel({ onOpenWeather }: { onOpenWeather: () => void }) {
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
      <div className={styles.weatherRow}>
      <button type="button" className={styles.weatherOverview} onClick={onOpenWeather} aria-label="Open full weather forecast">
        <div className={styles.weatherCurrent}>
          <img src="/images/weather/rain.png" alt="Rainy weather" />
          <div><span>Thursday, September 25</span><strong>31°C</strong><p>Rainy</p></div>
        </div>
        <div className={styles.weatherDetails}>
          {[["Feels like","34°C"],["Humidity","78%"],["Rain Chance","65%"],["UV Index","3 Low"],["Wind","11 km/h"],["Pressure","1009 hPa"]].map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </div>
      </button>
      <button type="button" className={styles.hourlyPreview} onClick={onOpenWeather} aria-label="Open hourly weather forecast">
        <h2>Hourly Forecast</h2>
        <div>{[["Now","31°C","rain.png"],["1 PM","32°C","cloud-small.png"],["2 PM","33°C","cloud-small.png"],["3 PM","33°C","cloud.png"],["4 PM","32°C","showers.png"],["5 PM","31°C","showers.png"],["6 PM","30°C","rain.png"],["7 PM","29°C","rain.png"]].map(([time,temp,image]) => <article key={time}><span>{time}</span><img src={`/images/weather/${image}`} alt=""/><strong>{temp}</strong></article>)}</div>
      </button>
      </div>
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
