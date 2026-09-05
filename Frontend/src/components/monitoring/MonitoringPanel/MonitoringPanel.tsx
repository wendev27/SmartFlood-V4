"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SmartFloodIcon, type SmartFloodIconName } from "@/components/icons/SmartFloodIcon";
import type { DashboardUserProfile } from "@/components/layout/AppShell/AppShell";
import { DashboardHeaderActions } from "@/components/layout/DashboardHeaderActions/DashboardHeaderActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Modal } from "@/components/ui/Modal/Modal";
import { Pagination as SharedPagination, type PaginationState } from "@/components/ui/Pagination/Pagination";
import { formatBarangayName, normalizeBarangayForCompare } from "@/lib/formatters";
import { queryKeys, queryStaleTime } from "@/lib/queryKeys";
import { resolveSensorCoordinates } from "@/lib/sensorMapping";
import { getFloodStatusClass, getFloodStatusLabel } from "@/lib/statusStyles";
import { getFloodMonitoringData, getSensorHistory, type FloodHistoryRow } from "@/services/floodService";
import { getSensors } from "@/services/sensorsService";
import styles from "./MonitoringPanel.module.css";

const FloodHeatmapMap = dynamic(
  () => import("@/components/map/FloodHeatmapMap").then((module) => module.FloodHeatmapMap),
  { ssr: false },
);

export type MonitoringView = "main" | "alertLevels" | "heatmap" | "history";

interface MonitoringPanelProps {
  onViewChange?: (view: MonitoringView) => void;
  resetSignal?: number;
  userProfile: DashboardUserProfile;
}

export function MonitoringPanel({ onViewChange, resetSignal = 0, userProfile }: MonitoringPanelProps) {
  const [activeView, setActiveView] = useState<MonitoringView>("main");
  const canManageAlertLevels = /super|cdrrmo|ndrrmo/i.test(userProfile.roleLabel);
  const visibleModules = canManageAlertLevels
    ? monitoringModules
    : monitoringModules.filter((item) => item.view !== "alertLevels");

  useEffect(() => {
    setActiveView("main");
    onViewChange?.("main");
  }, [onViewChange, resetSignal]);

  function changeView(view: MonitoringView) {
    setActiveView(view);
    onViewChange?.(view);
  }

  if (activeView === "alertLevels") {
    return <AlertLevelManagement onBack={() => changeView("main")} userProfile={userProfile} />;
  }

  if (activeView === "heatmap") {
    return <FloodHeatmap onBack={() => changeView("main")} userProfile={userProfile} />;
  }

  if (activeView === "history") {
    return <FloodHistory onBack={() => changeView("main")} userProfile={userProfile} />;
  }

  return (
    <section className={styles.panel} aria-label="Flood monitoring modules">
      <div className={styles.moduleCards}>
        {visibleModules.map((item) => (
          <button className={styles.moduleCard} key={item.label} type="button" onClick={() => item.view && changeView(item.view)}>
            <span className={styles.moduleIcon}>
              {item.iconSrc ? <img src={item.iconSrc} alt="" /> : <MonitoringModuleIcon view={item.view} fallback={item.icon} />}
            </span>
            <strong>{item.label}</strong>
            <p>{item.caption}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function MonitoringModuleIcon({ view, fallback }: { view?: MonitoringView; fallback: SmartFloodIconName }) {
  if (view === "heatmap") {
    return <svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M23.1184 4.05167C22.4584 3.53834 21.5417 3.53834 20.8817 4.05167C17.3985 6.71001 7.11343 15.3817 7.16843 25.4833C7.16843 33.66 13.8235 40.3333 22.0184 40.3333C30.2134 40.3333 36.8684 33.6783 36.8684 25.5017C36.8867 15.5467 26.5834 6.72834 23.1184 4.05167Z" stroke="currentColor" strokeWidth="2.75" strokeMiterlimit="10" /></svg>;
  }

  if (view === "history") {
    return <svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M23.8335 27.5H12.8335L16.5002 31.1667M12.8335 27.5L16.5002 23.8333" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/><path d="M40.3334 18.3333V27.5C40.3334 36.6667 36.6667 40.3333 27.5001 40.3333H16.5001C7.33341 40.3333 3.66675 36.6667 3.66675 27.5V16.5C3.66675 7.33334 7.33341 3.66667 16.5001 3.66667H25.6667" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/><path d="M40.3334 18.3333H33.0001C27.5001 18.3333 25.6667 16.5 25.6667 11V3.66667L33.0001 11L40.3334 18.3333Z" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  }

  return <SmartFloodIcon name={fallback} size={40} />;
}

function ClipboardListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="2" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FloodHistory({ onBack, userProfile }: MonitoringSubpageProps) {
  const pageSize = 5;
  const [history, setHistory] = useState<FloodHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const groupBy: HistoryGroup = "daily";
  const [historyDate, setHistoryDate] = useState("");
  const [barangay, setBarangay] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [isHistoryReportOpen, setIsHistoryReportOpen] = useState(false);
  const [areHistoryFiltersOpen, setAreHistoryFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const rows = await getSensorHistory();
        if (!cancelled) {
          setHistory(rows);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load flood history.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  const barangays = useMemo(() => Array.from(new Set(history.map((reading) => reading.barangayName))).sort(), [history]);
  const filteredHistory = useMemo(() => history.filter((reading) => {
    const date = reading.createdAt ? new Date(reading.createdAt) : null;
    const matchesDate = !historyDate || (date != null && !Number.isNaN(date.getTime()) && localDateKey(date) === historyDate);
    return matchesDate
      && (!barangay || normalizeBarangayForCompare(reading.barangayName) === normalizeBarangayForCompare(barangay));
  }), [barangay, history, historyDate]);
  const timeline = useMemo(() => groupHistory(filteredHistory, groupBy), [filteredHistory, groupBy]);
  const timelineMax = Math.max(1, ...timeline.map((group) => group.maxLevel));
  const chartPoints = timelinePoints(timeline, timelineMax);
  const timelineLabels = useMemo(() => timelineTickLabels(timeline), [timeline]);
  const highestWaterLevel = Math.max(0, ...filteredHistory.map((reading) => reading.waterLevelM ?? 0));
  const measuredWaterLevels = filteredHistory.flatMap((reading) => reading.waterLevelM == null ? [] : [reading.waterLevelM]);
  const lowestWaterLevel = measuredWaterLevels.length > 0 ? Math.min(...measuredWaterLevels) : 0;
  const latestReadingTime = filteredHistory[0]?.createdAt ?? null;
  const paginatedHistory = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
    const safePage = Math.min(historyPage, totalPages);
    return {
      rows: filteredHistory.slice((safePage - 1) * pageSize, safePage * pageSize),
      pagination: { page: safePage, limit: pageSize, total: filteredHistory.length, totalPages } satisfies PaginationState,
    };
  }, [filteredHistory, historyPage]);

  useEffect(() => {
    setHistoryPage(1);
  }, [barangay, historyDate]);

  useEffect(() => {
    if (historyPage !== paginatedHistory.pagination.page) setHistoryPage(paginatedHistory.pagination.page);
  }, [historyPage, paginatedHistory.pagination.page]);

  return (
    <section className={styles.historyPage} aria-label="Flood history">
      <div className={styles.subpageHeader}>
        <div>
          <button className={styles.backButton} type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Back
          </button>
          <h2>Flood History</h2>
        </div>
        <div className={styles.subpageHeaderActions}>
          <DashboardHeaderActions userProfile={userProfile} />
          <button className={styles.refreshHistory} type="button" onClick={() => setIsHistoryReportOpen(true)}>
            <ClipboardListIcon />
            View Historical Report
          </button>
        </div>
      </div>
      {error ? (
        <ErrorState title="Unable to Load Flood History" message={error} retryLabel="Retry" onRetry={() => setRefreshVersion((current) => current + 1)} />
      ) : null}

      <article className={styles.historyCard}>
        <h3>Flood History Records</h3>
        <div className={styles.historyBody}>
          {isLoading ? <LoadingState message="Loading flood history records..." /> : null}
          <button
            className={styles.historyFiltersButton}
            type="button"
            aria-expanded={areHistoryFiltersOpen}
            onClick={() => setAreHistoryFiltersOpen((open) => !open)}
          >
            <SlidersIcon />
            Filters
          </button>
          {areHistoryFiltersOpen ? <div className={styles.analyticsFilters}>
            <input type="date" aria-label="Filter by date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} />
            <label className={styles.filterSelectWrap}>
              <select value={barangay} onChange={(event) => setBarangay(event.target.value)}>
                <option value="">All barangays</option>
                {barangays.map((item) => <option key={item} value={item}>{formatBarangayName(item)}</option>)}
              </select>
            </label>
          </div> : null}

          <div className={styles.historyChartHeading}>
            <h4>Flood Level Timeline</h4>
          </div>
          <div className={styles.lineChartWrap}>
            <div className={styles.historyYAxis}>
              <span>{timelineMax.toFixed(1)}</span>
              <span>{(timelineMax * 0.75).toFixed(1)}</span>
              <span>{(timelineMax * 0.5).toFixed(1)}</span>
              <span>{(timelineMax * 0.25).toFixed(1)}</span>
              <span>0</span>
            </div>
            <span className={styles.historyAxisLabel}>Max Level (m)</span>
            <div className={styles.lineChart}>
              <svg viewBox={`0 0 ${timelineChartWidth} ${timelineChartHeight}`} preserveAspectRatio="none" aria-hidden="true">
                {chartPoints ? <polyline points={chartPoints} /> : null}
              </svg>
              {timeline.map((group, index) => (
                <span
                  className={`${styles.analyticsPoint} ${styles[levelPointClass(historyLevel(group.maxLevel))]}`}
                  key={group.key}
                  style={timelinePointStyle(index, timeline.length, group.maxLevel, timelineMax)}
                  tabIndex={0}
                  data-side={index > Math.max(0, timeline.length - 1) / 2 ? "left" : "right"}
                >
                  <span className={styles.pointTooltip}>
                    <small>{group.label}</small>
                    <b>{group.maxLevel.toFixed(2)}m</b>
                    <em>{group.count} records</em>
                    <em>{historyLevel(group.maxLevel)}</em>
                  </span>
                </span>
              ))}
              {!isLoading && timeline.length === 0 ? (
                <div className={styles.timelineEmpty}>
                  <EmptyState title="No flood readings available yet" description="Flood level readings will appear once sensors report history data." />
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles.timelineLabels}>
            {timelineLabels.map((group) => (
              <span key={group.key} style={timelineLabelStyle(group.index, timeline.length)}>
                {group.shortLabel}
              </span>
            ))}
          </div>

          <div className={styles.historyTableWrap}>
            <table className={styles.historyTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Barangay</th>
                  <th>Minimum</th>
                  <th>Max Level</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.rows.map((record, index) => (
                  <tr key={historyRecordKey(record, index)}>
                    <td>{formatTimestamp(record.createdAt)}</td>
                    <td>{record.sensorName}{record.street ? ` - ${record.street}` : ""}</td>
                    <td>{formatBarangayName(record.barangayName)}</td>
                    <td>{formatWaterLevel(record.waterLevelM)}</td>
                    <td>{formatWaterLevel(record.waterLevelM)}</td>
                  </tr>
                ))}
                {!isLoading && filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        title={history.length === 0 ? "No flood readings available yet" : "No flood history records found"}
                        description={history.length === 0 ? "Sensor history records will appear here once data is available." : "Try changing the date range, filters, or search terms."}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <SharedPagination pagination={paginatedHistory.pagination} onPageChange={setHistoryPage} label="Flood history records" />
        </div>
      </article>
      <Modal isOpen={isHistoryReportOpen} onClose={() => setIsHistoryReportOpen(false)} labelledBy="historical-report-title" className={styles.reportDialog}>
        <header className={styles.reportHeader}>
          <h2 id="historical-report-title">Narrative Report</h2>
          <div className={styles.reportHeaderActions}>
            <button className={styles.downloadReport} type="button" onClick={() => window.print()}>
              <DownloadIcon />
              <span>Download PDF</span>
            </button>
            <button className={styles.closeReport} type="button" aria-label="Close historical report" onClick={() => setIsHistoryReportOpen(false)}>×</button>
          </div>
        </header>
        <div className={`${styles.reportBody} ${styles.narrativeSections}`}>
          <section>
            <h3>Executive Summary</h3>
            <p>{filteredHistory.length > 0 ? `A total of ${filteredHistory.length} flood readings were recorded for the selected filters. The highest water level reached ${highestWaterLevel.toFixed(2)}m, with ${countHistoryLevel(filteredHistory, "Severe")} severe and ${countHistoryLevel(filteredHistory, "Flood Warning")} warning readings. The latest matching record was received ${formatTimestamp(latestReadingTime)}.` : "No flood readings match the selected filters. Adjust the date or barangay filter to generate a historical summary."}</p>
          </section>
          <section>
            <h3>Water Level Analysis</h3>
            <p>{measuredWaterLevels.length > 0 ? `Recorded water levels ranged from ${lowestWaterLevel.toFixed(2)}m to ${highestWaterLevel.toFixed(2)}m across the selected monitoring period.` : "Water-level analysis will appear when measured readings are available."}</p>
            <div className={styles.highestEvent}>
              <strong>Highest Water Level Event</strong>
              <span>{highestWaterLevel.toFixed(2)}m recorded within the selected history results.</span>
            </div>
            <div className={styles.lowestEvent}>
              <strong>Lowest Water Level Event</strong>
              <span>{lowestWaterLevel.toFixed(2)}m recorded within the selected history results.</span>
            </div>
          </section>
          <section>
            <h3 className={styles.durationHeading}><ClockIcon />Duration and Impact</h3>
            <p>The selected history contains {filteredHistory.length} timestamped monitoring records. Review the timeline and affected barangays to assess how long elevated readings persisted and prioritize follow-up action.</p>
          </section>
        </div>
      </Modal>
    </section>
  );
}

function FloodHeatmap({ onBack, userProfile }: MonitoringSubpageProps) {
  const [history, setHistory] = useState<FloodHistoryRow[]>([]);
  const [latestSensors, setLatestSensors] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getFloodMonitoringData();
        if (!cancelled) {
          setHistory(data.history);
          setLatestSensors(data.latestSensors);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load flood monitoring data.");
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

  const latestReadings = useMemo(() => latestFloodReadings(latestSensors, history), [history, latestSensors]);
  const distribution = useMemo(() => riskDistributionFor(latestReadings), [latestReadings]);
  const highestReading = useMemo(() => latestReadings.reduce<FloodHistoryRow | null>((highest, reading) =>
    reading.waterLevelM != null && (highest?.waterLevelM == null || reading.waterLevelM > highest.waterLevelM) ? reading : highest
  , null), [latestReadings]);
  const highestRiskBarangay = useMemo(() => highestRiskBarangayFor(latestReadings), [latestReadings]);
  const maxWaterLevel = Math.max(8, ...latestReadings.map((reading) => reading.waterLevelM ?? 0));
  const donutStyle = { background: distributionGradient(distribution) };

  return (
    <section className={styles.heatmapPage} aria-label="Flood heatmap">
      <div className={styles.heatmapTop}>
        <div>
          <button className={styles.backButton} type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Back
          </button>
          <h2>Flood Heatmap</h2>
        </div>
        <div className={styles.subpageHeaderActions}>
          <DashboardHeaderActions userProfile={userProfile} />
          <button className={styles.reviewButton} type="button" onClick={() => setIsReportOpen(true)}>
            <ClipboardListIcon />
            Review Narrative Report
          </button>
        </div>
      </div>

      {error ? <ErrorState title="Unable to Load Flood Monitoring Data" message={error} /> : null}
      {isLoading ? <LoadingState message="Loading flood monitoring data..." /> : null}
      {!isLoading && !error && latestReadings.length === 0 ? (
        <EmptyState title="No flood readings available yet" description="Current flood readings will appear once sensor data is available." />
      ) : null}

      <article className={styles.heatmapCard}>
        <div className={styles.heatmapHeader}>
          <h3>Flood Risk Heatmap</h3>
        </div>
        <div className={styles.mapCanvas}>
          <FloodHeatmapMap readings={latestReadings} />
        </div>
      </article>

      <article className={styles.chartCard}>
        <h3>Water Level Trends (Current)</h3>
        <div className={styles.chartWrap}>
          <div className={styles.yAxis}>
            <span>{maxWaterLevel.toFixed(1)}</span>
            <span>{(maxWaterLevel * 0.75).toFixed(1)}</span>
            <span>{(maxWaterLevel * 0.5).toFixed(1)}</span>
            <span>{(maxWaterLevel * 0.25).toFixed(1)}</span>
            <span>0</span>
          </div>
          <span className={styles.axisLabel}>Water Level (m)</span>
          <div className={styles.barChart} style={{ gridTemplateColumns: `repeat(${Math.max(latestReadings.length, 1)}, minmax(70px, 1fr))` }}>
            {latestReadings.map((item) => (
              <div className={styles.barSlot} key={item.sensorId} title={`${item.sensorName}: ${formatWaterLevel(item.waterLevelM)} (${getFloodStatusLabel(item.computedStatus, item.waterLevelM)})`}>
                <span
                  className={`${styles.bar} ${styles[barTone(item)]}`}
                  style={{ height: `${item.waterLevelM == null ? 3 : Math.max(3, (item.waterLevelM / maxWaterLevel) * 100)}%` }}
                />
                <small>{item.sensorName}</small>
              </div>
            ))}
            {!isLoading && latestReadings.length === 0 ? (
              <div className={styles.chartEmpty}>
                <EmptyState title="No flood readings available yet" description="Trend bars will appear after sensors report live readings." />
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.chartLegend}>
          <span><i className={styles.legendNormal} />Normal</span>
          <span><i className={styles.legendAlert} />Flood Alert</span>
          <span><i className={styles.legendWarning} />Flood Warning</span>
          <span><i className={styles.legendCritical} />Severe</span>
          <span><i className={styles.legendNoReading} />No reading</span>
        </div>
      </article>

      <article className={styles.distributionCard}>
        <h3>Flood Risk Distribution</h3>
        <div className={styles.distributionBody}>
          <div className={styles.donut} style={donutStyle}>
            <div>
              <strong>{latestReadings.length}</strong>
              <span>Areas</span>
            </div>
          </div>
          <div className={styles.distributionStats}>
            {distribution.map((item) => (
              <div key={item.label}>
                <span><i className={styles[item.dot]} />{item.label}</span>
                <strong className={styles[item.valueTone]}>{item.value}</strong>
                <small>{item.percent}</small>
              </div>
            ))}
          </div>
        </div>
      </article>
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} labelledBy="narrative-report-title" className={styles.reportDialog}>
        <header className={styles.reportHeader}>
          <h2 id="narrative-report-title">Narrative Report</h2>
          <div className={styles.reportHeaderActions}>
            <button className={styles.downloadReport} type="button" onClick={() => window.print()}>
              <DownloadIcon />
              <span>Download PDF</span>
            </button>
            <button className={styles.closeReport} type="button" aria-label="Close narrative report" onClick={() => setIsReportOpen(false)}>×</button>
          </div>
        </header>
        <div className={`${styles.reportBody} ${styles.narrativeSections}`}>
          <section>
            <h3>Current State</h3>
            <p>{narrativeFor(latestReadings, highestReading, highestRiskBarangay)}</p>
          </section>
          <section>
            <h3>Trend Analysis</h3>
            <p>{latestReadings.length > 0 ? `${latestReadings.length} active monitoring areas are represented by the latest sensor readings. The highest observed water level is ${highestReading ? formatWaterLevel(highestReading.waterLevelM) : "not available"}. Continue comparing incoming readings to identify sustained increases and threshold changes.` : "Trend analysis will be generated when live sensor readings become available."}</p>
          </section>
          <section>
            <h3>Recommendation</h3>
            <p>{countRisk(latestReadings, "severity") > 0 ? "Maintain continuous monitoring, notify the affected barangay, and prepare immediate evacuation support for areas at severe level." : countRisk(latestReadings, "flood_warning") > 0 ? "Continue close monitoring and advise affected barangays to prepare residents and evacuation resources." : "Continue routine monitoring and issue public advisories whenever readings cross an alert threshold."}</p>
          </section>
        </div>
      </Modal>
    </section>
  );
}

function AlertLevelManagement({ onBack, userProfile }: MonitoringSubpageProps) {
  const sensorsQuery = useQuery({
    queryKey: queryKeys.sensors.latest,
    queryFn: getSensors,
    staleTime: queryStaleTime.realTime,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });
  const visibleActivity = useMemo(() => buildAlertActivity(sensorsQuery.data ?? []), [sensorsQuery.data]);
  const activityError = sensorsQuery.error instanceof Error
    ? sensorsQuery.error.message
    : sensorsQuery.error ? "Unable to load recent alert activity." : "";

  return (
    <section className={styles.alertPage} aria-label="Alert level management">
      <div className={styles.subpageHeader}>
        <div>
          <button className={styles.backButton} type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Back
          </button>
          <h2>Alert Level</h2>
        </div>
        <DashboardHeaderActions userProfile={userProfile} />
      </div>

      <article className={styles.configPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Alert Level Configuration*</h3>
            <p>Manage flood alert thresholds and automated actions</p>
          </div>
        </div>

        <div className={styles.alertCards}>
          {alertLevels.map((level) => (
            <section className={`${styles.alertCard} ${styles[level.tone]}`} key={level.name}>
              <div className={styles.levelTop}>
                <span className={styles.levelIcon}>
                  <SmartFloodIcon name="alertLevel" size={20} />
                </span>
                <div>
                  <strong>{level.name}</strong>
                  <small>{level.range}</small>
                </div>
              </div>
              <p>{level.action}</p>
              <span className={styles.levelNote}>{level.note}</span>
            </section>
          ))}
        </div>
      </article>

      <article className={styles.activityPanel}>
        <h3>Recent Alert Activity</h3>
        <div className={styles.activityList}>
          {sensorsQuery.isPending ? <LoadingState message="Loading current alert activity..." /> : null}
          {activityError ? (
            <ErrorState
              title="Unable to Load Alert Activity"
              message={activityError}
              retryLabel="Retry"
              onRetry={() => sensorsQuery.refetch()}
            />
          ) : null}
          {!sensorsQuery.isPending && !activityError && visibleActivity.length === 0 ? (
            <EmptyState title="No active flood alerts" description="All available sensor readings are currently below the alert threshold." />
          ) : null}
          {visibleActivity.map((activity) => (
            <section className={`${styles.activityItem} ${styles[activity.tone]}`} key={activity.key}>
              <span className={styles.activityIcon}>
                <SmartFloodIcon name="alertLevel" size={20} />
              </span>
              <div>
                <strong>{activity.title}</strong>
                <p>{activity.meta}</p>
              </div>
              <span className={styles.activityBadge}>{activity.badge}</span>
            </section>
          ))}
        </div>
      </article>

      <p className={styles.alertSource}>
        According to PAGASA: <a href="https://www.pagasa.dost.gov.ph/" target="_blank" rel="noreferrer">https://www.pagasa.dost.gov.ph/</a>
      </p>
    </section>
  );
}

type MonitoringSubpageProps = {
  onBack: () => void;
  userProfile: DashboardUserProfile;
};

function latestFloodReadings(sensors: Record<string, unknown>[], history: FloodHistoryRow[]) {
  const latestBySensor = new Map<string, FloodHistoryRow>();
  history.forEach((reading) => {
    if (!latestBySensor.has(reading.sensorId)) latestBySensor.set(reading.sensorId, reading);
  });

  return sensors.map((sensor) => {
    const sensorId = String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? "");
    const reading = latestBySensor.get(sensorId);
    if (reading) return {
      ...reading,
      deviceStatus: String(sensor.status ?? "unknown"),
    };

    const coordinates = resolveSensorCoordinates(sensor);
    return {
      readingId: `no-reading-${sensorId}`,
      sensorId,
      sensorName: String(sensor.name ?? sensorId),
      barangay: String(sensor.barangayName ?? sensor.barangay ?? "Unknown"),
      barangayName: String(sensor.barangayName ?? sensor.barangay ?? "Unknown"),
      street: String(sensor.street ?? ""),
      lat: coordinates?.lat ?? null,
      lng: coordinates?.lng ?? null,
      waterLevelM: null,
      waterLevel: null,
      distanceCm: null,
      rainfallMm: null,
      batteryPct: null,
      computedStatus: "no_reading",
      status: "no_reading",
      deviceStatus: String(sensor.status ?? "unknown"),
      createdAt: null,
    };
  });
}

function riskDistributionFor(readings: FloodHistoryRow[]) {
  const total = readings.length;
  const categories = [
    { label: "Normal", group: "normal", dot: "legendNormal", valueTone: "normalText" },
    { label: "Flood Alert", group: "flood_alert", dot: "legendAlert", valueTone: "alertText" },
    { label: "Flood Warning", group: "flood_warning", dot: "legendWarning", valueTone: "warningText" },
    { label: "Severe", group: "severity", dot: "legendCritical", valueTone: "criticalText" },
    { label: "No reading", group: "no_reading", dot: "legendNoReading", valueTone: "noReadingText" },
  ];

  return categories.map((item) => {
    const value = readings.filter((reading) => riskGroup(reading) === item.group).length;
    return { ...item, value: String(value), percent: total === 0 ? "0%" : `${Math.round((value / total) * 100)}%` };
  });
}

function distributionGradient(distribution: ReturnType<typeof riskDistributionFor>) {
  const colors = ["#17a34a", "#f7bd00", "#ff7417", "#ff3347", "#94a3b8"];
  let start = 0;
  const segments = distribution.map((item, index) => {
    const end = start + Number(item.percent.replace("%", ""));
    const segment = `${colors[index]} ${start}% ${end}%`;
    start = end;
    return segment;
  });

  return start === 0 ? "#edf2f7" : `conic-gradient(${segments.join(", ")})`;
}

function barTone(reading: FloodHistoryRow) {
  const group = riskGroup(reading);
  if (group === "severity") return "criticalBar";
  if (group === "flood_warning") return "warningBar";
  if (group === "flood_alert") return "alertBar";
  if (group === "normal") return "normalBar";
  return "noReadingBar";
}

function riskGroup(reading: FloodHistoryRow) {
  return getFloodStatusClass(reading.computedStatus, reading.waterLevelM);
}

function countRisk(readings: FloodHistoryRow[], group: string) {
  return readings.filter((reading) => riskGroup(reading) === group).length;
}

function highestRiskBarangayFor(readings: FloodHistoryRow[]) {
  const rank = { no_reading: 0, normal: 1, flood_alert: 2, flood_warning: 3, severity: 4 };
  return readings.reduce<{ name: string; rank: number } | null>((highest, reading) => {
    const readingRank = rank[riskGroup(reading) as keyof typeof rank];
    return !highest || readingRank > highest.rank ? { name: reading.barangayName, rank: readingRank } : highest;
  }, null)?.name ?? "";
}

function narrativeFor(readings: FloodHistoryRow[], highest: FloodHistoryRow | null, barangay: string) {
  if (readings.length === 0) return "No flood readings available yet.";
  if (!highest) return `Based on the latest sensor status, ${readings.length} sensor nodes are registered but no water-level readings are available yet.`;

  const severity = countRisk(readings, "severity");
  const warning = countRisk(readings, "flood_warning");
  const alert = countRisk(readings, "flood_alert");
  return `Based on the latest sensor readings, ${formatBarangayName(barangay || highest.barangayName)} has the highest observed risk. ${highest.sensorName} recorded ${formatWaterLevel(highest.waterLevelM)}. The network currently has ${severity} severe, ${warning} warning, and ${alert} alert sensor readings. Immediate monitoring is recommended.`;
}

function formatWaterLevel(value: number | null) {
  return value == null ? "No reading" : `${value.toFixed(2)}m`;
}

function formatTimestamp(value: string | null) {
  if (!value) return "No reading";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

type HistoryGroup = "hourly" | "daily" | "weekly" | "monthly" | "yearly";
type HistoryLevel = "Normal" | "Flood Alert" | "Flood Warning" | "Severe" | "No reading";
type HistoryChartGroup = {
  key: string;
  label: string;
  shortLabel: string;
  maxLevel: number;
  count: number;
};

const timelineChartWidth = 720;
const timelineChartHeight = 220;
const timelineChartPadding = {
  top: 22,
  right: 30,
  bottom: 28,
  left: 30,
};

function groupHistory(readings: FloodHistoryRow[], groupBy: HistoryGroup) {
  const groups = new Map<string, HistoryChartGroup>();

  readings.forEach((reading) => {
    if (!reading.createdAt) return;
    const date = new Date(reading.createdAt);
    if (Number.isNaN(date.getTime())) return;

    const bucket = historyBucket(date, groupBy);
    const current = groups.get(bucket.key);
    const maxLevel = Math.max(current?.maxLevel ?? 0, reading.waterLevelM ?? 0);
    groups.set(bucket.key, { ...bucket, maxLevel, count: (current?.count ?? 0) + 1 });
  });

  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function historyBucket(date: Date, groupBy: HistoryGroup) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (groupBy === "hourly") {
    const hour = String(date.getHours()).padStart(2, "0");
    return { key: `${year}-${month}-${day}T${hour}`, label: date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric" }), shortLabel: date.toLocaleTimeString([], { hour: "numeric" }) };
  }
  if (groupBy === "weekly") {
    const start = startOfDay(date);
    start.setDate(start.getDate() - start.getDay());
    return { key: localDateKey(start), label: `Week of ${start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`, shortLabel: start.toLocaleDateString([], { month: "short", day: "numeric" }) };
  }
  if (groupBy === "monthly") {
    return { key: `${year}-${month}`, label: date.toLocaleDateString([], { month: "long", year: "numeric" }), shortLabel: date.toLocaleDateString([], { month: "short", year: "2-digit" }) };
  }
  if (groupBy === "yearly") {
    return { key: String(year), label: String(year), shortLabel: String(year) };
  }

  return { key: `${year}-${month}-${day}`, label: date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }), shortLabel: date.toLocaleDateString([], { month: "short", day: "numeric" }) };
}

function historyLevel(level: number | null, computedStatus = ""): HistoryLevel {
  return getFloodStatusLabel(computedStatus, level) as HistoryLevel;
}

function timelinePoints(groups: HistoryChartGroup[], max: number) {
  if (groups.length <= 1) return "";

  return groups.map((group, index) => {
    const point = timelinePoint(index, groups.length, group.maxLevel, max);
    const x = (point.left / 100) * timelineChartWidth;
    const y = (point.top / 100) * timelineChartHeight;
    return `${x},${y}`;
  }).join(" ");
}

function timelinePointStyle(index: number, total: number, level: number, max: number) {
  const point = timelinePoint(index, total, level, max);
  return { left: `${point.left}%`, top: `${point.top}%` };
}

function timelinePoint(index: number, total: number, level: number, max: number) {
  const plotWidth = timelineChartWidth - timelineChartPadding.left - timelineChartPadding.right;
  const plotHeight = timelineChartHeight - timelineChartPadding.top - timelineChartPadding.bottom;
  const x = total <= 1
    ? timelineChartPadding.left + plotWidth / 2
    : timelineChartPadding.left + (index / (total - 1)) * plotWidth;
  const y = timelineChartPadding.top + (1 - level / max) * plotHeight;
  const left = (x / timelineChartWidth) * 100;
  const top = (y / timelineChartHeight) * 100;
  return { left, top };
}

function timelineTickLabels(groups: HistoryChartGroup[]) {
  if (groups.length <= 8) return groups.map((group, index) => ({ ...group, index }));

  const lastIndex = groups.length - 1;
  const step = Math.ceil(lastIndex / 7);
  const indexes = new Set<number>([0, lastIndex]);
  for (let index = step; index < lastIndex; index += step) {
    indexes.add(index);
  }

  return Array.from(indexes)
    .sort((a, b) => a - b)
    .map((index) => ({ ...groups[index], index }));
}

function timelineLabelStyle(index: number, total: number) {
  const point = timelinePoint(index, total, 0, 1);
  return { left: `${point.left}%` };
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function localDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function levelPointClass(level: HistoryLevel) {
  if (level === "Severe") return "pointCritical";
  if (level === "Flood Warning") return "pointWarning";
  if (level === "Flood Alert") return "pointAlert";
  if (level === "No reading") return "pointNoReading";
  return "pointNormal";
}

function historyRecordKey(reading: FloodHistoryRow, index: number) {
  if (reading.readingId) return reading.readingId;
  if (reading.sensorId && reading.createdAt) return `${reading.sensorId}-${reading.createdAt}`;
  return `${reading.sensorName}-${reading.createdAt ?? "no-date"}-${index}`;
}

function countHistoryLevel(readings: FloodHistoryRow[], level: HistoryLevel) {
  return readings.filter((reading) => historyLevel(reading.waterLevelM, reading.computedStatus) === level).length;
}

const monitoringModules: Array<{
  label: string;
  caption: string;
  icon: SmartFloodIconName;
  iconSrc?: string;
  view?: "alertLevels" | "heatmap" | "history";
}> = [
  {
    label: "Alert Level",
    caption: "View descriptive graphs and narrative reports",
    icon: "alertLevel",
    iconSrc: "/images/dashboard/alert-level-icon.svg",
    view: "alertLevels",
  },
  {
    label: "Flood Heatmap",
    caption: "View real-time flood intensity across regions",
    icon: "floodHeatmap",
    view: "heatmap",
  },
  {
    label: "Flood History",
    caption: "View tabulated flood history records",
    icon: "floodHistory",
    view: "history",
  },
];

const alertLevels = [
  {
    name: "Alert",
    range: "0.25m - 0.74m",
    action: "Automated Action",
    note: "Alert residents and increase monitoring frequency",
    tone: "alert",
  },
  {
    name: "Alarm",
    range: "0.75m - 1.19m",
    action: "Automated Action",
    note: "Prepare evacuation teams and affected households",
    tone: "warning",
  },
  {
    name: "Critical",
    range: "1.20m and above",
    action: "Automated Action",
    note: "Initiate evacuation and emergency response protocols",
    tone: "critical",
  },
] as const;

function buildAlertActivity(sensors: Record<string, unknown>[]) {
  return sensors.flatMap((sensor, index) => {
    const rawLevel = sensor.waterLevelM ?? sensor.waterLevel ?? sensor.level;
    const waterLevel = Number.parseFloat(String(rawLevel ?? ""));
    const level = getFloodStatusClass(sensor.computedStatus ?? sensor.risk ?? sensor.status, rawLevel);
    if (!Number.isFinite(waterLevel) || !["flood_alert", "flood_warning", "severity"].includes(level)) return [];

    const badge = getFloodStatusLabel(level, waterLevel);
    const sensorId = String(sensor.sensorId ?? sensor.sensor_id ?? sensor._id ?? sensor.name ?? `Sensor ${index + 1}`);
    const barangay = formatBarangayName(String(sensor.barangayName ?? sensor.barangay ?? "Unknown barangay"));
    const timestamp = String(sensor.lastReadingAt ?? sensor.updatedAt ?? sensor.timestamp ?? sensor.createdAt ?? "");
    const tone = level === "severity" ? "critical" : level === "flood_warning" ? "warning" : "alert";

    return [{
      key: `${sensorId}-${timestamp || index}`,
      title: `${badge} level at ${barangay}`,
      meta: `${sensorId} recorded ${formatWaterLevel(waterLevel)}${timestamp ? ` · ${formatTimestamp(timestamp)}` : ""}`,
      badge,
      tone,
      timestamp: timestamp ? new Date(timestamp).getTime() : 0,
    }];
  }).sort((a, b) => b.timestamp - a.timestamp);
}
