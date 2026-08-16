"use client";

import { useEffect, useMemo, useRef } from "react";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { resolveSensorCoordinates, type SensorCoordinates } from "@/lib/sensorMapping";
import { getFloodStatusClass, getFloodStatusColor, getFloodStatusLabel } from "@/lib/statusStyles";
import { formatBarangayName, formatSensorUpdatedTime } from "@/lib/formatters";
import { FloodInfluenceLayer, FloodLegend, FloodMapShell, type FloodVisualizationPointInput } from "@/components/map/FloodVisualization";
import styles from "./SensorLeafletMap.module.css";

type SensorLeafletMapProps = {
  sensors: Record<string, unknown>[];
  selectedSensorId?: string | null;
  onSensorSelect?: (sensorId: string) => void;
  focusZoom?: number;
};

const fallbackCenter: [number, number] = [14.62202, 121.0528];

export function SensorLeafletMap({ sensors, selectedSensorId, onSensorSelect, focusZoom = 17 }: SensorLeafletMapProps) {
  const markerRefs = useRef(new Map<string, LeafletMarker>());
  const validSensors = useMemo(() => sensors
    .map((sensor, index) => ({ sensor, sensorId: sensorKey(sensor, index), coordinates: resolveSensorCoordinates(sensor) }))
    .filter((item): item is { sensor: Record<string, unknown>; sensorId: string; coordinates: SensorCoordinates } => Boolean(item.coordinates)), [sensors]);
  const influencePoints = useMemo(() => validSensors.map(toInfluencePoint), [validSensors]);

  const center = useMemo<[number, number]>(() => {
    if (validSensors.length === 0) return fallbackCenter;

    const totals = validSensors.reduce((sum, item) => ({
      lat: sum.lat + item.coordinates.lat,
      lng: sum.lng + item.coordinates.lng,
    }), { lat: 0, lng: 0 });

    return [totals.lat / validSensors.length, totals.lng / validSensors.length];
  }, [validSensors]);

  return (
    <FloodMapShell>
      <MapContainer className={styles.mapCanvas} center={center} zoom={14} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FloodInfluenceLayer points={influencePoints} />
        <SelectedSensorFocus
          focusZoom={focusZoom}
          markerRefs={markerRefs.current}
          selectedSensorId={selectedSensorId}
          sensors={validSensors}
        />
        {validSensors.map(({ sensor, sensorId, coordinates }) => {
          const markerTone = markerStatus(sensor);
          const floodColor = getFloodStatusColor(sensor.computedStatus, sensor.waterLevelM);
          return (
            <Marker
              eventHandlers={{
                click: () => onSensorSelect?.(sensorId),
              }}
              icon={sensorIcon(markerTone)}
              key={sensorId}
              position={[coordinates.lat, coordinates.lng]}
              ref={(marker) => {
                if (marker) {
                  markerRefs.current.set(sensorId, marker);
                } else {
                  markerRefs.current.delete(sensorId);
                }
              }}
            >
              <Popup autoPan keepInView autoPanPadding={[40, 40]} maxWidth={280}>
                <div className={styles.popup}>
                  <strong>{String(sensor.name || "Unnamed sensor")}</strong>
                  <span>{String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? "No sensor ID")}</span>
                  <span>{formatBarangayName(String(sensor.barangayName ?? sensor.barangay ?? "Unknown barangay"))}</span>
                  {sensor.street ? <span>{String(sensor.street)}</span> : null}
                  <span>Device: {String(sensor.status ?? "unknown")}</span>
                  <span>Water: <b style={{ color: floodColor }}>{formatWater(sensor.waterLevelM)}</b></span>
                  <span>Level: <b style={{ color: floodColor }}>{getFloodStatusLabel(sensor.computedStatus, sensor.waterLevelM)}</b></span>
                  <span>Updated: {formatSensorUpdatedTime(sensorUpdatedAt(sensor))}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <FloodLegend />
    </FloodMapShell>
  );
}

function SelectedSensorFocus({
  focusZoom,
  markerRefs,
  selectedSensorId,
  sensors,
}: {
  focusZoom: number;
  markerRefs: Map<string, LeafletMarker>;
  selectedSensorId?: string | null;
  sensors: Array<{ sensor: Record<string, unknown>; sensorId: string; coordinates: SensorCoordinates }>;
}) {
  const map = useMap();
  const lastFocusedSensor = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedSensorId) {
      lastFocusedSensor.current = null;
      return;
    }
    if (lastFocusedSensor.current === selectedSensorId) return;

    const selected = sensors.find((item) => item.sensorId === selectedSensorId);
    if (!selected) return;

    lastFocusedSensor.current = selectedSensorId;
    map.flyTo([selected.coordinates.lat, selected.coordinates.lng], focusZoom, { duration: 0.8 });
    const marker = markerRefs.get(selectedSensorId);
    window.setTimeout(() => marker?.openPopup(), 500);
  }, [focusZoom, map, markerRefs, selectedSensorId, sensors]);

  return null;
}

function sensorKey(sensor: Record<string, unknown>, index: number) {
  return String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? `${sensor.name ?? "sensor"}-${index}`);
}

function toInfluencePoint({ sensor, sensorId, coordinates }: { sensor: Record<string, unknown>; sensorId: string; coordinates: SensorCoordinates }): FloodVisualizationPointInput {
  return {
    key: sensorId,
    lat: coordinates.lat,
    lng: coordinates.lng,
    status: sensor.computedStatus,
    waterLevelM: sensor.waterLevelM,
  };
}

function markerStatus(sensor: Record<string, unknown>) {
  return getFloodStatusClass(sensor.computedStatus, sensor.waterLevelM);
}

function sensorIcon(tone: string) {
  return divIcon({
    className: "",
    html: `<span class="${styles.marker} ${styles[tone]}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function formatWater(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)}m` : "No reading";
}

function sensorUpdatedAt(sensor: Record<string, unknown>) {
  return (sensor.latestReadingAt ?? sensor.lastSeenAt ?? sensor.updatedAt) as string | Date | null | undefined;
}
