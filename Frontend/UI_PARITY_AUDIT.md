# REY presentation and V3.2 integration audit

> Weather update: current conditions and forecasts are now connected through the frontend Next.js server. See [WEATHER_INTEGRATION.md](WEATHER_INTEGRATION.md). Earlier weather-unavailable entries below describe the previous migration baseline.

This is a source-code audit for the current frontend migration, not a rendered visual acceptance report. `SmartFlood-V3.2rey` is the presentation reference; `SmartFlood-V3.2` remains the API, data, authentication, authorization, database, and AI authority. Backend access is locked for this task. This audit only created this document; it made no backend, database, environment, dependency, Git-index or Git-history changes.

The final asset comparison found 31 REY public assets: **26 byte-identical copies in the target, five excluded files, and zero differing copies**. The nine previously absent decorative/control/organization assets have been copied. Four sample emergency photos and one unreferenced map remain excluded. Copy status does not imply every decorative asset is rendered: unavailable weather uses neutral cloud artwork, and the reference inventory selector is not part of the current generation contract.

Final source inspection confirms the real notification presentation, unavailable weather presentation, actual-profile seals, local navigation subviews, CSWDD distribution landing/list/history and audit access, and barangay distribution/history navigation. The notification-to-allocation request is consumed after opening its selected record, and the barangay history card preserves its requested initial view. These are implemented code paths; authenticated runtime and rendered verification remain pending. See [MIGRATION_REPORT.md](MIGRATION_REPORT.md) for the implementation file list and actual automated validation results.

## 1. Complete public asset inventory

Paths are relative to each project's `Frontend/public/`. Consumer paths below are relative to REY `Frontend/src/`:

- **RP:** `components/relief/ReliefPanel/ReliefPanel.tsx` and its `.module.css`.
- **CR:** `components/relief/CswddReliefPanel/CswddReliefPanel.tsx` and its `.module.css`.
- **BR:** `components/relief/BarangayReliefPanel/BarangayReliefPanel.tsx` and its `.module.css`.
- **SB:** `components/layout/Sidebar/Sidebar.tsx` and its `.module.css`.
- **DP:** `components/dashboard/DashboardPanel/DashboardPanel.tsx` and its `.module.css`.
- **WF:** `components/weather/WeatherForecastPanel/WeatherForecastPanel.tsx` and its `.module.css`.
- **ER:** `components/emergency/EmergencyReportPanel/EmergencyReportPanel.tsx` and its `.module.css`.
- **MP:** `components/monitoring/MonitoringPanel/MonitoringPanel.tsx` and its `.module.css`.

All pixel sizes in the rendering column are CSS dimensions, not source-file dimensions. Source SVG view boxes and source raster dimensions must remain unchanged when copied. `object-fit` is recorded only where REY explicitly sets it.

| # | REY public path | Category / intrinsic size | Exact consumer and rendering | Target copy status / constraint |
| --- | --- | --- | --- | --- |
| 1 | `images/cswdd/arrow-down.svg` | Dropdown control; 22×22 SVG | RP:959, inventory barangay select; 22×22, absolute right 12/top 10, pointer-events none | Copied; byte-identical. Not currently rendered: the reference inventory selector has no corresponding generation request field. |
| 2 | `images/cswdd/close-square.svg` | Modal control; 36.6484×36.6667 SVG | RP:945,1021,1087, inventory/confirmation/report close buttons; image and button 44×44 | Copied; byte-identical. Applied to all three target close buttons with original callbacks/disabled guards. |
| 3 | `images/cswdd/cswdd-seal.png` | Organization seal; 225×225 | SB:16,55; access-group summary 36×36; profile 44×44; circular, cover | Copied; byte-identical. Applied to the CSWDD navigation group and actual CSWDD profile. No role impersonation. |
| 4 | `images/cswdd/distribution-list.svg` | Relief card icon; 32.3403×30.5448 SVG | CR:14; `.moduleIcon img` 44×44, contain, inside 82×82 tile | Already identical. |
| 5 | `images/cswdd/food-pack.svg` | Inventory quantity icon; 20.2675×19.7083 SVG | RP:869 summary 22×22; RP:901 history item 15×15; RP:969 inventory 22×22, contain | Already identical; label/count must use real food-pack field. |
| 6 | `images/cswdd/input-relief.svg` | Input-action icon; 19.3608×19.8333 SVG | RP:592,800; recommendation header/no-strategy action 22×22 | Already identical. |
| 7 | `images/cswdd/medicine-kit.svg` | Inventory quantity icon; 19.415×19.7358 SVG | RP:870 summary 22×22; RP:901 history item 15×15; RP:977 inventory 22×22, contain | Already identical; preserve existing inventory/response field mapping. |
| 8 | `images/cswdd/recommendation-history.svg` | Relief card icon; 39.4167×39.4167 SVG | CR:13; 44×44, contain, inside 82×82 tile | Already identical. |
| 9 | `images/cswdd/relief-goods.svg` | Inventory quantity icon; 19.0025×19.7106 SVG | RP:871 summary 22×22; RP:901 history item 15×15; RP:985 inventory 22×22, contain | Already identical; do not imply an individual-distribution API exists. |
| 10 | `images/cswdd/relief-recommendation.svg` | Relief card/no-strategy icon; 37.9866×39.4167 SVG | CR:12, 44×44 contain/82×82 tile; RP:791 no-strategy image 48×48 contain/88×88 tile | Already identical. |
| 11 | `images/cswdd/request-endorsement.svg` | Endorsement card icon; 40.5373×39.4167 SVG | CR:15; 44×44 contain/82×82 tile | Already identical; endorsement submission remains unsupported. |
| 12 | `images/dashboard/alert-level-icon.svg` | Monitoring card icon; 39.4131×37.2671 SVG | MP:904 module configuration; 44×44 inside monitoring module tile | Already identical. |
| 13 | `images/dashboard/barangay-longos-seal.png` | Organization seal; 553×553 | SB:23,57; group 36×36/profile 44×44, circular, cover | Copied; byte-identical. Profile mapping only for actual Longos identity. |
| 14 | `images/dashboard/barangay-map.png` | Static map raster; 1222×641 | No source-code reference found, including literal filenames and dynamic image families | Excluded: unused asset. Preserve real Leaflet maps. |
| 15 | `images/dashboard/barangay-potrero-seal.png` | Organization seal; 225×225 | SB:25,61; group 36×36/profile 44×44, circular, cover | Copied; byte-identical. Profile mapping only for actual Potrero identity. |
| 16 | `images/dashboard/barangay-tanong-seal.jpg` | Organization seal; 225×224 JPEG | SB:24,59; group 36×36/profile 44×44, circular, cover | Copied; byte-identical. Profile mapping only for actual Tañong identity. |
| 17 | `images/dashboard/relief-allocation.svg` | Barangay relief card icon; 39.4534×39.4167 SVG | BR:12,15; 44×44 inside 82×82 tile | Already identical; used by allocation and endorsement card presentation. |
| 18 | `images/dashboard/relief-distribution.svg` | Barangay relief card icon; 39.3524×39.4202 SVG | BR:13; 44×44 inside 82×82 tile | Already identical. |
| 19 | `images/dashboard/relief-history.svg` | Barangay relief card icon; 39.4167×39.4167 SVG | BR:14; 44×44 inside 82×82 tile | Already identical. |
| 20 | `images/dashboard/smartflood-logo.png` | Brand artwork; 1023×1537 | SB CSS:35; 50×50 background box, background-position 31% 47%, background-size 150% auto, no-repeat, overflow hidden | Already identical; preserve deliberate cropping rather than treating the whole raster as a square logo. |
| 21 | `images/emergency-reports/flood-aerial.png` | Sample incident photograph; 1200×799 | ER:104–105 dynamic `evidencePhotos`; main carousel height 330, width 100%, cover; thumbnail 80×56, cover | Excluded: sample evidence, not a resident upload. |
| 22 | `images/emergency-reports/flood-house.png` | Sample incident photograph; 534×374 | ER:104–105; same carousel and thumbnail treatment | Excluded: sample evidence. |
| 23 | `images/emergency-reports/flood-rescue.png` | Sample incident photograph; 638×480 | ER:104–105; same carousel and thumbnail treatment | Excluded: sample evidence. |
| 24 | `images/emergency-reports/flood-street.png` | Sample incident photograph; 826×371 | ER:104–105; same carousel and thumbnail treatment | Excluded: sample evidence. |
| 25 | `images/empty-states/no-results.svg` | Empty-state illustration; 174×174 SVG | `components/ui/EmptyState.tsx:20`; `StateBlocks.module.css` renders 150×150, opacity .78, margin-bottom 20 | Already identical. Caller-specific titles must remain truthful. |
| 26 | `images/login-background.png` | Decorative background; 1536×1024 | `components/login/LoginPage/LoginPage.module.css:2`; centered cover, no-repeat | Already identical. |
| 27 | `images/main-background.png` | Decorative application background; 1536×1024 | `components/layout/AppShell/AppShell.module.css:3`; centered cover, fixed, no-repeat | Already identical. |
| 28 | `images/weather/cloud-small.png` | Decorative weather graphic; 314×314 | DP:38 dynamic hourly list, 40×40; WF:3,12 dynamic hourly list, 60×60; contain | Copied; byte-identical. Used as faded decoration in the unavailable full forecast; no fake readings. |
| 29 | `images/weather/cloud.png` | Decorative weather graphic; 1254×1254 | DP:38 dynamic hourly list, 40×40; WF:3,12 dynamic hourly list, 60×60; contain | Already identical. Current target also uses it as an unavailable-weather decoration. |
| 30 | `images/weather/rain.png` | Decorative weather graphic; 314×314 | DP:29 current 72×72; DP:38 hourly 40×40; WF:11 current 132×132, 100×100 below 430px; WF:12 hourly 60×60; WF:13 daily 50×50; contain | Copied; byte-identical, not currently rendered. No weather API supports a live rainy-condition claim. |
| 31 | `images/weather/showers.png` | Decorative weather graphic; 1254×1254 | DP:38 hourly 40×40; WF:3–4,12–13 hourly 60×60/daily 50×50; contain | Copied; byte-identical, not currently rendered. No forecast readings are available. |

The complete reference scan also found dynamic QR image data URLs in `ReliefDistributionPanel`, Leaflet OpenStreetMap tile URLs in the two map components, Google Fonts' Source Sans Pro stylesheet, and inline/data-URI SVGs. These are not missing public files. A generated QR image must represent an existing supported route or beneficiary contract; it must not invent a resident-facing campaign redemption API. No external avatar image service or further public asset directory was referenced.

## 2. Inline icons and shared visual rules

`components/icons/SmartFloodIcon.tsx` and `SidebarIcon` in `components/navigation/NavLinkItem/NavLinkItem.tsx` are identical to the reference. Login's user/password/eye/error icons, monitoring's module/clipboard icons, residents' people/heart icons, StatCard's sensor/bell icons, the sidebar logout glyph, and the header bell use REY paths. Emergency report icons use the same paths with added `aria-hidden` attributes.

The `ClockIcon` hand path now includes REY's `strokeLinejoin="round"`. Relief distribution uses REY's Scan/Download/Search glyphs, and CSWDD uses its Clipboard/Clock/Refresh glyphs. Notification uses the reference mail/alert/relief/bell paths with accessibility attributes; the system-event gear is not rendered because system notification history is unavailable. The monitoring Download glyph opens the browser print dialog with report-specific print CSS. Distribution Calendar/Chevron controls appear in an unavailable date-filter popover; Pin is not used where there is no matching location control. No icon dependency was added.

Dimensions that affect the visual hierarchy include the sidebar 50px brand mark, 22px navigation glyphs, 36px group seals, 44px profile seals, 82px relief icon tiles containing 44px artwork, and 44px CSWDD modal close controls. Preserve source artwork and reference object fitting; do not stretch or replace custom icons with a generic set.

## 3. Complete frontend area and interaction matrix

Paths in this table are relative to `Frontend/src/`. **Source matched** means the implementation/reference was traced; it does not mean rendered visual parity has been verified. **Presentation work** denotes a UI change using current V3.2 data. **Missing capability** denotes unsupported behavior that remains unavailable. This table has been reconciled against the final source; remaining rendered and runtime checks are listed separately.

| REY area / components | Current V3.2 counterpart | Flow and data boundary | Audit disposition |
| --- | --- | --- | --- |
| `app/layout.tsx`, `app/globals.css`, `app/loading.tsx` | Same paths; loading CSS and Ripple | App typography/background, route loading and reduced-motion presentation; no API | Source matched; rendered typography/font availability pending. |
| `login/LoginPage` | Same component | Email/password → actual login → stored display profile → dashboard; show backend errors | Reference layout/icons adopted; preserve original submit validation/session behavior. |
| `layout/AppShell`, `Sidebar`, `Topbar`, `DashboardHeaderActions`; `navigation/NavLinkItem` | Same components, navigation/profile adapters and `DashboardPresentationContext` | Original permitted PageKeys, active state, mobile toggle, grouping, logout/profile, header navigation | Local notification/weather/incident presentation subviews and actual-profile seals are wired. Original route authorization remains; no REY admin-role impersonation. Header badge still represents V3.2 warning/severe sensors, not unread inbox count. |
| `dashboard/DashboardPanel`, `MapPanel` | Same components | Actual scoped sensors → totals/map/cards; selection, severe filter, sensor-history action and refresh | Keep V3.2 sensor controls even when absent from REY composition. Weather shell differs because live weather is absent. |
| `dashboard/SystemPulse` | Same component | Props-only display; `dashboardService.getSystemPulse/getDashboardStats` return empty arrays | Exists as a component; not a verified live pulse API and not a mounted REY dashboard section. Do not invent metrics. |
| `weather/WeatherForecastPanel` | New unavailable presentation, mounted through presentation context | Dashboard weather click → full current/hourly/daily structure → Back to prior view | Weather/forecast service and API are absent. Structure is implemented with neutral cloud decoration and explicit unavailable values; no sample dates/temperatures/conditions. |
| `monitoring/MonitoringPanel` landing | Same component | Module cards → heatmap/history/alert views → Back; preserve reset/navigation state | Existing functionality with changed presentation. Original role/module restrictions remain. |
| Monitoring `FloodHistory` | Internal component in same file | Sensors/history → date/group/sensor/barangay/status/search filters → table/chart → historical report modal | Presentation work supported by real history. Client filters act on API-returned rows; never claim server-wide totals beyond the returned dataset. The reference PDF control opens browser print/Save as PDF; it does not call a report API. |
| Monitoring `FloodHeatmap` and narrative report | Same file plus map components | Real readings/coordinates → map → narrative details/modal | Preserve original data thresholds, fallback semantics and report analysis; cosmetic hierarchy may change. |
| Monitoring `AlertLevelManagement` | Same file plus `alertActivityPresentation` | Existing thresholds and real current sensor alerts | Reference recent events are samples. Current sensor alerts are a snapshot, not an event history or notification inbox. |
| `map/SensorLeafletMap`, `FloodHeatmapMap`, `FloodVisualization` | Same components | Real sensor locations/readings → Leaflet layers and popups | Preserve geography, influence computation and status mapping; no static barangay-map replacement. |
| `sensors/SensorsPanel`, `hardware/HardwarePanel`, `hardware/ControlCard` | Same components | Real history/latest readings; HardwarePanel delegates to SensorsPanel | Existing functionality. Legacy hardware control cards do not establish device-control endpoints; hardware service returns null. |
| `app/sensor-simulator/page.tsx` | Same route | Existing simulator inputs → existing sensor simulation API | Preserve existing route and behavior; not exercised because it writes sensor data. |
| `relief/CswddReliefPanel` | `relief/ReliefPanel` landing and subviews | Recommendation/history/distribution/endorsement landing cards → real permitted V3.2 flows | Preserve reference composition without copying admin-role impersonation. Endorsement is a missing capability. |
| `relief/ReliefPanel` recommendation/inventory | Same controller | Input inventory → generate → choose actual strategy → approve/reject → notify barangays; new-allocation confirmation | Existing services and AI logic retained. REY's local inventory barangay selector is not part of V3.2 generation payload. |
| `relief/ReliefPanel` recommendation history/report | Same controller | Actual persisted recommendations → filters/table → report modal | Preserve real quantities, IDs and timestamps. REY-only approved-by/dispatched/status fields must not be fabricated. |
| `relief/CswddDistributionModule` | New distribution module with `distributionPresentation` adapter and original `AdminReliefAuditPanel` | Landing → list/history → actual campaign selector/refresh/server pagination; separate audit/coverage/export view | Implemented for super/CSWDD. Real family records and server totals retained. Individual records and barangay/date filters are explicitly unavailable; the service does not accept those history filters. |
| `relief/BarangayReliefPanel` | Same wrapper, dashboard distribution intent and one-use notification request | Allocation notification, distribution, distribution history and endorsement cards | Distribution/history cards now select the corresponding tab on the original route. Inbox requests open the selected allocation detail and are acknowledged/cleared. Resident incidents remain a separate presentation. |
| `emergency/EmergencyNotificationsPanel` | Same controller | List/search/paging → allocation detail → read/accept/reject/confirm receipt/notify family heads → refreshed data/result states | Existing notification/allocation services. Preserve rejected and receipt states and every original action guard. |
| `notifications/NotificationPanel` | New real-data component and `notificationPresentation` adapter | Header → actual list/search/All/Unread/Relief filters; barangay allocation opens existing detail/read controller; super/CSWDD navigates to campaign management | GET supports super/CSWDD/barangay; owning barangay alone performs read mutation. CDRRMO receives an unavailable inbox. Alert/System filters are disabled; Severe Sensors is a current reading summary, not historical notifications. |
| `emergency/ReliefManagementPanel` | Same component | Actual campaigns → start/expiry entry or close-reason modal → updated campaigns | Existing campaign lifecycle. No backend/status changes needed for visual migration. |
| `emergency/ReliefDistributionPanel` | Same controller with reference layout, tabs, Scan/Download/Search icons; super/CSWDD delegates to the distribution module | Campaign switch → identifier verification → confirmed receipt → history report/scanner link; initial history intent selects history tab | Existing two-step verification, duplicate protection, campaign readiness and role restrictions preserved. Actual scanner route/history report remain; REY QR dialog and date popover are present with explicit unavailable content and disabled unsupported controls; no QR is generated and no date filtering is simulated. |
| `emergency/ReliefDistributionPanel/AdminReliefAuditPanel` | Same component | Campaign switch → report summary/breakdown/received/not-received/beneficiary pages → export | Existing read/audit functionality; preserve backend pagination and all original information. |
| `app/dashboard/reliefDistribution/scan/page.tsx` | Same existing route | Campaign context → manually entered QR/family/resident identifier → verify/confirm | Manual entry is implemented. Camera scanning remains an explicitly labeled placeholder; no generated resident-redemption QR flow was added. |
| `emergency/EmergencyReportPanel` | Presentational shell, table, details, evidence carousel and typed view model | Main → Reports/History; status/search/count/pagination/detail presentation; future API callbacks | Missing resident-incident API. Real loader remains unavailable, with no sample rows/photos, fake statuses, read success or resolved confirmation. |
| `residents/ResidentsPanel` | Same controller, details and summary presentation | Scoped real residents/families → search/table → resident details/family details → permitted add/edit | Preserve actual resident/family IDs, vulnerability fields, validation and mutation behavior. Summary counts use real scoped collections. |
| `verification/VerificationPanel`, `ApplicationCard`, `ReviewModal` | Same components | Applications → filters/cards → detailed review → approve/reject → invalidate queries → result modal | Existing review API retained. Approved/rejected records remain viewable. Selected-family requirements and review payload cannot disappear behind simpler UI. |
| `verification/ApplicationFormModal` | Same component | Add/edit presentation with default values; close/cancel | Both sources contain a form without a save mutation handler. Backend POST application creation exists, but this modal is not an existing integrated save/edit/delete flow. Never report its placeholder buttons as verified persistence. |
| `logs/LogsPanel`, `logs/AccountManagement` | Same components | Account table/search/filter → create/edit/details/password/status actions → real refresh/results | Existing account APIs retained. No app-user DELETE route; the reference delete dialog is available with disabled confirmation and no DELETE request. The toolbar contains Reset, not REY's Export control; account CSV export is not implemented. |
| `logs/SystemLogs`, `logs/AuditLogs` | Same components | Actual audit events → scope/filter/page → event detail | Preserve source actor/module/target/timestamps and existing visibility filtering. AuditLogs is an alternate existing component, not an additional API. |
| `ui/Modal`, `ModalShell`, `ActionResultModal` | Same primitives | Overlay/Escape/close, focus/scroll behavior, success/error presentation | All consumers must keep real completion/error timing; modal style does not establish a new action. |
| `ui/Button`, `Badge`, `DataTable`, `Pagination`, `Tabs`, `StatCard`, `ModuleCard` | Same primitives | Callbacks, keyboard activation, selected/disabled state and real page metadata | Presentation-only changes; preserve original pagination windows/server totals rather than REY's simplified page buttons. |
| `ui/EmptyState`, `LoadingState`, `ErrorState`, `Ripple`; `providers/QueryProvider` | Same primitives/provider | Data-state presentation and existing cache behavior | No fake delay or success state. Existing query keys, invalidation and provider settings remain authoritative. |

## 4. Modal, drawer and completion-flow inventory

The source search covered `<Modal>`, `<ModalShell>`, `<ActionResultModal>`, `<ReviewModal>`, `<ApplicationFormModal>`, dialog roles and open-state declarations. The following are the actual reference flows rather than inferred dialogs from button labels.

| REY consumer / identifier | Target treatment | Integration constraint |
| --- | --- | --- |
| Monitoring `historical-report-title` | Historical report modal on real history | Keep real filter context and original analysis; browser print opens without reporting a fabricated download result. |
| Monitoring `narrative-report-title` | Existing narrative modal with browser print control | Preserve threshold/analysis content; source data can be absent. |
| Relief `generate-relief-title` | Existing generation modal with reference inventory layout and close artwork | Generate only through existing inventory payload/service; real in-flight/error state. |
| Relief `new-relief-allocation-title` | Existing new-allocation confirmation | Retain close-current-campaign behavior and draft/approval separation; do not rename it into a different business action. |
| Relief report modal and `ActionResultModal` | Existing report/result displays | Success after service completion; errors stay errors; real quantity/ID/time fields. |
| Emergency allocation `emergency-allocation-title` | Existing allocation details | All read/accept/reject/receipt/family-notification actions stay server-authorized. |
| Campaign `close-campaign-title` | Existing close-reason modal | Existing closure reason request and lifecycle guards. |
| Distribution `relief-campaign-switcher-title` | Existing campaign switcher with reference presentation | Switches actual campaign IDs and retains active/not-ready/historical groups and read-only distinctions. |
| Admin audit campaign switcher | Existing audit switcher | Selection affects actual reports/pagination and cannot grant distribution-write permission. |
| Distribution `relief-qr-title` | Reference dialog with unavailable QR content and disabled download; actual Open QR Scanner route remains | No generated campaign QR or resident redemption API. Camera on the scanner route remains a placeholder; manual verification works through existing services. |
| Distribution date popover | Reference popover opens/closes on barangay history with disabled date/apply controls; CSWDD date/barangay controls are also disabled | Existing history service accepts campaign/page/limit, not these filters. No scheduled delivery date is inferred from campaign/verification times. |
| Emergency `emergency-report-detail-title` and photo viewer | Typed presentational details/carousel exist | Cannot open a fabricated record. Needs real report/photo URLs and authorized update callbacks before production use. |
| Emergency status toast | Presentational confirmed-update state | Must come from confirmed API result; not a timer/local status transition. |
| Residents add/edit dialog | Existing form with reference styling | Required fields, actual barangay scope and family-selection rules retained. |
| Residents details and family details dialogs | Existing real loaded-record presentation | Real IDs, actual head/member relationships, no guessed demographics/confirmation fields. |
| Verification `review-title` | Existing review modal | Same approve/reject payload and selected-family requirement; review details retained. |
| Verification `application-title` | Existing form shell | Not an integrated save/edit/delete flow; see matrix above. |
| Accounts `account-form-title` | Existing create/edit form | Actual field names, validation, permissions and POST/PATCH preserved. |
| Accounts `account-preview-title` | Existing details presentation | Existing password/status/edit controls retained even if reference hides them. |
| Accounts `password-title` | Existing password dialog | Existing `new_password` PATCH contract. |
| Accounts `delete-account-title` | Reference dialog with unavailable explanation and disabled Confirm; Cancel returns to the existing edit form | No app-user DELETE endpoint; status disable/block remains the actual supported behavior. |
| Logs `log-preview-title` | Existing event details | Do not invent actor/session/IP metadata. |
| Shared action-result dialogs in relief/residents/review/accounts | Existing callers, reference visuals | Preserve caller-specific backend error and completion conditions. |
| Sidebar profile popover and mobile navigation | Existing profile controls, reference shell, actual seal adapter and local subviews | Real identity and permitted routes retained; opening a group does not change effective role. Catmon/unmatched profiles retain actual initials. |

## 5. Actual service → API → backend → persistence traces

These are source-verified contracts, not successful live HTTP requests. Browser, signed-in session, deployed databases, bucket contents and production services were not inspected. A table name in repository code proves a code reference, not the presence or configuration of that table in a deployed Supabase project.

The existing `Frontend/next.config.ts` rewrites `/api/:path*` to the configured API origin. `services/apiClient.ts` retains JSON envelope/error handling and timeout behavior: `fetchJson` unwraps `data`, while `fetchEnvelope` preserves envelope fields. API failures must not be converted into successful empty records by presentation adapters.

| UI / service or existing caller | Existing endpoint and request | Backend implementation | Actual data source / response constraint |
| --- | --- | --- | --- |
| LoginPage → `fetchJson`; Sidebar logout | `POST /api/auth/login` `{email,password}`; `POST /api/auth/logout` | `Backend/api/src/app/api/auth/{login,logout}/route.ts`; `lib/dashboardSession.ts`, `appUserMapping.ts`, `auditLogger.ts` | Supabase `app_users`; audit writes `audit_logs`. Signed `smartflood_dashboard_session` cookie; existing local stored user is frontend display/navigation context. |
| Dashboard/Header/Monitoring/Sensors → `sensorsService.getSensors` | `GET /api/sensors/latest` | `app/api/sensors/latest/route.ts`; `dashboardViewer`, `mongodb`, `sensorMapping`, `sensorScope` | **MongoDB** `sensors` and `sensor_readings`; session lookup in Supabase `app_users`. Preserve `sensorId`, `waterLevelM`, `computedStatus`, `latestReadingAt`, coordinates and nullable readings. |
| Monitoring/history → `floodService.getSensorHistory/getFloodMonitoringData` | `GET /api/sensors/history?limit=100`; backend also accepts `sensorId`,`barangay` | `app/api/sensors/history/route.ts`; same scope/mapping helpers | MongoDB sensors/readings; history IDs/timestamps preserved. Backend limit defaults 100/max 500 and applies per sensor without a sensor-specific query; this is not a server pagination envelope. |
| Existing sensor simulator → direct fetch | `POST /api/sensors/simulate` existing sensors payload | `app/api/sensors/simulate/route.ts` | MongoDB sensor collections; writes were not executed for the UI audit. |
| Residents → `residentsService.getResidents/getFamilies` | `GET /api/residents`; `GET /api/families?search=...` | Corresponding routes; `dashboardViewer`, `barangayScope` | Supabase `residents_v3`, `families`; preserve `resident_id`,`family_id`, real barangay fields and head/member semantics. |
| Residents form → existing `fetchJson` caller | `POST /api/residents`; `PATCH /api/residents/[id]`, original `buildResidentPayload` plus audit actor | Resident routes; `residentPayload`, `barangayScope`, `dashboardViewer`, `auditLogger` | `residents_v3`, `families`, `audit_logs`. Existing backend DELETE resident route also exists, but is not app-user deletion or an incident API. |
| Verification → `verificationService.getVerificationApplications`; review `fetchJson` | `GET /api/resident-applications`; `PATCH /api/resident-applications/[id]/review` `{action,admin_review_notes,selected_family_id?}` plus audit actor | Corresponding routes; `residentPayload`, `auditLogger` | `resident_applications`; approval can create/link `residents_v3` and `families`; audit events. `action` is `approved`/`rejected`, not incident response status. |
| Accounts → `logsService.getAccountUsers`; existing create/edit/password/status callers | `GET/POST /api/app-users`; `PATCH /api/app-users/[id]`; `PATCH .../password` `{new_password}`; `PATCH .../status` existing status/lock fields | App-user routes; `appUserMapping`, password hashing and audit helper | `app_users`, `barangays`, `audit_logs`. Preserve separate first/last names, role ID, barangay ID, mobile/email fields and status. No app-user DELETE route found. |
| Logs → `logsService.getAuditLogs` | `GET /api/logs?limit=300` | `app/api/logs/route.ts`; `dashboardViewer`, `logVisibility` | `audit_logs`; existing server and frontend visibility behavior retained. Original GET limit is not a promise of a complete global log history. |
| Relief → `reliefService.getReliefInventory/saveReliefInventory` | `GET/POST /api/relief/inventory`; supply fields `family_food_packs`,`medicine_kits`,`relief_goods_individual` plus existing audit fields | `app/api/relief/inventory/route.ts` | `relief_inventory`, `audit_logs`; no resident photo storage. |
| Relief → `getReliefRecommendations/generateReliefRecommendations` | `GET /api/ai/recommendations`; `POST .../generate` supply fields plus audit actor | GET reads Supabase; generation route calls configured AI backend `/api/ai/recommendations/generate`; `Backend/ai/app/main.py`, `engine.py`, `repositories.py` | Existing AI reads Mongo sensors/readings and Supabase families; recommendation history is `ai_recommendations`. Generation returns actual plans; it is not approval. Existing 60-second client generation timeout stays. |
| Relief → `approveReliefRecommendationPlan/rejectReliefRecommendationPlan` | `POST /api/ai/recommendations/{approve,reject}` `{plan}` plus audit actor | Corresponding API routes; `emergencyWorkflow.ts`; approval delegates to actual AI approval then creates workflow batch/items | Supabase `ai_recommendations`, `emergency_allocation_batches`, `emergency_allocation_items`, `audit_logs`. Approved plan IDs/quantities map to persisted rows; duplicate/validation behavior stays. |
| Relief → `getCurrentEmergencyAllocation/notifyBarangaysForEmergencyAllocation` | `GET /api/emergency/allocation/current`; `POST /api/emergency/allocations/[batchId]/notify-barangays` | Current/allocation routes; `emergencyCampaigns` and existing viewer rules | `emergency_allocation_batches`, `emergency_allocation_items`, `notifications`, audit events. API-authorized super/CSWDD workflow, not a resident incident dispatch action. |
| Notification header/panel and allocation panel → `getEmergencyNotifications` | `GET /api/emergency/notifications` | `app/api/emergency/notifications/route.ts`; `getDashboardViewer`, `assignedBarangayForUser`, `attachAllocationDetails` | `notifications` filtered to `target_type=barangay`; joins allocation items/batches. Envelope contains `{notifications}`. Barangay scoped to assigned ID; super/CSWDD can read; CDRRMO rejected. |
| Notification panel → one-use allocation-open request → existing `EmergencyNotificationsPanel.markEmergencyNotificationRead` caller | `PATCH /api/emergency/notifications/[notificationId]/read`, no invented JSON body | Corresponding route; owning-barangay check and audit | `notifications`, `audit_logs`. Only barangay users can mutate. Pending/sent → read; already read/accepted/rejected responses are handled without reclassifying accepted/rejected. Request is acknowledged after the matching detail is opened. |
| Allocation panel → `acceptEmergencyAllocationItem/rejectEmergencyAllocationItem/confirmEmergencyAllocationReceipt/notifyFamilyHeadsForEmergencyAllocation` | `POST /api/emergency/allocation-items/[itemId]/{accept,reject,confirm-receipt,notify-family-heads}` | Corresponding routes; viewer/barangay checks; campaign readiness reconciliation on family notifications | Allocation items/batches, notifications; family-head lookup uses `families` and `residents_v3`; audit events. These are relief receipt states, never Pending/En Route/Arrived incident statuses. |
| Relief management/distribution → `getReliefCampaignHistory/startReliefCampaign/closeReliefCampaign` | `GET /api/emergency/campaigns/history`; `POST .../[batchId]/start` `{expires_at}`; `POST .../[batchId]/close` `{closure_reason}` | Campaign routes and `emergencyCampaigns.ts` | `emergency_allocation_batches`, `emergency_allocation_items`, `relief_distributions`, audit events. Original accepted/notified/in-distribution/completed/expired/closed statuses remain authoritative. |
| Distribution/scanner → `verifyReliefDistribution/confirmReliefDistribution` | `POST /api/emergency/distribution/verify` `{batchId,identifier}`; `POST .../confirm` `{batchId,identifier,allocation_item_id:null-or-ID}` | Routes → `emergencyDistribution.resolveDistributionContext`; confirmation inserts distribution only after validation | `families`, `residents_v3`, allocation items/batches, `relief_distributions`; viewer from `app_users`, audit. Barangay only, correct scope, active campaign and distribution-ready item required. Preserve `ELIGIBLE`, duplicate, invalid/wrong-barangay/inactive/unauthorized results. |
| Distribution/audit → `getReliefDistributionHistory/getReliefDistributionReport/getReliefNotReceived/getReliefBeneficiaryStatus` | `GET .../distribution/history?batch_id=&page=&limit=`; `report?batchId=`; `not-received?batchId=&page=&limit=`; `beneficiary-status?batchId=&filter=&search=&page=&limit=` | Routes → `emergencyDistribution.ts` / `emergencyReports.ts` and campaign/access helpers | `relief_distributions`, `families`, `notifications`, allocation items/batches, verifier `app_users`. Preserve `batch_id` versus `batchId`, actual distribution IDs/timestamps, and `{page,limit,total,totalPages}` server metadata. |
| Distribution/audit export → `reliefDistributionExportUrl`; scanner link → `reliefDistributionScannerUrl` | `GET /api/emergency/distribution/export?batchId=...`; browser route `/dashboard/reliefDistribution/scan?batchId=...` | Export route uses existing report/access helpers and workbook output; scanner is a frontend route | Actual distribution/report rows. The existing route does not establish a public resident campaign-redemption API. |
| Resident emergency reports | **No current V3.2 incident service/API found** | No repository reference to `emergency_reports`, `emergency-report-images`, `image_paths` or Storage upload calls in the scanned production paths | User's proposed table/bucket remain unverified requirements. `Backend/api/src/lib/emergencyReports.ts` is a relief-distribution report helper, not resident incident persistence. |

Existing dashboard authentication uses a signed HttpOnly cookie, 12-hour duration, SameSite Strict, and Secure in production. `getDashboardViewer` resolves an active `app_users` row; emergency routes enforce their own role and assigned-barangay checks. Frontend navigation uses the existing role configuration. This audit does not assert that every legacy route has identical guard coverage; those existing contracts and guard patterns were not changed by UI migration.

## 6. Required missing capabilities and typed boundaries

Resident incidents require a separately approved contract for report creation/list/detail/history, resident identity and ownership, barangay authorization, validated photo upload/retrieval, server-side status transitions, resident confirmation and audit metadata. No route, migration or bucket was created here. The proposed 1–5 photos/2 MB each and `resident-ID/report-ID/image-ID.jpg` storage layout must be enforced by that future backend, not simulated by the presentation.

The current EmergencyReport view model can render real data later, but `Pending → En Route → Arrived → Resolved` has no implemented incident backend. `Arrived` must not become `Resolved` because a frontend timer or local click fires. Photo URLs must come from authorized report data; the four reference photographs remain excluded.

Weather/forecast, relief-request endorsement, separate individual-distribution records, app-user deletion, and any public resident redemption flow need their own confirmed capability or must remain unavailable. A backend POST resident-application route exists, but the old application form shell has no integrated save/edit/delete controller; do not conflate route existence with complete UI integration.

Typed frontend adapters preserve ID strings, missing timestamps, actual status meaning and server pagination. `adapters/navigationPresentation.ts` groups permitted destinations; `adapters/alertActivityPresentation.ts` renders current sensor alerts; `adapters/notificationPresentation.ts` maps actual notification IDs, pending/sent unread state and allocation source/category; `adapters/profilePresentation.ts` maps only actual role/barangay identities to seals; `components/relief/CswddDistributionModule/distributionPresentation.ts` formats actual distribution IDs, family/head names, status and verified timestamps. It does not split full names or fabricate times/record IDs.

```text
REY component structure, artwork, styling and interactions
                         ↓
V3.2 presentation component + typed adapter
                         ↓
V3.2 controller/query state + existing services
                         ↓
Existing /api rewrite and API routes
                         ↓
Existing authentication / scope / business rules
                         ↓
Supabase tables and MongoDB sensor collections

Future resident incident UI
                         ↓
Explicit unavailable state until a separately approved incident API exists
                         ↓
Future server-side incident workflow → incident repository + authorized Storage
```

## 7. Visual and runtime acceptance still pending

No browser is connected to this session. This audit performed no screenshots, no rendered comparison, no authenticated end-to-end workflow, and no live API/database request. Passing a build or a source comparison cannot establish visual parity.

| Viewport comparison | Status | Required checks on both applications |
| --- | --- | --- |
| Large desktop, e.g. 1920px | Pending | Shell/sidebar/header relationship, full card grids, max-widths, tables, map, modal placement. |
| Desktop, e.g. 1440px | Pending | Navigation/seals/icons, page hierarchy, spacing/type/color/borders/shadows, modal sizes. |
| Laptop, e.g. 1280px | Pending | Sidebar width and content constraints, relief grid wraps, weather rows, table overflow. |
| Tablet, e.g. 768px | Pending | Navigation collapse, container padding, card columns, scroll boundaries, modal viewport fit. |
| Mobile, e.g. 390px | Pending | Toggle and focus order, overflow, tables, status tabs, dialogs/carousel and touch controls. |

Also compare boundary widths around REY's sidebar 900px, relief 680/1200px, weather 430/760/1100px, and dashboard statistic 680/1120px breakpoints. Check reduced-motion behavior, visible keyboard focus, Escape/close, actual loading/error/empty states, long real names/IDs, and data with missing timestamps/photos.

Source tracing found deliberate functional differences that cannot disappear to obtain screenshot similarity: V3.2-only permitted controls stay visible; unauthorized reference groups cannot grant access; absent forecast/incident/endorsement data stays unavailable; backend pagination and actual IDs/times remain intact; unsupported delete/save/QR behavior cannot report success. These are integration constraints, not a claim that all other presentation differences are acceptable.

Final source reconciliation and the 26-file asset byte comparison are complete. Rendered comparison, authenticated API flows and deployed data behavior still require verification when a browser/session is available. The exact implementation files, protected-file audit and actual automated test/build output are recorded separately in `MIGRATION_REPORT.md`.
