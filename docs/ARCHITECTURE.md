# Architecture / 架构

The application ships as one self-contained HTML file. Development sources share a manifest (`scripts/source-list.cjs`); the builder embeds versioned data and scripts and checks syntax, credentials patterns and byte identity of the two release files. No runtime package installation is required for a user.

## Layers

1. `calendar/`: civil clock fields, explicit offsets, lunar conversion, terms, longitude and unknown-time intervals.
2. `bazi/`: four pillars, scoring and explicit school profiles. Geography's traditional associations are separate from physical coordinates.
3. `ziwei/`, `qimen/`, `liuyao/`, `hehun/`: separate computation declarations and inputs; UI adapters collect values and render outputs. These legacy algorithms are software implementations, not independently verified classical authorities.
4. `api/chart.js` and `lib/index.cjs`: JSON-only contract, calculation, comparison, debug, batch and declarative scoring packs. The Node entry loads no UI, storage or network layer.
5. `knowledge/`, `ai/`: sourced/unverified knowledge records, prompts, validation and transport; model output is interpretation and cannot overwrite engine facts.
6. `storage/` and `ui/`: local records, presentation, user controls and explicit network actions.

Global declarations are intentionally assembled in manifest order into one script. Function declarations may reference later modules; top-level initializers must only read earlier initialized values. Browser initialization is last. This is a gradual source split, not a claim that every legacy presentation function has already been redesigned.

## Validation

`npm test` checks original and new pure APIs; `npm run test:e2e` checks actual controls and all six chart modules. `npm run lint` rejects undefined references, unreachable code and new unused-variable warnings. Historical unused local-variable warnings are recorded in `tests/fixtures/lint-baseline.json`; `verification/lint.json` reports the current count; they are not presented as a clean lint suite. Changing the baseline requires an explicit review, not automatic CI acceptance.

Frozen historical chart expectations are retained in `tests/fixtures/`. Reports identify independent reference comparisons, internal consistency, software regression and synthetic model fixtures separately. Actual model calls require an operator's endpoint/key; no live model quality result is inferred from fixtures.

Module rules have independent versions: Ziwei5.26.0, Qimen/Liuyao/Hehun5.27.0 and core Bazi5.20.0. The comprehensive view delegates Qimen/Liuyao to their engines rather than rebuilding plates in presentation. `ui/module-workspaces.js` only reads engine facts and manages accessible drill-down views. Paired storage validates/whitelists nested birth inputs independently of UI fields.
