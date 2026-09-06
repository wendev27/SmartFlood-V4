# Weather integration

The dashboard weather cards and full forecast page now consume real Malabon City weather. This supersedes the weather-unavailable entries in the earlier migration reports.

## Boundary and configuration

```text
Dashboard / WeatherForecastPanel
  → shared useWeather query
  → weatherService → GET /api/weather
  → Next.js Node route in Frontend/src/app/api/weather/route.ts
  → server-only provider client → Tomorrow.io / OpenWeather
```

The provider handler belongs to the frontend's Next.js server. `Backend/**`, existing authentication/RBAC, database/AI logic and existing API contracts were not changed. The existing `/api/:path*` rewrite remains unchanged; the local `/api/weather` route is served before the fallback rewrite. This was verified against a production Next.js server.

Set `TOMORROW_API_KEY` and `OPENWEATHER_API_KEY` in local `Frontend/.env` and in the **frontend Vercel project's Environment Variables**, for each deployment environment that needs weather. Use the exact names without `NEXT_PUBLIC_`. Redeploy after setting them. Real keys remain in the ignored local file; `.env.example` contains empty placeholders only. No backend deployment is required for this public city-weather route.

The query uses fixed coordinates `14.66651,120.96531` and labels the result Malabon City. A name-only provider lookup matched a different Malabon, so the handler never relies on ambiguous name lookup. It accepts no arbitrary upstream URL, coordinates or credentials from callers. It serves public city weather, never resident or user information.

## Data and failure behavior

- Tomorrow.io realtime provides current temperature, apparent temperature, humidity, precipitation probability, UV index, wind and surface pressure. Its forecast provides the next eight available hourly records and up to seven available daily records.
- OpenWeather current/5-day endpoints are fallbacks when current/hourly data cannot be obtained from Tomorrow.io. Its forecast interval is correctly labeled **3-Hour Forecast**. It does not supply UV or a daily forecast through these endpoints; absent fields remain unavailable.
- Temperatures use Celsius, wind is converted from m/s to km/h, pressure uses hPa, and percentages preserve real zero values. Times and daily filtering use Asia/Manila. Old forecast hours/days are excluded. Daily condition codes are not averaged.
- The live provider response returned five usable daily records. The page displays **5-Day Forecast**, with an explanation, rather than inventing two more days. The heading follows the actual response length.
- Both views share a React Query cache. The server deduplicates in-flight requests, caches usable responses for ten minutes, briefly suppresses repeated total failures, and gives each upstream request an eight-second timeout. Public CDN caching also uses ten minutes. Errors are sanitized; provider URLs, key values and raw error bodies are never returned. Data is attributed to the provider that supplied it.
- Partial responses render available sections and explain the missing ones. Loading states, retry controls and refresh-failure messages do not claim success or manufacture weather values.

## Files

- `src/app/api/weather/route.ts`: GET response, HTTP 503 failures, public cache headers.
- `src/server/weather.ts`: provider calls, fallback, timeouts, caching and server-only credential access.
- `src/server/weatherMapping.ts`: validated provider-field conversion and Philippine forecast dates.
- `src/types/weather.ts`: dedicated current/hourly/daily response types.
- `src/services/weatherService.ts`, `src/components/weather/useWeather.ts`: same-origin request and shared client query.
- `src/adapters/weatherPresentation.ts`: labels, units, timestamps and weather artwork selection.
- `src/components/dashboard/DashboardPanel/{DashboardPanel.tsx,DashboardPanel.module.css}`: connected dashboard cards and retry.
- `src/components/weather/WeatherForecastPanel/{WeatherForecastPanel.tsx,WeatherForecastPanel.module.css}`: connected full forecast and refresh.
- `public/images/weather/{sun,moon}.svg`: clear-condition artwork; existing REY cloud/rain/showers assets are reused.
- `.env.example`: blank server-only variable examples. Local `.env` holds the private values and is excluded from Git.
- `tests/weather.test.cjs`, `tests/presentation.test.cjs`: provider and rendered-markup regression checks.

## Verification

- TypeScript: exit 0.
- `npm run build`: passed, including the dynamic `/api/weather` route.
- `node tests/weather.test.cjs`: 6 passed, 0 failed; null/zero measurements, units, dates, cache/deduplication, fallback and sanitized failures.
- `node tests/presentation.test.cjs`: 18 passed, 0 failed; includes real weather rendering, actual daily count and error/retry state.
- Live Tomorrow.io realtime and forecast: HTTP 200. OpenWeather current: HTTP 200. Automated fallback coverage uses controlled responses rather than consuming additional requests.
- Production `GET /api/weather`: HTTP 200, eight hourly rows and five daily rows. Repeated request returned identical cached data in 0.008 seconds.
- Both keys were absent from the route response and all 30 generated client-static files scanned.
- Existing backend, database, service/type/library/data files in the migration baseline remain unchanged. Only new weather service/types were added.
- Browser discovery returned no connected browser. Rendered browser interaction, responsive screenshots and Vercel deployment behavior remain unverified. Server HTTP checks and React markup tests were performed instead.

Provider references: [Tomorrow.io forecast](https://docs.tomorrow.io/reference/weather-forecast), [weather fields](https://docs.tomorrow.io/reference/data-layers-core), [weather codes](https://docs.tomorrow.io/reference/data-layers-weather-codes), [OpenWeather forecast](https://openweathermap.org/api/forecast5).
