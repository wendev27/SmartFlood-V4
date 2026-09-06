import { fetchJson } from "./apiClient";
import type { WeatherData } from "@/types/weather";

export function getWeatherForecast(): Promise<WeatherData> {
  return fetchJson<WeatherData>("/api/weather", undefined, 20_000);
}
