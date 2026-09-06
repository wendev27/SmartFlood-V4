const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(request, ...args) { return resolve.call(this, request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : request, ...args); };
const load = Module._load;
Module._load = function(request, ...args) { return request === 'server-only' ? {} : load.call(this, request, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { tomorrowConditions, tomorrowForecast, openWeatherConditions } = require('@/server/weatherMapping');
const { weatherValue, weatherTime, weatherDetails } = require('@/adapters/weatherPresentation');
const reading = (time, values = {}) => ({ time, values: { temperature: 27, weatherCode: 1001, ...values } });

test('zero measurements survive while null and invalid readings remain unavailable', () => {
 const row = tomorrowConditions(reading('2026-09-07T00:00:00Z', { windSpeed: 2, precipitationProbability: 0, uvIndex: 0, humidity: null, temperatureApparent: 0 }));
 assert.equal(row.windKmh, 7.2);
 assert.equal(row.rainChance, 0);
 assert.equal(row.uvIndex, 0);
 assert.equal(row.humidity, null);
 assert.equal(weatherValue(row.uvIndex), '0');
 assert.equal(weatherValue(row.humidity), '—');
 assert.equal(tomorrowConditions(reading('invalid')), null);
 assert.equal(tomorrowConditions(reading('2026-09-07T00:00:00Z', { temperature: null })), null);
 assert.equal(weatherDetails(row).find(x => x.label === 'Rain Chance').value, '0%');
});

test('forecasts respect Philippine dates, discard past hours and retain only provided days', () => {
 const result = tomorrowForecast({ timelines: {
  hourly: [reading('2026-09-06T23:00:00Z'), reading('2026-09-07T01:00:00Z')],
  daily: [reading('2026-09-05T22:00:00Z', { temperatureMin: 24, temperatureMax: 30 }), reading('2026-09-06T22:00:00Z', { temperatureMin: 25, temperatureMax: 31, weatherCodeAvg: 1678, weatherCodeMax: 4001 })],
 } }, Date.parse('2026-09-07T00:00:00Z'));
 assert.equal(result.hourly.length, 1);
 assert.equal(result.daily.length, 1);
 assert.equal(result.daily[0].description, 'Rain');
 assert.equal(result.daily[0].high, 31);
 assert.match(weatherTime('2026-09-07T00:00:00Z'), /8:00/);
});

test('OpenWeather maps seconds, percentages and units without inventing UV or rain chance', () => {
 const row = openWeatherConditions({ dt: 1788739200, main: { temp: 28, feels_like: 31, humidity: 80, pressure: 1008 }, wind: { speed: 5 }, weather: [{ id: 500, description: 'light rain' }] });
 assert.equal(row.time, new Date(1788739200000).toISOString());
 assert.equal(row.windKmh, 18);
 assert.equal(row.rainChance, null);
 assert.equal(row.uvIndex, null);
 const next = openWeatherConditions({ dt: 1788739200, main: { temp: 28 }, pop: .35 });
 assert.equal(next.rainChance, 35);
});

async function withProviders(mock, run) {
 const oldFetch = global.fetch;
 const oldTomorrow = process.env.TOMORROW_API_KEY, oldOpen = process.env.OPENWEATHER_API_KEY;
 process.env.TOMORROW_API_KEY = 'private-tomorrow-test-key';
 process.env.OPENWEATHER_API_KEY = 'private-openweather-test-key';
 global.fetch = mock;
 delete require.cache[require.resolve('@/server/weather')];
 try { await run(require('@/server/weather')); }
 finally {
  global.fetch = oldFetch;
  for (const [key, value] of [['TOMORROW_API_KEY', oldTomorrow], ['OPENWEATHER_API_KEY', oldOpen]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
 }
}
const reply = data => new Response(JSON.stringify(data), { status: 200 });

test('server shares in-flight requests and caches results without exposing credentials', async () => {
 let calls = 0;
 const time = new Date(Date.now() + 3600000).toISOString();
 await withProviders(async url => {
  calls++;
  const request = new URL(url);
  assert.equal(request.searchParams.get('location'), '14.66651,120.96531');
  assert.equal(request.searchParams.get('units'), 'metric');
  return request.pathname.endsWith('realtime') ? reply({ data: reading(new Date().toISOString()) }) : reply({ timelines: { hourly: [reading(time)], daily: [] } });
 }, async ({ getWeather }) => {
  const [a, b] = await Promise.all([getWeather(), getWeather()]);
  assert.deepEqual(a, b);
  await getWeather();
  assert.equal(calls, 2);
  assert.equal(a.hourly.length, 1);
  assert.equal(a.intervalHours, 1);
  assert.doesNotMatch(JSON.stringify(a), /private-.*-test-key|apikey|appid/);
 });
});

test('rate-limited Tomorrow requests fall back to real OpenWeather with honest interval and daily availability', async () => {
 await withProviders(async url => {
  const request = new URL(url);
  if (request.hostname === 'api.tomorrow.io') return new Response('provider-specific secret error', { status: 429 });
  assert.equal(request.searchParams.get('lat'), '14.66651');
  const row = { dt: Math.round(Date.now() / 1000) + 3600, main: { temp: 29 }, pop: .4 };
  return request.pathname.endsWith('/forecast') ? reply({ list: [row] }) : reply(row);
 }, async ({ getWeather }) => {
  const data = await getWeather();
  assert.deepEqual(data.sources, ['OpenWeather']);
  assert.equal(data.intervalHours, 3);
  assert.equal(data.daily.length, 0);
  assert.equal(data.hourly[0].rainChance, 40);
  assert.match(data.notices.join(' '), /Daily forecasts are unavailable/);
 });
});

test('provider failures are sanitized and repeated failures are briefly cached', async () => {
 let calls = 0;
 await withProviders(async () => { calls++; throw new Error('https://provider.test/?apikey=PRIVATE'); }, async ({ getWeather }) => {
  await assert.rejects(getWeather(), error => !/PRIVATE|https:/.test(error.message) && /providers are unavailable/.test(error.message));
  const initialCalls = calls;
  await assert.rejects(getWeather(), /retry in a minute/);
  assert.equal(calls, initialCalls);
 });
});
