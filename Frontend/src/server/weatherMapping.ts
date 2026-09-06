import type { DailyWeather, WeatherConditions, WeatherIcon } from "@/types/weather";

export const timezone = "Asia/Manila";
export const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
export const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export const number = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const percent = (value: unknown) => { const n = number(value); return n !== null && n >= 0 && n <= 100 ? n : null; };
export function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
export function localDay(time: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(time));
}
function condition(code: unknown): { description: string; icon: WeatherIcon } {
  const codes: Record<number, [string, WeatherIcon]> = {
    1000: ["Clear", "clear"], 1100: ["Mostly clear", "clear"], 1101: ["Partly cloudy", "cloud"],
    1102: ["Mostly cloudy", "cloud"], 1001: ["Cloudy", "cloud"], 2000: ["Fog", "cloud"], 2100: ["Light fog", "cloud"],
    4000: ["Drizzle", "showers"], 4001: ["Rain", "rain"], 4200: ["Light rain", "showers"], 4201: ["Heavy rain", "rain"],
    8000: ["Thunderstorm", "rain"], 5000: ["Snow", "cloud"], 5001: ["Flurries", "cloud"],
    5100: ["Light snow", "cloud"], 5101: ["Heavy snow", "cloud"], 6000: ["Freezing drizzle", "showers"],
    6001: ["Freezing rain", "rain"], 6200: ["Light freezing rain", "showers"], 6201: ["Heavy freezing rain", "rain"],
    7000: ["Ice pellets", "cloud"], 7101: ["Heavy ice pellets", "cloud"], 7102: ["Light ice pellets", "cloud"],
  };
  const [description, icon] = codes[number(code) ?? -1] ?? ["Condition unavailable", "unknown"];
  return { description, icon };
}
export function tomorrowConditions(value: unknown): WeatherConditions | null {
  const row = object(value), values = object(row.values), time = timestamp(row.time);
  if (!time || number(values.temperature) === null) return null;
  const wind = number(values.windSpeed);
  return { time, temperature: number(values.temperature), feelsLike: number(values.temperatureApparent), humidity: percent(values.humidity),
    rainChance: percent(values.precipitationProbability), uvIndex: number(values.uvIndex), windKmh: wind === null ? null : wind * 3.6,
    pressureHpa: number(values.pressureSurfaceLevel), ...condition(values.weatherCode) };
}
export function tomorrowForecast(payload: unknown, now = Date.now()) {
  const timelines = object(object(payload).timelines);
  const hourly = array(timelines.hourly).map(tomorrowConditions).filter((row): row is WeatherConditions => row !== null && Date.parse(row.time) >= now)
    .sort((a, b) => a.time.localeCompare(b.time)).slice(0, 8);
  const daily = array(timelines.daily).flatMap((value): DailyWeather[] => {
    const row = object(value), v = object(row.values), time = timestamp(row.time);
    if (!time || localDay(time) < localDay(new Date(now).toISOString()) || number(v.temperatureMin) === null || number(v.temperatureMax) === null) return [];
    return [{ time, low: number(v.temperatureMin), high: number(v.temperatureMax), rainChance: percent(v.precipitationProbabilityMax), ...condition(v.weatherCodeFullDay ?? v.weatherCodeMax) }];
  }).sort((a, b) => a.time.localeCompare(b.time)).slice(0, 7);
  return { hourly, daily };
}
export function openWeatherConditions(payload: unknown): WeatherConditions | null {
  const row = object(payload), main = object(row.main), weather = object(array(row.weather)[0]), wind = number(object(row.wind).speed);
  const seconds = number(row.dt), temperature = number(main.temp), code = number(weather.id);
  if (seconds === null || temperature === null || !Number.isFinite(new Date(seconds * 1000).getTime())) return null;
  const pop = number(row.pop);
  return { time: new Date(seconds * 1000).toISOString(), temperature, feelsLike: number(main.feels_like), humidity: percent(main.humidity),
    rainChance: pop === null ? null : percent(pop * 100), uvIndex: null, windKmh: wind === null ? null : wind * 3.6, pressureHpa: number(main.pressure),
    description: typeof weather.description === "string" ? weather.description : "Condition unavailable",
    icon: code === null ? "unknown" : code === 800 ? "clear" : code >= 200 && code < 600 ? "rain" : "cloud" };
}
