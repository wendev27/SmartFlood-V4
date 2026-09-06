"use client";

import { useWeather } from "@/components/weather/useWeather";
import { weatherDetails, weatherImage, weatherTime, weatherValue } from "@/adapters/weatherPresentation";
import styles from "./WeatherForecastPanel.module.css";

export function WeatherForecastPanel({ onBack }: { onBack: () => void }) {
  const weather = useWeather();
  const data = weather.data, current = data?.current;
  const hourly = data?.hourly ?? [], daily = data?.daily ?? [];
  return <div className={styles.forecast}>
    <button type="button" className={styles.backButton} onClick={onBack}>← Back</button>
    <h1>Weather Forecast</h1>
    <div className={styles.unavailable} aria-live="polite">
      <p>{weather.isPending ? "Loading Malabon City weather…" : `Malabon City · Philippine time${data ? ` · Source: ${data.sources.join(" / ")}` : ""}`}</p>
      {weather.isError ? <p role="alert">{weather.error.message}{data ? " Showing previously loaded weather." : ""}</p> : null}
      {data?.notices.map((notice) => <p key={notice}>{notice}</p>)}
      <button className={styles.refresh} type="button" disabled={weather.isFetching} onClick={() => weather.refetch()}>{weather.isFetching ? "Refreshing…" : weather.isError ? "Retry weather" : "Refresh weather"}</button>
    </div>
    <section className={styles.current} aria-label="Current weather" aria-busy={weather.isPending}>
      <div className={styles.currentSummary}>
        <img src={weatherImage(current?.icon, current?.time)} alt="" className={!current ? styles.placeholderIcon : undefined} />
        <div><strong>{current ? weatherTime(current.time, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Observation time unavailable"}</strong>
          <div className={styles.temperature}>{weather.isPending ? "…" : weatherValue(current?.temperature, "°C")}</div><span>{current?.description ?? (weather.isPending ? "Loading…" : "Unavailable")}</span></div>
      </div>
      <div className={styles.details}>{weatherDetails(current).map(({ label, value }) => <div key={label} className={styles.detail}><span>{label}</span><strong>{weather.isPending ? "…" : value}</strong></div>)}</div>
    </section>
    <section className={styles.card} aria-label="Upcoming forecast" aria-busy={weather.isPending}>
      <h2>{data?.intervalHours === 3 ? "3-Hour Forecast" : "Hourly Forecast"}</h2>
      <div className={styles.hourly}>{hourly.map((row) => <article key={row.time} title={row.description}>
        <span>{weatherTime(row.time)}</span><img src={weatherImage(row.icon, row.time)} alt={row.description} /><strong>{weatherValue(row.temperature, "°C")}</strong>
      </article>)}</div>
      {!hourly.length ? <p>{weather.isPending ? "Loading forecast…" : "Hourly forecast unavailable. Try refreshing shortly."}</p> : null}
    </section>
    <section className={`${styles.card} ${styles.week}`} aria-label="Daily forecast" aria-busy={weather.isPending}>
      <h2>{daily.length ? `${daily.length}-Day Forecast` : "Daily Forecast"}</h2>
      {daily.map((row) => <article key={row.time}>
        <div><strong>{weatherTime(row.time, { weekday: "long" })}</strong><span>{weatherTime(row.time, { month: "short", day: "numeric" })}</span></div>
        <div className={styles.condition}><img src={weatherImage(row.icon)} alt="" /><strong>{row.description}</strong></div>
        <strong aria-label="High and low temperature">{weatherValue(row.high, "°")} / {weatherValue(row.low, "°C")}</strong>
        <span>Rain: {weatherValue(row.rainChance, "%")}</span>
      </article>)}
      {!daily.length ? <p className={styles.dailyEmpty}>{weather.isPending ? "Loading daily forecast…" : "Daily forecast unavailable from the provider."}</p> : null}
    </section>
  </div>;
}
