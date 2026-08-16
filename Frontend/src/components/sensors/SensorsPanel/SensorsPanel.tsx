"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPanel } from "@/components/dashboard/MapPanel/MapPanel";
import { Badge } from "@/components/ui/Badge/Badge";
import { DataTable } from "@/components/ui/DataTable/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { formatBarangayName, normalizeBarangayForCompare } from "@/lib/formatters";
import { resolveSensorCoordinates } from "@/lib/sensorMapping";
import { getFloodBadgeTone, getFloodStatusClass, getFloodStatusLabel, type FloodLevel } from "@/lib/statusStyles";
import { getSensors } from "@/services/sensorsService";
import styles from "./SensorsPanel.module.css";

type SensorRow = {
  sensor_key: string;
  sensor_id: string;
  barangay: string;
  coordinates: string;
  status: "Active" | "Inactive" | "Offline";
  latestReading: string;
  level: string;
  floodLevel: FloodLevel;
  hasCoordinates: boolean;
};

export function SensorsPanel() {
  const pageSize = 5;
  const mapRegionRef = useRef<HTMLDivElement | null>(null);
  const [sensorRows, setSensorRows] = useState<Record<string, unknown>[]>([]);
  const [sensors, setSensors] = useState<SensorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectionMessage, setSelectionMessage] = useState("");
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [barangayFilter, setBarangayFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [page, setPage] = useState(1);

  const loadSensors = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await getSensors();
      setSensorRows(data);
      setSensors(data.map(mapSensor));
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load sensors.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getSensors();
        if (!cancelled) {
          setSensorRows(data);
          setSensors(data.map(mapSensor));
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load sensors.");
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

  useEffect(() => {
    const explicitSensorId = readExplicitSensorFocus();
    if (!explicitSensorId) return;

    setSelectedSensorId(explicitSensorId);
  }, []);

  const barangays = useMemo(() => Array.from(new Set(sensors.map((sensor) => sensor.barangay))).sort(), [sensors]);
  const displayedSensors = useMemo(() => sensors.filter((sensor) => {
    const normalizedSearch = search.trim().toLowerCase();
    return (!normalizedSearch || sensor.sensor_id.toLowerCase().includes(normalizedSearch))
      && (!barangayFilter || normalizeBarangayForCompare(sensor.barangay) === normalizeBarangayForCompare(barangayFilter))
      && (!statusFilter || sensor.status === statusFilter)
      && (!levelFilter || sensor.level === levelFilter);
  }), [barangayFilter, levelFilter, search, sensors, statusFilter]);
  const paginatedSensors = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(displayedSensors.length / pageSize));
    const safePage = Math.min(page, totalPages);
    return {
      rows: displayedSensors.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: displayedSensors.length, totalPages } satisfies PaginationState,
    };
  }, [displayedSensors, page]);

  useEffect(() => {
    setPage(1);
  }, [barangayFilter, levelFilter, search, statusFilter]);

  useEffect(() => {
    if (page !== paginatedSensors.pagination.page) setPage(paginatedSensors.pagination.page);
  }, [page, paginatedSensors.pagination.page]);

  useEffect(() => {
    if (!selectedSensorId) return;
    if (isLoading || sensors.length === 0) return;
    if (!displayedSensors.some((sensor) => sensor.sensor_key === selectedSensorId)) {
      setSelectedSensorId(null);
    }
  }, [displayedSensors, isLoading, selectedSensorId, sensors.length]);

  function resetFilters() {
    setSearch("");
    setBarangayFilter("");
    setStatusFilter("");
    setLevelFilter("");
    setPage(1);
  }

  function selectSensor(sensor: SensorRow) {
    setSelectionMessage("");

    if (!sensor.hasCoordinates) {
      setSelectedSensorId(null);
      setSelectionMessage("This sensor has no valid coordinates yet, so it cannot be focused on the map.");
      return;
    }

    setSelectedSensorId(sensor.sensor_key);
    window.requestAnimationFrame(() => {
      mapRegionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section className={styles.panel} aria-label="Sensor history">
      <div ref={mapRegionRef}>
        <MapPanel
          variant="wide"
          sensors={sensorRows}
          isLoading={isLoading}
          error={error}
          onRetry={() => loadSensors()}
          selectedSensorId={selectedSensorId}
          onSensorSelect={setSelectedSensorId}
          focusZoom={18}
        />
      </div>
      <article className={styles.tableCard}>
        <h3>View Tabulated Sensor History</h3>
        <div className={styles.toolbar}>
          <input type="search" placeholder="Search Sensor ID" aria-label="Search Sensor ID" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Barangay" value={barangayFilter} onChange={(event) => setBarangayFilter(event.target.value)}>
            <option value="">All Barangays</option>
            {barangays.map((barangay) => <option key={barangay} value={barangay}>{formatBarangayName(barangay)}</option>)}
          </select>
          <select aria-label="Sensor status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Any Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Offline">Offline</option>
          </select>
          <select aria-label="Alert level" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
            <option value="">Any Level</option>
            <option value="Normal">Normal</option>
            <option value="Flood Alert">Flood Alert</option>
            <option value="Flood Warning">Flood Warning</option>
            <option value="Severe">Severe</option>
          </select>
          <button type="button" aria-label="Reset sensor filters" onClick={resetFilters}>X</button>
        </div>
        {error ? <ErrorState title="Unable to Load Sensors" message={error} retryLabel="Retry" onRetry={() => loadSensors()} /> : null}
        {selectionMessage ? <p className={styles.selectionMessage}>{selectionMessage}</p> : null}
        <div className={styles.tableScroll}>
          <DataTable headers={["Sensor ID", "Barangay", "Coordinates", "Status", "Latest Reading", "Level"]}>
            {paginatedSensors.rows.map((sensor, index) => (
              <tr
                aria-selected={selectedSensorId === sensor.sensor_key}
                className={`${styles.clickableRow} ${selectedSensorId === sensor.sensor_key ? `${styles.selectedRow} ${styles[sensor.floodLevel]}` : ""}`}
                key={sensor.sensor_key || `${sensor.barangay}-${index}`}
                onClick={() => selectSensor(sensor)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectSensor(sensor);
                  }
                }}
                tabIndex={0}
              >
                <td>{sensor.sensor_id}</td>
                <td>{formatBarangayName(sensor.barangay)}</td>
                <td>{sensor.coordinates}</td>
                <td><Badge tone={sensor.status === "Active" ? "green" : sensor.status === "Inactive" ? "yellow" : "red"}>{sensor.status}</Badge></td>
                <td><strong className={styles[sensor.floodLevel]}>{sensor.latestReading}</strong></td>
                <td><Badge tone={getFloodBadgeTone(sensor.level)}>{sensor.level}</Badge></td>
              </tr>
            ))}
            {isLoading ? (
              <tr>
                <td colSpan={6}><LoadingState message="Loading sensors..." /></td>
              </tr>
            ) : null}
            {!isLoading && displayedSensors.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title={sensors.length === 0 ? "No sensor records available" : "No sensors match your filters"}
                    description={sensors.length === 0 ? "Sensor records will appear when live sensor data is available." : "Reset filters or adjust the search to view more sensors."}
                    actionLabel={sensors.length === 0 ? undefined : "Reset Filters"}
                    onAction={sensors.length === 0 ? undefined : resetFilters}
                  />
                </td>
              </tr>
            ) : null}
          </DataTable>
        </div>
        <SharedPagination pagination={paginatedSensors.pagination} onPageChange={setPage} label="Sensors" />
      </article>
    </section>
  );
}

function mapSensor(row: Record<string, unknown>, index: number): SensorRow {
  const parsedWaterLevel = row.waterLevelM == null ? null : Number(row.waterLevelM);
  const waterLevel = parsedWaterLevel != null && Number.isFinite(parsedWaterLevel) ? parsedWaterLevel : null;
  const computedStatus = String(row.computedStatus ?? "").toLowerCase();
  const rawStatus = String(row.status ?? "offline").toLowerCase();
  const sensorId = String(row.sensorId ?? row.sensor_id ?? row._id ?? "");
  const floodLevel = getFloodStatusClass(computedStatus, waterLevel);

  return {
    sensor_key: sensorKey(row, index),
    sensor_id: sensorId || "No sensor ID",
    barangay: String(row.barangayName ?? row.barangay ?? ""),
    coordinates: formatCoordinates(row),
    status: rawStatus === "active" ? "Active" : rawStatus === "inactive" || rawStatus === "degraded" ? "Inactive" : "Offline",
    latestReading: waterLevel == null ? "No reading" : `${waterLevel.toFixed(2)}m`,
    level: getFloodStatusLabel(computedStatus, waterLevel),
    floodLevel,
    hasCoordinates: Boolean(resolveSensorCoordinates(row)),
  };
}

function formatCoordinates(row: Record<string, unknown>) {
  const location = row.location;
  const geo = row.geo;

  if (!location || typeof location !== "object") {
    const coordinates = (geo as { coordinates?: unknown } | null)?.coordinates;
    if (Array.isArray(coordinates) && coordinates.length >= 2) return `${coordinates[1]}, ${coordinates[0]}`;
    const resolved = resolveSensorCoordinates(row);
    if (resolved) return `${resolved.lat}, ${resolved.lng}`;
    return "N/A";
  }
  const coordinates = location as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
  const lat = coordinates.lat ?? coordinates.latitude;
  const lng = coordinates.lng ?? coordinates.longitude;
  if (lat != null && lng != null) return `${lat}, ${lng}`;
  const resolved = resolveSensorCoordinates(row);
  return resolved ? `${resolved.lat}, ${resolved.lng}` : "N/A";
}

function sensorKey(sensor: Record<string, unknown>, index: number) {
  return String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? `${sensor.name ?? "sensor"}-${index}`);
}

function readExplicitSensorFocus() {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  const searchSensorId = url.searchParams.get("sensorId")?.trim();
  const hashSensorId = sensorIdFromHash(url.hash);
  const shouldUseStoredFocus = window.sessionStorage.getItem("smartflood:focusSensorFromDashboard") === "true";
  const storedSensorId = shouldUseStoredFocus ? window.sessionStorage.getItem("smartflood:selectedSensorId")?.trim() : "";
  const explicitSensorId = searchSensorId || hashSensorId || storedSensorId || "";

  window.sessionStorage.removeItem("smartflood:focusSensorFromDashboard");
  window.sessionStorage.removeItem("smartflood:selectedSensorId");

  if (searchSensorId || hashSensorId) {
    clearSensorIdFromUrl(url);
  }

  return explicitSensorId;
}

function sensorIdFromHash(hash: string) {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "";

  return new URLSearchParams(hash.slice(queryIndex + 1)).get("sensorId")?.trim() ?? "";
}

function clearSensorIdFromUrl(url: URL) {
  url.searchParams.delete("sensorId");

  const queryIndex = url.hash.indexOf("?");
  if (queryIndex !== -1) {
    const hashBase = url.hash.slice(0, queryIndex);
    const hashParams = new URLSearchParams(url.hash.slice(queryIndex + 1));
    hashParams.delete("sensorId");
    const nextHashQuery = hashParams.toString();
    url.hash = nextHashQuery ? `${hashBase}?${nextHashQuery}` : hashBase;
  }

  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
