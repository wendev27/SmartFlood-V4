"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPanel } from "@/components/dashboard/MapPanel/MapPanel";
import { Badge } from "@/components/ui/Badge/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { getFloodBadgeTone, getFloodStatusClass, getFloodStatusLabel, type FloodLevel } from "@/lib/statusStyles";
import { formatBarangayName, formatSensorUpdatedTime } from "@/lib/formatters";
import { StatCard } from "@/components/ui/StatCard/StatCard";
import { getSensors } from "@/services/sensorsService";
import type { DashboardStat } from "@/types/dashboard";
import styles from "./DashboardPanel.module.css";

export function DashboardPanel() {
  const pageSize = 5;
  const [sensorRows, setSensorRows] = useState<Record<string, unknown>[]>([]);
  const [showSevereOnly, setShowSevereOnly] = useState(false);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sensorPage, setSensorPage] = useState(1);

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const rows = await getSensors();
      setSensorRows(rows);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const rows = await getSensors();
        if (!cancelled) {
          setSensorRows(rows);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    const interval = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const severeSensors = useMemo(() => sensorRows.filter((row) => sensorFloodLevel(row) === "severity"), [sensorRows]);
  const visibleSensorRows = showSevereOnly ? severeSensors : sensorRows;
  const paginatedSensorRows = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(visibleSensorRows.length / pageSize));
    const safePage = Math.min(sensorPage, totalPages);
    return {
      rows: visibleSensorRows.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: visibleSensorRows.length, totalPages } satisfies PaginationState,
    };
  }, [sensorPage, visibleSensorRows]);

  useEffect(() => {
    setSensorPage(1);
  }, [showSevereOnly]);

  useEffect(() => {
    if (sensorPage !== paginatedSensorRows.pagination.page) setSensorPage(paginatedSensorRows.pagination.page);
  }, [paginatedSensorRows.pagination.page, sensorPage]);

  const simpleStats = useMemo<DashboardStat[]>(() => {
    return [
      {
        label: "Sensor Nodes",
        value: isLoading ? "..." : String(sensorRows.length),
        caption: isLoading ? "Loading sensor network" : "Live sensor nodes",
        tone: "blue",
        captionTone: "info",
      },
      {
        label: "Severe Alerts",
        value: isLoading ? "..." : String(severeSensors.length),
        caption: showSevereOnly ? "Showing severe sensors" : "View severe sensors",
        tone: "cyan",
        captionTone: severeSensors.length > 0 ? "danger" : "success",
      },
    ];
  }, [isLoading, sensorRows.length, severeSensors.length, showSevereOnly]);

  function openSensorManagement() {
    window.location.hash = "#sensors";
  }

  function selectDashboardSensor(sensorId: string) {
    setSelectedSensorId(sensorId);
    setShowSevereOnly(false);
  }

  useEffect(() => {
    if (!selectedSensorId) return;
    if (!sensorRows.some((sensor, index) => sensorKey(sensor, index) === selectedSensorId)) {
      setSelectedSensorId(null);
    }
  }, [selectedSensorId, sensorRows]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.statsGrid} aria-label="Dashboard statistics">
        {simpleStats.map((stat, index) => (
          <StatCard
            isActive={index === 1 && showSevereOnly}
            key={stat.label}
            onClick={index === 0 ? openSensorManagement : () => setShowSevereOnly((current) => !current)}
            stat={stat}
          />
        ))}
      </section>
      <section className={styles.mapSection}>
        <MapPanel
          sensors={showSevereOnly ? severeSensors : sensorRows}
          isLoading={isLoading}
          error={error}
          onRetry={() => loadDashboard()}
          selectedSensorId={selectedSensorId}
          onSensorSelect={setSelectedSensorId}
          focusZoom={18}
        />
      </section>
      <section className={styles.sensorSection} aria-label="Available sensors">
        <div className={styles.sensorHeader}>
          <div>
            <h3>Available Sensors</h3>
            <p>Live sensor nodes from the monitoring network</p>
          </div>
        </div>
        {error ? <ErrorState title="Unable to Load Sensor Nodes" message={error} retryLabel="Retry" onRetry={() => loadDashboard()} /> : null}
        {isLoading ? <LoadingState message="Loading sensor nodes..." /> : null}
        {!isLoading && !error && sensorRows.length === 0 ? (
          <EmptyState title="No sensor nodes available." description="Sensor cards will appear when live sensor data is available." />
        ) : null}
        {!isLoading && !error && sensorRows.length > 0 ? (
          <>
          <div className={styles.sensorScroller}>
            {paginatedSensorRows.rows.map((sensor, index) => {
              const key = sensorKey(sensor, index);
              const level = sensorLevel(sensor);
              const floodLevel = sensorFloodLevel(sensor);
              const status = sensorStatus(sensor);
              return (
                <button
                  className={`${styles.sensorCard} ${styles[`${floodLevel}Sensor`]} ${selectedSensorId === key ? styles.selectedSensor : ""}`}
                  key={key}
                  type="button"
                  aria-pressed={selectedSensorId === key}
                  onClick={() => selectDashboardSensor(key)}
                >
                  <div className={styles.sensorCardTop}>
                    <strong>{String(sensor.name || sensor.sensorId || sensor.sensor_id || "Unnamed sensor")}</strong>
                    <Badge tone={status === "Active" ? "green" : status === "Inactive" ? "yellow" : "red"}>{status}</Badge>
                  </div>
                  <span>{formatBarangayName(String(sensor.barangayName ?? sensor.barangay ?? "Unknown barangay"))}</span>
                  <div className={styles.sensorMeta}>
                    <span>Reading</span>
                    <b className={styles[`${floodLevel}Reading`]}>{formatWater(sensor.waterLevelM)}</b>
                  </div>
                  <div className={styles.sensorMeta}>
                    <span>Flood Level</span>
                    <Badge tone={getFloodBadgeTone(level)}>{level}</Badge>
                  </div>
                  <small>Updated: {formatSensorUpdatedTime(sensorUpdatedAt(sensor))}</small>
                </button>
              );
            })}
          </div>
          <SharedPagination pagination={paginatedSensorRows.pagination} onPageChange={setSensorPage} label="Dashboard sensors" />
          </>
        ) : null}
      </section>
    </div>
  );
}

function sensorKey(sensor: Record<string, unknown>, index: number) {
  return String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? `${sensor.name ?? "sensor"}-${index}`);
}

function sensorStatus(sensor: Record<string, unknown>) {
  const status = String(sensor.status ?? "offline").toLowerCase();
  if (status === "active") return "Active";
  if (status === "inactive" || status === "degraded") return "Inactive";
  return "Offline";
}

function sensorLevel(sensor: Record<string, unknown>) {
  return getFloodStatusLabel(sensor.computedStatus ?? sensor.risk, sensor.waterLevelM);
}

function sensorFloodLevel(sensor: Record<string, unknown>): FloodLevel {
  return getFloodStatusClass(sensor.computedStatus ?? sensor.risk, sensor.waterLevelM);
}

function formatWater(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)}m` : "No reading";
}

function sensorUpdatedAt(sensor: Record<string, unknown>) {
  return (sensor.latestReadingAt ?? sensor.lastSeenAt ?? sensor.updatedAt) as string | Date | null | undefined;
}
