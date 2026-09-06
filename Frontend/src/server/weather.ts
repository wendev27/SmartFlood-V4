import "server-only";
import type { WeatherData } from "@/types/weather";
import { array, object, openWeatherConditions, timezone, tomorrowConditions, tomorrowForecast } from "./weatherMapping";

// One public city forecast, independent of resident records and dashboard authorization.
// Coordinates avoid ambiguous city-name geocoding (there is another Malabon in the Philippines).
const coordinates = { lat: "14.66651", lon: "120.96531" };
const ttl = 10 * 60 * 1000;
let cached: { until: number; value: WeatherData } | null = null;
let pending: Promise<WeatherData> | null = null;
let failedUntil = 0;

async function provider(url: string, params: Record<string, string>): Promise<unknown> {
  try {
    const response = await fetch(`${url}?${new URLSearchParams(params)}`, { next: { revalidate: 600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    // Never expose provider URLs, credentials, response bodies or fetch errors to clients/logs.
    return null;
  }
}

async function loadWeather(): Promise<WeatherData> {
  const tomorrowKey = process.env.TOMORROW_API_KEY;
  const openWeatherKey = process.env.OPENWEATHER_API_KEY;
  if (!tomorrowKey && !openWeatherKey) throw new Error("Weather is not configured. Add the weather keys to this deployment's server environment.");
  const params = { location: `${coordinates.lat},${coordinates.lon}`, units: "metric", apikey: tomorrowKey ?? "" };
  const [realtime, forecast] = tomorrowKey ? await Promise.all([
    provider("https://api.tomorrow.io/v4/weather/realtime", params),
    provider("https://api.tomorrow.io/v4/weather/forecast", params),
  ]) : [null, null];
  let current = tomorrowConditions(object(realtime).data);
  let { hourly, daily } = tomorrowForecast(forecast);
  let intervalHours: 1 | 3 = 1;
  const sources = new Set<string>();
  if (current || hourly.length || daily.length) sources.add("Tomorrow.io");
  if (openWeatherKey && (!current || !hourly.length)) {
    const fallbackParams = { ...coordinates, units: "metric", appid: openWeatherKey };
    const [fallbackCurrent, fallbackForecast] = await Promise.all([
      current ? Promise.resolve(null) : provider("https://api.openweathermap.org/data/2.5/weather", fallbackParams),
      hourly.length ? Promise.resolve(null) : provider("https://api.openweathermap.org/data/2.5/forecast", fallbackParams),
    ]);
    const observation = openWeatherConditions(fallbackCurrent);
    if (!current && observation) { current = observation; sources.add("OpenWeather"); }
    if (!hourly.length) {
      hourly = array(object(fallbackForecast).list).map(openWeatherConditions).filter((row): row is NonNullable<typeof row> => row !== null && Date.parse(row.time) >= Date.now()).slice(0, 8);
      if (hourly.length) { intervalHours = 3; sources.add("OpenWeather"); }
    }
  }
  if (!current && !hourly.length && !daily.length) throw new Error("Weather providers are unavailable. Check the API keys, provider access and request limits, then retry.");
  const notices: string[] = [];
  if (!current) notices.push("Current observations are temporarily unavailable.");
  if (!hourly.length) notices.push("Hourly forecasts are temporarily unavailable.");
  if (!daily.length) notices.push("Daily forecasts are unavailable from the current provider response.");
  else if (daily.length < 7) notices.push(`The provider returned ${daily.length} forecast days; additional days are unavailable.`);
  return { location: "Malabon City", timezone, fetchedAt: new Date().toISOString(), current, hourly, daily, intervalHours, sources: [...sources], notices };
}

export async function getWeather(): Promise<WeatherData> {
  if (cached && cached.until > Date.now()) return cached.value;
  if (pending) return pending;
  if (failedUntil > Date.now()) throw new Error("Weather is temporarily unavailable. Please retry in a minute.");
  pending = loadWeather().then((value) => { cached = { value, until: Date.now() + ttl }; failedUntil = 0; return value; })
    .catch((error) => { failedUntil = Date.now() + 60_000; throw error; }).finally(() => { pending = null; });
  return pending;
}
