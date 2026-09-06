# Frontend presentation migration

> Weather update: current conditions and forecasts are now connected through the frontend Next.js server. See [WEATHER_INTEGRATION.md](WEATHER_INTEGRATION.md). Earlier weather-unavailable entries below describe the previous migration baseline.

Implemented against V3.2 commit `d58926c`, using V3.2rey commit `7bc3be6` as the presentation reference. The target's existing APIs, services, permissions, and business workflows remain the functional authority.

**Status:** the additional source fidelity pass and automated checks are complete; the migration has **not yet passed rendered visual acceptance**. Visual acceptance at desktop/tablet/mobile sizes and authenticated end-to-end workflows remain unverified because the browser runtime reported `No browser is available` and returned an empty browser list. This report does not claim pixel parity or successful live business transactions.

## Baseline and protected contracts

Before editing, the frontend TypeScript check passed. The target had an unrelated, untracked root `package-lock.json`; the reference had a modified `Frontend/next-env.d.ts`. Both were left untouched. Build-generated changes to the target's `next-env.d.ts` were restored after validation.

The following were compared with SHA-256 hashes recorded before implementation:

| Protected area | Files checked | Changed |
| --- | ---: | ---: |
| Backend code/configuration, excluding environment files, dependencies and generated output | 102 | 0 |
| Supabase migrations | 4 | 0 |
| Frontend services | 10 | 0 |
| Existing frontend types | 11 | 0 |
| Frontend library helpers | 14 | 0 |
| Frontend data/navigation definitions | 9 | 0 |

Backend access remained locked under the repository instructions. No backend, database, AI, environment, package manifest, dependency lockfile, proxy, authentication helper, authorization helper, or role mapping was changed. No dependencies were installed. No commits, branches, deployments, or database operations were performed.

The dashboard page has presentation-only wiring changes: it passes the existing normalized role to the shell, passes its existing guarded navigation callback to relief cards, and renders the barangay relief landing wrapper around the existing notifications controller. Its hash parser, route keys, navigation handler, session effects, and allowed-page checks are unchanged. `reliefDistribution` continues to open relief distribution/audit functionality. The scanner remains `/dashboard/reliefDistribution/scan?batchId=…`; the manual verification and confirmation flow is unchanged.

Existing service files are unchanged: `apiClient.ts`, `dashboardService.ts`, `emergencyService.ts`, `floodService.ts`, `hardwareService.ts`, `logsService.ts`, `reliefService.ts`, `residentsService.ts`, `sensorsService.ts`, and `verificationService.ts`.

The inspected API families retain their existing paths, methods, parameters, payloads, and response handling:

- Login/logout and dashboard session handling.
- Account list/create, profile update, password update, and status update. No account DELETE call was added.
- Resident list/create/update/delete, family lookup, resident applications, and application review.
- Sensor latest/history/simulation and audit logs.
- Inventory, AI recommendations, generation, approval, and rejection.
- Emergency relief allocation/current, notification/read, barangay notification, allocation accept/reject, physical receipt, and family-head notification.
- Campaign history/start/close, distribution verify/confirm/history/report/not-received/beneficiary-status/export.

The earlier source-fidelity AST comparison found the direct `fetch` request unchanged after ignoring source formatting. The existing `POST /api/auth/logout` request and session cleanup moved from the header into the sidebar profile area. The audit matched 155 named functions without JSX against the original source; the two differences were the relocated logout function and the recommendation-history display mapper that stops inventing missing IDs/dates. These are source checks, not live API transaction tests.

## Presentation changes

- Source Sans Pro, reference backgrounds, translucent shell/sidebar, rounded cards, blue accents, shadows, spacing, navigation icons, hover/focus styling, and responsive layouts.
- Reference login composition, with the original submit handler, email validation, autocomplete, password visibility, and session behavior retained.
- REY Home/navigation labels, flat CSWDD/barangay navigation, super-user expandable route groups, original reference brand dimensions, and sidebar profile/logout presentation. Groups are formed only from the original role-authorized navigation items. No client-side organization impersonation or fabricated barangay scope was introduced.
- Shared modal appearance, optional backdrop styling, result dialogs, statistic icons, compact pagination styling, search-empty illustration, route loading screen, and ripple loading indicator. Reduced-motion users receive a static ripple.
- Dashboard composition now includes the reference six weather metric slots, eight hourly forecast slots, exact reference card grids/breakpoints, and map presentation plus the existing sensor cards, severe-only selection, sensor navigation, sensor focus, polling, and pagination. Weather slots explicitly show unavailable states without fake readings or forecast times.
- Monitoring module cards, heatmap, charts, reference narrative-dialog sections, collapsible history filters, current-alert cards, and history tables. Existing date ranges, custom dates, grouping, sensor/level/barangay/search filters, summaries, reset, and refresh remain available.
- Full four-card CSWDD relief landing and four-card barangay relief landing. Recommendation/history and allocation views keep their existing controllers mounted while switching local sections; distribution cards use the existing guarded `reliefDistribution` navigation. Endorsement shows the reference tab/filter composition with unavailable data controls. State remains in the same controller when switching sections. Existing AI generation, inventory validation, strategy selection, acceptance/rejection, active-campaign confirmation, and notification logic remain intact.
- Relief notification cards and allocation dialog, including visible rejection and allocation quantities. Campaign management, distribution, audit tables, scanner, exports, readiness messages, beneficiary filters, summaries, and campaign switching remain available.
- Resident tables, forms, family details, and a resident details modal using already-loaded records. Pagination sits outside the cards as in REY; row ID cells use actual resident/family identifiers instead of generated row numbers. Authorized add/edit actions remain visible. Resident/family counts and registered family-head counts use the loaded scoped data; loading/error states do not claim zero records.
- Registration cards, tabs, search, and the full reference review-modal structure: compact header, personal/location field grids, submission readouts, and review notes. Reviewed applications retain View access; occupation, household, medical/special-needs, reviewer, time, and notes remain visible. Review request bodies and awaited cache refreshes are unchanged.
- Account forms, reference single-column preview/create layouts, edit controls, password/status actions, and log presentation. The account table uses the reference six-column hierarchy with the real last-login field in place of prototype activity claims; log tables use the reference actor-first order. Existing name/email/mobile/address/sex/status/role fields, independent password confirmation, filters, reset, and log previews remain available.

## Data adaptation

`src/adapters/navigationPresentation.ts` groups already-authorized `NavItem` objects without modifying original navigation definitions, keys, destinations, or role membership. Labels/icons are adapted separately for presentation. The current normalized role is passed from the existing dashboard session; no role is inferred from an account name.

`src/adapters/alertActivityPresentation.ts` maps the existing scoped `getSensors()` result into current-alert display rows. It uses V3.2's existing flood-status helpers, excludes absent/invalid water readings, and includes timestamps only when supplied and valid. The panel is labelled **Current Sensor Alerts**, because the endpoint provides current sensor readings rather than an alert-event history. The previous hardcoded activity examples were removed.

`src/components/monitoring/MonitoringPanel/historyPresentation.ts` describes the already-filtered sensor-history records in the reference narrative layout. It computes actual measured minima/maxima and the span of supplied timestamps, without inferring flood duration or resident impact.

`EmergencyReportPresentation`, `EmergencyReportDetails`, and `EvidenceCarousel` accept presentation-only models/props. They do not define or call an API. Table records, status totals, server pagination, selected details, authorized photo URLs, and persisted update acknowledgements must be supplied by a future approved controller. Local carousel selection does not mutate report status.

The existing recommendation-history display mapper now shows `Not recorded` for missing identifiers/timestamps instead of manufacturing an identifier or using today's date. Its API input shape and service remain unchanged. Existing recommendation quantities retain their original meaning; they are not relabelled as dispatched goods.

## Final UI parity and integration pass

The complete source inventory, all 31 asset entries, component and modal matrix, 22 service/API/backend/persistence traces, and five-viewport acceptance checklist are in [UI_PARITY_AUDIT.md](UI_PARITY_AUDIT.md).

- **Navigation and flows:** new local presentation context connects the notification bell, dashboard weather cards, and a separate Emergency Report Management sidebar button. Original `PageKey` values, guarded navigation and hash routes remain unchanged. A one-use notification request opens an actual allocation via the original controller, is acknowledged, and cannot replay on a later visit. Distribution/history cards preserve their requested initial tab. Actual session role/barangay chooses profile seals; no identity is inferred from display names.
- **Assets:** 26 of REY's 31 public assets are byte-identical in the target. This pass added nine seal/weather/control assets; four sample incident photos and the unused static map remain excluded. The relief dialogs use REY's actual close-square artwork. Inline notification, distribution, clock, download and account trash glyphs use the reference paths.
- **Data integration:** NotificationPanel calls unchanged `getEmergencyNotifications` and `getSensors` services. Its adapter preserves notification IDs and pending/sent unread semantics; CDRRMO cannot expose cached inbox records. CSWDD list/history uses unchanged campaign/history services and real server pagination. Its adapter preserves actual distribution IDs, families, barangays, statuses and verification timestamps. Unsupported individual receipt/date/barangay filters show unavailable states.
- **Dialogs and print:** reference campaign QR and date popovers are present with unsupported controls disabled; the existing scanner/manual verification remains available. The account delete dialog has no DELETE request or success state. Both monitoring report headers use REY's `window.print()` interaction with print CSS isolating the report; PDF saving depends on the browser's print dialog, and printed output has not been visually verified. The existing `lib/pdfReport.ts` and relief history export helper remain unchanged.
- **Remaining mismatches:** no rendered page comparison has been possible. Known functional constraints change navigation groups, unavailable data, retained V3.2 controls, and table columns/metadata. Account CSV export and the legacy application form save/edit/delete controller are not implemented; the application's supported account and resident-review actions remain available. Neither full pixel parity nor authenticated end-to-end success is claimed.

Additional typed boundaries are `adapters/notificationPresentation.ts`, `adapters/profilePresentation.ts`, and `components/relief/CswddDistributionModule/distributionPresentation.ts`. The existing navigation, alert and monitoring history presentation adapters remain. New component families are `notifications/NotificationPanel`, `weather/WeatherForecastPanel`, `relief/CswddDistributionModule`, and the local `layout/DashboardPresentationContext`.

## Intentionally blocked prototype features

| Reference capability | Implemented presentation | Missing capability / reason blocked |
| --- | --- | --- |
| Resident emergency reports | Separate sidebar presentation destination; complete reference landing, status tabs, search, table columns, history, controlled details modal, evidence carousel, and update/confirmation presentation. The connected screen remains unavailable | No resident emergency-report service, API route, table reference, or storage integration exists in the inspected V3.2 source. No sample records, guessed totals, or successful submissions are presented. |
| Pending → En Route → Arrived | Status presentation only | Requires an approved server contract, authorized status transitions, persistence, audit behavior, and concurrent-update handling. No local status mutation was added. |
| Resident confirmation / Resolved / Emergency History | Explicit unavailable history state | Requires resident authentication mapping, report ownership checks, confirmation semantics, persistence, and history query rules. |
| Report details and photo carousel | Complete controlled modal/carousel components; real record/photo binding deferred | Requires authorized report details, resident lookup projection, and authorized photo URLs. Complete components exist, including image failure states, but no live detail can be opened while the controller is unavailable. No flood evidence sample images were copied. |
| Weather and hourly forecast | Dashboard cards open the complete reference current/hourly/seven-day forecast layout, with unavailable messages and decorative cloud artwork | No V3.2 weather service/API exists. No forecast readings, dates, or conditions were fabricated. Navigation is local presentation state and preserves original hash routes. |
| General notification inbox | Header opens REY notification layout backed by the existing scoped relief notification API | Alert/system event history remains unavailable. GET is enabled only for super/CSWDD/barangay. Barangay clicks open the existing allocation controller and its read mutation; super/CSWDD clicks navigate to campaign management. |
| Resident relief request endorsement / individual distribution | Reference endorsement tabs/filters and unavailable state; no persistence or individual distribution | No matching request/endorsement or individual-beneficiary workflow in the inspected backend. Existing family distribution remains unchanged. |
| Account deletion / inferred account activity / emailed credentials | Reference delete dialog opens with unavailable content and a disabled confirmation; no deletion or email action | No account DELETE route or email-delivery workflow. Last login is not evidence of a password change. |
| Campaign QR generation / camera decoding | Reference QR dialog opens with unavailable content and disabled download; original scanner entry remains | Reference campaign QR JSON is incompatible with the existing identifier parser; QR generation also adds an unapproved dependency. Camera capture is separate prototype functionality. Existing scanner/manual identifier entry remains. |

### Required emergency-report integration work

The supplied table and bucket description remains a proposed integration specification, not proof of live schema. Live Supabase was not inspected. No API signatures or migrations were invented or implemented.

Before enabling reports, a separately approved backend change must establish:

1. The real mobile/resident identity and its mapping to `residents_v3.resident_id`.
2. Validated report submission: location, optional description, 1–5 photos, maximum 2 MB per photo, allowed content types, and server-generated report/image identifiers.
3. Verified existence and access policies for `public.emergency_reports` and `emergency-report-images`; storage path ownership under `resident-ID/report-ID/image-ID.jpg`.
4. Upload/insertion failure handling and cleanup, with persisted image paths returned through an approved response contract.
5. Authorized report list/detail queries, resident name/contact projection, barangay scope, search, ordering, and server pagination totals.
6. Authorized status transitions and resident-owned resolution confirmation, with timestamp and audit semantics.
7. Authorized image retrieval, expiration/error handling where applicable, and real history filtering.

The intended boundary remains:

```text
Presentation components
  ↓ props / callbacks
Frontend controller and typed display adapter
  ↓
Existing service for existing features
  OR separately approved report service for resident incidents
  ↓
Existing API contracts / separately approved incident contract
  ↓
Server authentication, authorization and business rules
  ├─ Database repository: records and image-path references
  └─ Storage adapter: photo validation, upload, retrieval and cleanup
```

The existing `emergencyService.ts` and backend `emergencyReports.ts` continue to serve relief workflows. They were not repurposed for resident incidents. Browser components do not access Supabase directly.

## Validation and limitations

- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: passed, exit 0.
- `node tests/presentation.test.cjs`: **16 tests, 16 passed, 0 failed**. Tests exercise role navigation preservation, middle-page/server-total pagination, single-page behavior, empty-state text/action preservation, keyboard card activation, real-reading display mapping, reviewed-application View access, explicit emergency unavailability, suppression of unavailable records/totals, status-callback gating, supplied-photo carousel presentation, history-narrative data integrity, actual-profile seal selection, notification ID/read/category mapping, role-restricted cached-inbox rendering, and distribution identity/status/timestamp mapping.
- `npm run build`: passed. Final output included `Compiled successfully`, `Finished TypeScript`, and `Generating static pages (6/6)`. The original five page routes remain: `/`, `/_not-found`, `/dashboard`, `/dashboard/reliefDistribution/scan`, `/sensor-simulator`.
- The sandbox denied spawned Node processes with `EPERM`, causing Next.js's misleading `Could not parse output from TypeScript's --showConfig` error. Allowing child-process execution for the frontend build resolved it without changing project configuration or dependencies.
- `npm run lint`: unavailable under the existing tooling. It runs `next lint`, which the installed Next.js version interprets as a directory and rejects. The existing script and dependencies were left unchanged.
- `git diff --check`: passed. Protected hashes, component imports, static CSS class references, and referenced image assets were checked. No referenced image asset was missing.
- The build still reports the pre-existing multiple-lockfile workspace-root warning. The unrelated root lockfile was preserved.
- Desktop/tablet/mobile breakpoints and overflow rules were inspected and adapted in source. No browser screenshots or interactive layout comparison were possible. Visual parity remains unverified.
- No authenticated API mutations, live database checks, mobile submissions, or end-to-end dispatch/distribution transactions were run. Source preservation and component tests do not substitute for those checks.
- The reference's Google Fonts stylesheet requires browser network access; fallback system fonts remain configured.

## Deliberate differences from V3.2rey

Flat navigation follows REY for CSWDD/barangay roles. Super-user groups contain only existing permitted routes; unsupported per-barangay command-center impersonation is not copied. A group labelled Barangay Services does not claim a selected geographic scope. V3.2-only Sensor History and relief campaign/audit routes remain reachable. The real alert count is retained beside REY's notification icon, and profile details have moved into the sidebar. Barangay distribution/history cards open their corresponding tabs within V3.2's existing distribution route. Super/CSWDD distribution uses REY's landing/list/history presentation and keeps the original audit and coverage controls accessible. Catmon remains Catmon; no ID was renamed to Longos. All V3.2-only controls remain available in the reference visual language. Server pagination totals, account fields, report labels, current sensor readings, and relief quantities retain their real meanings. Unsupported screens show unavailable states or remain deferred. The third resident statistic shows family heads instead of summing overlapping vulnerability categories and implying a unique-person count.

Browser discovery was retried for this final requirement and again returned an empty list. No rendered comparison is claimed. Before accepting visual completion, compare both projects at approximately 1440 px desktop, 1280 px laptop, 1024/768 px tablet, and 390 px mobile widths. Verify sidebar expansion, scrollable tables, form fields/actions, modal overflow, filters, and each authorized role. Exercise existing workflows in an authorized test environment, including reject allocation, resident editing, review history, campaign switching, scanner verify/confirm, exports, and AI active-campaign confirmation.

## Exact changed files

107 frontend files: 55 existing files changed; 52 files added. The user subsequently authorized publishing as SmartFlood-V3.3; the root README title, overview and documentation links were updated for that repository. The pre-existing untracked root lockfile and reference-project change are excluded.

- `README.md` (repository publication metadata)
- `Frontend/MIGRATION_REPORT.md` (new)
- `Frontend/UI_PARITY_AUDIT.md` (new)
- `Frontend/public/images/cswdd/arrow-down.svg` (new)
- `Frontend/public/images/cswdd/close-square.svg` (new)
- `Frontend/public/images/cswdd/cswdd-seal.png` (new)
- `Frontend/public/images/cswdd/distribution-list.svg` (new)
- `Frontend/public/images/cswdd/food-pack.svg` (new)
- `Frontend/public/images/cswdd/input-relief.svg` (new)
- `Frontend/public/images/cswdd/medicine-kit.svg` (new)
- `Frontend/public/images/cswdd/recommendation-history.svg` (new)
- `Frontend/public/images/cswdd/relief-goods.svg` (new)
- `Frontend/public/images/cswdd/relief-recommendation.svg` (new)
- `Frontend/public/images/cswdd/request-endorsement.svg` (new)
- `Frontend/public/images/dashboard/alert-level-icon.svg` (new)
- `Frontend/public/images/dashboard/barangay-longos-seal.png` (new)
- `Frontend/public/images/dashboard/barangay-potrero-seal.png` (new)
- `Frontend/public/images/dashboard/barangay-tanong-seal.jpg` (new)
- `Frontend/public/images/dashboard/relief-allocation.svg` (new)
- `Frontend/public/images/dashboard/relief-distribution.svg` (new)
- `Frontend/public/images/dashboard/relief-history.svg` (new)
- `Frontend/public/images/dashboard/smartflood-logo.png` (new)
- `Frontend/public/images/empty-states/no-results.svg` (new)
- `Frontend/public/images/login-background.png` (new)
- `Frontend/public/images/main-background.png` (new)
- `Frontend/public/images/weather/cloud-small.png` (new)
- `Frontend/public/images/weather/cloud.png` (new)
- `Frontend/public/images/weather/rain.png` (new)
- `Frontend/public/images/weather/showers.png` (new)
- `Frontend/src/adapters/alertActivityPresentation.ts` (new)
- `Frontend/src/adapters/navigationPresentation.ts` (new)
- `Frontend/src/adapters/notificationPresentation.ts` (new)
- `Frontend/src/adapters/profilePresentation.ts` (new)
- `Frontend/src/app/dashboard/page.tsx`
- `Frontend/src/app/dashboard/reliefDistribution/scan/scanner.module.css`
- `Frontend/src/app/globals.css`
- `Frontend/src/app/loading.module.css` (new)
- `Frontend/src/app/loading.tsx` (new)
- `Frontend/src/components/dashboard/DashboardPanel/DashboardPanel.module.css`
- `Frontend/src/components/dashboard/DashboardPanel/DashboardPanel.tsx`
- `Frontend/src/components/dashboard/MapPanel/MapPanel.module.css`
- `Frontend/src/components/dashboard/MapPanel/MapPanel.tsx`
- `Frontend/src/components/emergency/EmergencyNotificationsPanel/EmergencyNotificationsPanel.module.css`
- `Frontend/src/components/emergency/EmergencyNotificationsPanel/EmergencyNotificationsPanel.tsx`
- `Frontend/src/components/emergency/EmergencyReportPanel/EmergencyReportPanel.module.css` (new)
- `Frontend/src/components/emergency/EmergencyReportPanel/EmergencyReportPanel.tsx` (new)
- `Frontend/src/components/emergency/ReliefDistributionPanel/ReliefDistributionPanel.module.css`
- `Frontend/src/components/emergency/ReliefDistributionPanel/ReliefDistributionPanel.tsx`
- `Frontend/src/components/emergency/ReliefManagementPanel/ReliefManagementPanel.module.css`
- `Frontend/src/components/layout/AppShell/AppShell.module.css`
- `Frontend/src/components/layout/AppShell/AppShell.tsx`
- `Frontend/src/components/layout/DashboardHeaderActions/DashboardHeaderActions.module.css`
- `Frontend/src/components/layout/DashboardHeaderActions/DashboardHeaderActions.tsx`
- `Frontend/src/components/layout/DashboardPresentationContext.tsx` (new)
- `Frontend/src/components/layout/Sidebar/Sidebar.module.css`
- `Frontend/src/components/layout/Sidebar/Sidebar.tsx`
- `Frontend/src/components/layout/Topbar/Topbar.module.css`
- `Frontend/src/components/layout/Topbar/Topbar.tsx`
- `Frontend/src/components/login/LoginPage/LoginPage.module.css`
- `Frontend/src/components/login/LoginPage/LoginPage.tsx`
- `Frontend/src/components/logs/AccountManagement/AccountManagement.module.css`
- `Frontend/src/components/logs/AccountManagement/AccountManagement.tsx`
- `Frontend/src/components/logs/LogsPanel/LogsPanel.module.css`
- `Frontend/src/components/logs/LogsPanel/LogsPanel.tsx`
- `Frontend/src/components/logs/SystemLogs/SystemLogs.module.css`
- `Frontend/src/components/logs/SystemLogs/SystemLogs.tsx`
- `Frontend/src/components/monitoring/MonitoringPanel/MonitoringPanel.module.css`
- `Frontend/src/components/monitoring/MonitoringPanel/MonitoringPanel.tsx`
- `Frontend/src/components/monitoring/MonitoringPanel/historyPresentation.ts` (new)
- `Frontend/src/components/navigation/NavLinkItem/NavLinkItem.module.css`
- `Frontend/src/components/navigation/NavLinkItem/NavLinkItem.tsx`
- `Frontend/src/components/notifications/NotificationPanel/NotificationPanel.module.css` (new)
- `Frontend/src/components/notifications/NotificationPanel/NotificationPanel.tsx` (new)
- `Frontend/src/components/relief/BarangayReliefPanel/BarangayReliefPanel.module.css` (new)
- `Frontend/src/components/relief/BarangayReliefPanel/BarangayReliefPanel.tsx` (new)
- `Frontend/src/components/relief/CswddDistributionModule/CswddDistributionModule.module.css` (new)
- `Frontend/src/components/relief/CswddDistributionModule/CswddDistributionModule.tsx` (new)
- `Frontend/src/components/relief/CswddDistributionModule/distributionPresentation.ts` (new)
- `Frontend/src/components/relief/ReliefEndorsement/ReliefEndorsement.module.css` (new)
- `Frontend/src/components/relief/ReliefEndorsement/ReliefEndorsement.tsx` (new)
- `Frontend/src/components/relief/ReliefPanel/ReliefPanel.module.css`
- `Frontend/src/components/relief/ReliefPanel/ReliefPanel.tsx`
- `Frontend/src/components/residents/ResidentsPanel/ResidentsPanel.module.css`
- `Frontend/src/components/residents/ResidentsPanel/ResidentsPanel.tsx`
- `Frontend/src/components/sensors/SensorsPanel/SensorsPanel.module.css`
- `Frontend/src/components/ui/ActionResultModal.module.css`
- `Frontend/src/components/ui/ActionResultModal.tsx`
- `Frontend/src/components/ui/EmptyState.tsx`
- `Frontend/src/components/ui/LoadingState.tsx`
- `Frontend/src/components/ui/Modal/Modal.module.css`
- `Frontend/src/components/ui/Modal/Modal.tsx`
- `Frontend/src/components/ui/Pagination/Pagination.module.css`
- `Frontend/src/components/ui/Pagination/Pagination.tsx`
- `Frontend/src/components/ui/Ripple.module.css` (new)
- `Frontend/src/components/ui/Ripple.tsx` (new)
- `Frontend/src/components/ui/StatCard/StatCard.module.css`
- `Frontend/src/components/ui/StatCard/StatCard.tsx`
- `Frontend/src/components/ui/StateBlocks.module.css`
- `Frontend/src/components/ui/Tabs/Tabs.tsx`
- `Frontend/src/components/verification/ApplicationCard/ApplicationCard.module.css`
- `Frontend/src/components/verification/ApplicationCard/ApplicationCard.tsx`
- `Frontend/src/components/verification/ReviewModal/ReviewModal.module.css`
- `Frontend/src/components/verification/ReviewModal/ReviewModal.tsx`
- `Frontend/src/components/verification/VerificationPanel/VerificationPanel.module.css`
- `Frontend/src/components/verification/VerificationPanel/VerificationPanel.tsx`
- `Frontend/src/components/weather/WeatherForecastPanel/WeatherForecastPanel.module.css` (new)
- `Frontend/src/components/weather/WeatherForecastPanel/WeatherForecastPanel.tsx` (new)
- `Frontend/tests/presentation.test.cjs` (new)
