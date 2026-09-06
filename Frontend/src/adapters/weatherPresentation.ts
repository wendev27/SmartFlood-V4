import type { WeatherConditions, WeatherIcon } from "@/types/weather";

export const weatherValue = (value: number | null | undefined, suffix = "") => value == null || !Number.isFinite(value) ? "—" : `${Math.round(value)}${suffix}`;
export function weatherTime(time: string, options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" }) {
  return new Intl.DateTimeFormat("en-PH", { ...options, timeZone: "Asia/Manila" }).format(new Date(time));
}
export function weatherDetails(current?: WeatherConditions | null) {
  return [
    { label: "Feels like", value: weatherValue(current?.feelsLike, "°C") },
    { label: "Humidity", value: weatherValue(current?.humidity, "%") },
    { label: "Rain Chance", value: weatherValue(current?.rainChance, "%") },
    { label: "UV Index", value: weatherValue(current?.uvIndex) },
    { label: "Wind", value: weatherValue(current?.windKmh, " km/h") },
    { label: "Pressure", value: weatherValue(current?.pressureHpa, " hPa") },
  ];
}
export function weatherImage(icon?: WeatherIcon, time?: string): string {
  if (icon === "clear") {
    const hour = time ? Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", hourCycle: "h23" }).format(new Date(time))) : 12;
    return hour < 6 || hour >= 18 ? "/images/weather/moon.svg" : "/images/weather/sun.svg";
  }
  return `/images/weather/${icon === "rain" ? "rain" : icon === "showers" ? "showers" : "cloud"}.png`;
}
