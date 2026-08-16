"use client";

import { useMemo } from "react";
import { CircleMarker, MapContainer, Pane, Popup, TileLayer } from "react-leaflet";
import { getFloodStatusLabel } from "@/lib/statusStyles";
import { formatBarangayName, formatSensorUpdatedTime } from "@/lib/formatters";
import type { FloodHistoryRow } from "@/services/floodService";
import { FloodInfluenceLayer, FloodLegend, FloodMapShell, markerVisualFor, type FloodVisualizationPointInput } from "@/components/map/FloodVisualization";
import styles from "./FloodHeatmapMap.module.css";

type FloodHeatmapMapProps = {
  readings: FloodHistoryRow[];
};

const fallbackCenter: [number, number] = [14.62202, 121.0528];

export function FloodHeatmapMap({ readings }: FloodHeatmapMapProps) {
  const validReadings = useMemo(() => readings.flatMap(toValidReading), [readings]);
  const influencePoints = useMemo(() => validReadings.map(toInfluencePoint), [validReadings]);

  const center = useMemo<[number, number]>(() => {
    if (validReadings.length === 0) return fallbackCenter;

    const totals = validReadings.reduce((sum, point) => ({
      lat: sum.lat + point.lat,
      lng: sum.lng + point.lng,
    }), { lat: 0, lng: 0 });

    return [totals.lat / validReadings.length, totals.lng / validReadings.length];
  }, [validReadings]);

  return (
    <FloodMapShell>
      <MapContainer className={styles.mapCanvas} center={center} zoom={14} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FloodInfluenceLayer points={influencePoints} />
        <Pane name="sensor-markers" style={{ zIndex: 430 }}>
          {validReadings.map((point) => {
            const markerVisual = markerVisualFor(point.reading.computedStatus, point.reading.waterLevelM);
            return (
            <CircleMarker
              center={[point.lat, point.lng]}
              fillColor={markerVisual.color}
              fillOpacity={markerVisual.markerOpacity}
              key={point.key}
              pane="sensor-markers"
              pathOptions={{ color: markerVisual.color, weight: markerVisual.strokeWeight }}
              radius={10}
            >
              <Popup>
                <div className={styles.popup}>
                  <strong>{point.reading.sensorName}</strong>
                  <span>{point.reading.sensorId}</span>
                  <span>{formatBarangayName(point.reading.barangayName)}</span>
                  {point.reading.street ? <span>{point.reading.street}</span> : null}
                  <span>Device: {formatDeviceStatus(point.reading.deviceStatus)}</span>
                  <span>Water: <b style={{ color: markerVisual.color }}>{formatWaterLevel(point.reading.waterLevelM)}</b></span>
                  <span>Level: <b style={{ color: markerVisual.color }}>{getFloodStatusLabel(point.reading.computedStatus, point.reading.waterLevelM)}</b></span>
                  <span>Updated: {formatSensorUpdatedTime(point.reading.createdAt)}</span>
                </div>
              </Popup>
            </CircleMarker>
          );
          })}
        </Pane>
      </MapContainer>
      <FloodLegend />
    </FloodMapShell>
  );
}

type ValidFloodReading = {
  key: string;
  lat: number;
  lng: number;
  reading: FloodHistoryRow;
};

function toValidReading(reading: FloodHistoryRow): ValidFloodReading[] {
  if (reading.lat == null || reading.lng == null) return [];

  const lat = Number(reading.lat);
  const lng = Number(reading.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

  return [{
    key: reading.readingId || `${reading.sensorId}-${reading.createdAt ?? "latest"}`,
    lat,
    lng,
    reading,
  }];
}

function toInfluencePoint(point: ValidFloodReading): FloodVisualizationPointInput {
  return {
    key: point.key,
    lat: point.lat,
    lng: point.lng,
    status: point.reading.computedStatus,
    waterLevelM: point.reading.waterLevelM,
  };
}

function formatWaterLevel(value: number | null) {
  return value == null ? "No reading" : `${value.toFixed(2)}m`;
}

function formatDeviceStatus(value?: string) {
  const status = String(value ?? "unknown").trim();
  return status ? status : "unknown";
}
