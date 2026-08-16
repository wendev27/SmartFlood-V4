"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import styles from "./MapPanel.module.css";

interface MapPanelProps {
  variant?: "dashboard" | "wide";
  sensors?: Record<string, unknown>[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  selectedSensorId?: string | null;
  onSensorSelect?: (sensorId: string) => void;
  focusZoom?: number;
}

const SensorLeafletMap = dynamic(
  () => import("@/components/map/SensorLeafletMap").then((module) => module.SensorLeafletMap),
  { ssr: false },
);

export function MapPanel({
  variant = "dashboard",
  sensors = [],
  isLoading = false,
  error = "",
  onRetry,
  selectedSensorId,
  onSensorSelect,
  focusZoom,
}: MapPanelProps) {
  return (
    <article className={cn(styles.map, styles[variant])} aria-label="Flood monitoring map">
      {error ? (
        <div className={styles.mapState}>
          <ErrorState title="Unable to Load Sensor Map" message={error} retryLabel={onRetry ? "Retry" : undefined} onRetry={onRetry} />
        </div>
      ) : isLoading ? (
        <div className={styles.mapState}>
          <LoadingState message="Loading sensor nodes..." />
        </div>
      ) : sensors.length === 0 ? (
        <div className={styles.mapState}>
          <EmptyState title="No sensor nodes available" description="Live sensor nodes will appear on the map once the API returns data." />
        </div>
      ) : (
        <SensorLeafletMap
          sensors={sensors}
          selectedSensorId={selectedSensorId}
          onSensorSelect={onSensorSelect}
          focusZoom={focusZoom}
        />
      )}
    </article>
  );
}
