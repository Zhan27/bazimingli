# Changelog

## 5.22.1 — 2026-10-22
- Added independent, DOM-free study facts, per-pillar natal day-xun void flags, position-aware relationships, ten annual entries per DaYun period and exact Beijing-clock Jie-month intervals. Existing calculation rules, chart schema and AI identity remain unchanged.
- Added bounded offline JSON comparison adapters and a non-overwriting CLI. Keeps missing fields, explicit name aliases, unspecified time conventions and unequal DaYun coverage visible; no third-party service calls.
- Documented how the user-supplied reference archive informed feature selection. Included only a derived single-sample comparison report; no captured third-party code, assets, credentials or probe tools.

## 5.22.0 — 2026-10-22
- Replaced the clipped, overlapping Gan-Zhi diagram with separate stem/branch sections and one smooth connection rail per relation. Labels, guide columns and solid/dashed styles keep dense relationships readable without arrows over characters or a crowded legend.
- Added relationship-type and individual-pillar filters, pinned/keyboard highlights, reset, accessible descriptions and the offline glossary. Responsive rails fit mobile screens and all three themes.
- Fixed presentation endpoint resolution for repeated branches: self-punishment connects each named pillar, while three-member groups include every matching occurrence without drawing duplicate closed loops.
- Kept relationship calculation results and calculation rule version5.20.0 unchanged. Added endpoint/filter regressions and desktop/mobile/dark/repeated-branch screenshots using synthetic fixtures.

## 5.21.0 — 2026-10-22
- Added a unified five-category record manager with search, module filters, deterministic sorting, bounded notes, reload, selected export and batch deletion/clear. Recalculation preserves notes; category+ID identity prevents cross-module collisions.
- Added v6-selection merge backups so selected exports preserve unselected records on import. Earlier versions reject this format; full v4/v5 backup behavior remains compatible. Multi-category failures attempt rollback and disclose rollback failures.
- Completed individual AI-card collapse, copy and JSON export with fact/source references and validation status, excluding full birth inputs/API settings.
- Added separate GitHub issue forms for bugs, calculation differences, features and documentation. No issues or third-party messages were posted.
- Kept calculation rule version5.20.0 for this UI/storage release, preserving compatible chart identities and AI drafts; application version advances independently.
- Embedded the package version in the built HTML and footer independently of the calculation-rule version, making issue reports and downloaded artifacts identifiable.

## 5.20.0 — 2026-10-22
- Integrated JSON-first18-dimension AI cards with optional provider JSON Schema and explicitly unverified Markdown compatibility. Displays conclusions, computed fact references, source status, uncertainty, alternatives and requested-model/prompt/rule/time metadata.
- Added explicit cancellation, a bounded recent-chart tab-session draft, local restore/revalidation, per-card regeneration and missing-dimension retries. Invalid replies preserve accepted cards; chart changes stop old work and stale responses cannot fill a new chart. No automatic paid retries.
- Removed AI score replacement and forced wealth/education/numerical life-score instructions. Collapsed legacy heuristic grading behind an uncalibrated-demo notice; calculation outputs remain unchanged.
- Kept legacy server-template mode compatible with full Markdown; blocks unsupported JSON/subset requests before contacting a provider. Source changes do not redeploy existing Workers.
- Added pure attempt-state tests, browser workflow tests and six versioned synthetic contract/fault fixtures with a CI evaluation report. These are protocol/regression checks, not live-model or predictive-accuracy experiments.

## 5.19.2 — 2026-10-21
- Fixed Chinese console output on English Windows/Python cp1252 streams; all logging after server binding now remains inside the cleanup boundary.
- Added an explicit cp1252 regression test. This supersedes the unpublished5.19.1 tag whose Windows release gate caught the encoding failure; the older tag is retained unchanged.

## 5.19.1 — 2026-10-21
- Resumed unfinished roadmap after frontend delivery. Default new API keys to tab-session storage, migrate unmarked legacy settings, preserve explicit persistence choices and retain keys in page memory if storage is unavailable.
- Added offline privacy disclosure and accurate AI relay/provider data-transfer and browser-session restoration information.
- Hardened optional Worker source with exact origin/model allowlists, bounded UTF-8 bodies/messages/tokens, HTTPS/no redirects, cancellable total upstream timeout, bounded streaming responses and sanitized uncached errors.
- Added bounded isolate-local code/IP quotas and documented their distributed-limit boundary. Existing deployed Workers were not redeployed.
- Added nine Node and one browser regression tests using synthetic data/mocked providers; no paid model requests.
- Fixed desktop bind races by binding preferred ports directly, warned when a changed origin hides previous records, restricted both GET/HEAD paths, and closed the server on window/browser startup failure. Added four Python loopback/lifecycle tests to both CI workflows.
- Added an English getting-started/international birth-time guide with explicit timezone/DST, location coverage, privacy and validation boundaries; the interface remains Chinese.

## 5.19.0 — 2026-10-21
- Redesigned the frontend as a jade-and-paper study workbench with persistent module navigation, side-by-side desktop entry/chart and stacked mobile layout.
- Brought four pillars before dense narrative sections; added learning/professional views and collapsible time assumptions/settings without changing chart calculation.
- Added a synthetic example, focus-managed help/glossary dialogs, source-status lookup, local-record search, keyboard navigation and print layout.
- Preserved original inputs, local records, backups, six chart modules and single-file offline operation. Added desktop/mobile/dark screenshots and four browser regression cases.
- Long-term roadmap work beyond the finished API/AI foundation is paused at the user's request. No live model evaluation, optional Worker redeployment or unfinished advanced features are claimed complete.

## 5.18.1 — 2026-10-21
- Added pure18-dimension JSON contracts, versioned school prompts and source-status catalog, with explicit error categories.
- Replaced shared AI transport to support final SSE frames, bounded replies, cancellation and provider JSON responses without automatic paid retries.
- Added synthetic contract and mocked transport tests. Wider AI workflow work is paused at the user's request while frontend improvements take priority; see `docs/AI-CONTRACT.md`.

## 5.18.0 — 2026-10-21 (incremental work)
- Added the worldwide traditional-culture learning introduction and Codex development attribution.
- Separated Ziwei, Qimen, Liuyao and Hehun calculations and terminology data from page rendering.
- Added a DOM-free Node JSON engine, per-module entry, chart/school comparisons, evidence graph, calendar debug, bounded local batch processing and declarative scoring packs.
- Added static checks and a disclosed baseline for40 legacy unused local variables. Fixed the missing `nowLiuNian` helper detected by undefined-name checks.
- Remaining roadmap work is delivered in subsequent commits; completion evidence will be listed in `ACCEPTANCE-21-96.md`.

## 5.17.0
Explicit timezone/day rules, unknown-time candidates, sourced city coordinates, count/scoring conventions, school configuration and full historical regression. See `ACCEPTANCE-11-20.md`.
