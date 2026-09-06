import styles from "./WeatherForecastPanel.module.css";

const details = ["Feels like", "Humidity", "Rain Chance", "UV Index", "Wind", "Pressure"];

/** REY's complete forecast composition. No weather data source exists in V3.2 yet. */
export function WeatherForecastPanel({ onBack }: { onBack: () => void }) {
  return <div className={styles.forecast}>
    <button type="button" className={styles.backButton} onClick={onBack}>← Back</button>
    <h1>Weather Forecast</h1>
    <p className={styles.unavailable} role="status">Weather observations and forecasts are unavailable.</p>
    <section className={styles.current} aria-label="Current weather unavailable">
      <div className={styles.currentSummary}><img src="/images/weather/cloud.png" alt="" className={styles.placeholderIcon} /><div><strong>Date unavailable</strong><div className={styles.temperature} aria-label="Temperature unavailable">—</div><span>Unavailable</span></div></div>
      <div className={styles.details}>{details.map((label) => <div key={label} className={styles.detail}><span>{label}</span><strong aria-label={`${label} unavailable`}>—</strong></div>)}</div>
    </section>
    <section className={styles.card} aria-label="Hourly forecast unavailable"><h2>Hourly Forecast</h2><div className={styles.hourly}>{Array.from({ length: 8 }, (_, index) => <article key={index} aria-hidden="true"><span>—</span><img src="/images/weather/cloud-small.png" alt="" className={styles.placeholderIcon} /><strong>—</strong></article>)}</div></section>
    <section className={`${styles.card} ${styles.week}`} aria-label="Seven-day forecast unavailable"><h2>7-Day Forecast</h2>{Array.from({ length: 7 }, (_, index) => <article key={index} aria-hidden="true"><div><strong>—</strong><span>—</span></div><div className={styles.condition}><img src="/images/weather/cloud-small.png" alt="" className={styles.placeholderIcon} /><strong>Unavailable</strong></div><strong>—</strong><span>—</span></article>)}</section>
  </div>;
}
