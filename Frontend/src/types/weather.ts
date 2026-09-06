export type WeatherIcon = "clear" | "cloud" | "rain" | "showers" | "unknown";
export interface WeatherConditions {
  time: string;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  rainChance: number | null;
  uvIndex: number | null;
  windKmh: number | null;
  pressureHpa: number | null;
  description: string;
  icon: WeatherIcon;
}
export interface DailyWeather {
  time: string;
  low: number | null;
  high: number | null;
  rainChance: number | null;
  description: string;
  icon: WeatherIcon;
}
export interface WeatherData {
  location: string;
  timezone: string;
  fetchedAt: string;
  current: WeatherConditions | null;
  hourly: WeatherConditions[];
  daily: DailyWeather[];
  intervalHours: 1 | 3;
  sources: string[];
  notices: string[];
}
