"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { divIcon } from "leaflet";
import { Marker, Pane, useMap, useMapEvents } from "react-leaflet";
import { getFloodStatusClass, getFloodStatusColor, type FloodLevel } from "@/lib/statusStyles";
import styles from "./FloodVisualization.module.css";

export type FloodVisualizationPointInput = {
  key: string;
  lat: number;
  lng: number;
  status?: unknown;
  waterLevelM?: unknown;
};

type FloodVisualizationPoint = FloodVisualizationPointInput & {
  color: string;
  visual: ZoomedSeverityVisual;
};

type SeverityVisual = {
  coreColor: string;
  midColor: string;
  opacity: number;
  outerColor: string;
  radius: number;
};

type ZoomedSeverityVisual = SeverityVisual & {
  blur: number;
  coreStop: number;
  fadeStop: number;
  midStop: number;
  outerStop: number;
};

const severityVisuals: Record<FloodLevel, SeverityVisual> = {
  normal: { coreColor: "#17a34a", midColor: "#2dd4bf", outerColor: "#38bdf8", radius: 58, opacity: 0.085 },
  flood_alert: { coreColor: "#f7bd00", midColor: "#fde047", outerColor: "#fef08a", radius: 82, opacity: 0.16 },
  flood_warning: { coreColor: "#ff7417", midColor: "#f7bd00", outerColor: "#fef08a", radius: 108, opacity: 0.25 },
  severity: { coreColor: "#ff3347", midColor: "#ff7417", outerColor: "#f7bd00", radius: 138, opacity: 0.34 },
  no_reading: { coreColor: "#94a3b8", midColor: "#cbd5e1", outerColor: "#e2e8f0", radius: 42, opacity: 0.035 },
};

export function FloodInfluenceLayer({ points }: { points: FloodVisualizationPointInput[] }) {
  const zoom = useMapZoom();
  const visualizationPoints = useMemo(() => points.flatMap((point) => toVisualizationPoint(point, zoom)), [points, zoom]);

  return (
    <Pane name="severity-influence" style={{ zIndex: 390 }}>
      {visualizationPoints.map((point) => (
        <Marker
          icon={influenceIcon(point)}
          interactive={false}
          keyboard={false}
          key={`${point.key}-influence`}
          pane="severity-influence"
          position={[point.lat, point.lng]}
        />
      ))}
    </Pane>
  );
}

export function FloodLegend() {
  return (
    <aside className={styles.legend} aria-label="Observed flood severity legend">
      <h4>OBSERVED FLOOD SEVERITY</h4>
      <div>
        <span><i className={styles.severeSwatch} />Severe <em>&gt;= 1.20m</em></span>
        <span><i className={styles.warningSwatch} />Flood Warning <em>&gt;= 0.75m</em></span>
        <span><i className={styles.alertSwatch} />Flood Alert <em>&gt;= 0.25m</em></span>
        <span><i className={styles.normalSwatch} />Normal <em>&lt; 0.25m</em></span>
        <span><i className={styles.noReadingSwatch} />No Reading</span>
      </div>
      <p>Intensity represents observed sensor severity around monitoring points.</p>
      <p>This visualization is not a prediction or confirmed flood boundary.</p>
    </aside>
  );
}

export function FloodMapShell({ children }: { children: ReactNode }) {
  return <div className={styles.mapShell}>{children}</div>;
}

export function markerVisualFor(status?: unknown, waterLevelM?: unknown) {
  const level = getFloodStatusClass(status, waterLevelM);
  return {
    color: getFloodStatusColor(level),
    level,
    markerOpacity: level === "no_reading" ? 0.4 : level === "normal" ? 0.54 : level === "flood_alert" ? 0.62 : level === "flood_warning" ? 0.7 : 0.78,
    strokeWeight: level === "severity" ? 3 : level === "flood_warning" ? 2.5 : level === "no_reading" ? 1.5 : 2,
  };
}

function useMapZoom() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    setZoom(map.getZoom());
  }, [map]);

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  return zoom;
}

function toVisualizationPoint(point: FloodVisualizationPointInput, zoom: number): FloodVisualizationPoint[] {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return [];

  const status = getFloodStatusClass(point.status, point.waterLevelM);
  return [{
    ...point,
    color: getFloodStatusColor(status),
    visual: zoomedVisualFor(status, zoom),
  }];
}

function zoomedVisualFor(status: FloodLevel, zoom: number): ZoomedSeverityVisual {
  const base = severityVisuals[status];
  const radiusScale = radiusScaleForZoom(zoom);
  const opacityScale = opacityScaleForZoom(zoom);
  const falloff = falloffForZoom(zoom);

  return {
    ...base,
    blur: falloff.blur,
    coreStop: falloff.core,
    fadeStop: falloff.fade,
    midStop: falloff.mid,
    opacity: base.opacity * opacityScale,
    outerStop: falloff.outer,
    radius: Math.round(base.radius * radiusScale),
  };
}

function influenceIcon(point: FloodVisualizationPoint) {
  const size = point.visual.radius * 2;

  return divIcon({
    className: styles.influenceIcon,
    html: `<span class="${styles.influence}" style="--core-color: ${rgbTriplet(point.visual.coreColor)}; --mid-color: ${rgbTriplet(point.visual.midColor)}; --outer-color: ${rgbTriplet(point.visual.outerColor)}; --severity-opacity: ${point.visual.opacity}; --core-stop: ${point.visual.coreStop}%; --mid-stop: ${point.visual.midStop}%; --outer-stop: ${point.visual.outerStop}%; --fade-stop: ${point.visual.fadeStop}%; --influence-blur: ${point.visual.blur}px;"></span>`,
    iconAnchor: [point.visual.radius, point.visual.radius],
    iconSize: [size, size],
  });
}

function radiusScaleForZoom(zoom: number) {
  if (zoom <= 11) return 0.42;
  if (zoom <= 12) return 0.52;
  if (zoom <= 13) return 0.68;
  if (zoom <= 14) return 0.88;
  if (zoom <= 15) return 1.03;
  if (zoom <= 16) return 1.14;
  return 1.22;
}

function opacityScaleForZoom(zoom: number) {
  if (zoom <= 11) return 0.42;
  if (zoom <= 12) return 0.52;
  if (zoom <= 13) return 0.66;
  if (zoom <= 14) return 0.84;
  if (zoom <= 15) return 0.96;
  return 1.04;
}

function falloffForZoom(zoom: number) {
  if (zoom <= 12) return { core: 8, mid: 25, outer: 48, fade: 72, blur: 7 };
  if (zoom <= 14) return { core: 12, mid: 34, outer: 58, fade: 80, blur: 9 };
  if (zoom <= 16) return { core: 16, mid: 42, outer: 66, fade: 86, blur: 10 };
  return { core: 18, mid: 46, outer: 70, fade: 90, blur: 11 };
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized, 16);

  if (!Number.isFinite(value)) return { r: 148, g: 163, b: 184 };

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbTriplet(hex: string) {
  const rgb = hexToRgb(hex);
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}
