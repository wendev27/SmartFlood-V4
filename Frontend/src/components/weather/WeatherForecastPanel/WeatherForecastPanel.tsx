import styles from "./WeatherForecastPanel.module.css";

const hours = [["Now","31°C","rain.png"],["1 PM","32°C","cloud-small.png"],["2 PM","33°C","cloud-small.png"],["3 PM","33°C","cloud.png"],["4 PM","32°C","showers.png"],["5 PM","31°C","showers.png"],["6 PM","30°C","rain.png"],["7 PM","29°C","rain.png"]];
const days = [["Today","September 25","Thunderstorms","26°C / 33°C","65%","rain.png"],["Friday","September 26","Rain","25°C / 32°C","70%","showers.png"],["Saturday","September 27","Rain","26°C / 33°C","62%","rain.png"],["Sunday","September 28","Rain","25°C / 32°C","68%","showers.png"],["Monday","September 29","Rain","26°C / 33°C","61%","rain.png"],["Tuesday","September 30","Rain","25°C / 32°C","66%","showers.png"],["Wednesday","October 1","Rain","26°C / 33°C","63%","rain.png"]];
const details = [["Feels like","34°C"],["Humidity","78%"],["Rain Chance","65%"],["UV Index","3 Low"],["Wind","11 km/h"],["Pressure","1009 hPa"]];

export function WeatherForecastPanel({ onBack }: { onBack: () => void }) {
  return <div className={styles.forecast}>
    <button type="button" className={styles.backButton} onClick={onBack}>← Back</button>
    <h1>Weather Forecast</h1>
    <section className={styles.current} aria-label="Current weather"><div className={styles.currentSummary}><img src="/images/weather/rain.png" alt="Rainy weather"/><div><strong>Thursday, September 25</strong><div className={styles.temperature}>31°C</div><span>Rainy</span></div></div><div className={styles.details}>{details.map(([label,value]) => <div key={label} className={styles.detail}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
    <section className={styles.card}><h2>Hourly Forecast</h2><div className={styles.hourly}>{hours.map(([time,temp,image]) => <article key={time}><span>{time}</span><img src={`/images/weather/${image}`} alt=""/><strong>{temp}</strong></article>)}</div></section>
    <section className={`${styles.card} ${styles.week}`}><h2>7-Day Forecast</h2>{days.map(([day,date,condition,temp,rain,image]) => <article key={day}><div><strong>{day}</strong><span>{date}</span></div><div className={styles.condition}><img src={`/images/weather/${image}`} alt=""/><strong>{condition}</strong></div><strong>{temp}</strong><span>{rain} rain</span></article>)}</section>
  </div>;
}
