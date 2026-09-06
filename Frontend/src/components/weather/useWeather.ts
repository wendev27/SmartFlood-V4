"use client";
import { useQuery } from "@tanstack/react-query";
import { getWeatherForecast } from "@/services/weatherService";

export function useWeather() {
  return useQuery({ queryKey: ["weather", "malabon"], queryFn: getWeatherForecast, staleTime: 10 * 60_000, refetchInterval: 10 * 60_000, refetchIntervalInBackground: false, retry: false });
}
