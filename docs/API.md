# JSON engine API 1.0

```js
const engine = require('./lib/index.cjs');
const input = {date:'2024-02-10', time:'12:00', gender:1, place:'北京',
  options:{utcOffsetMinutes:480,dstMinutes:0,dayBoundary:'zi-chu',trueSolar:false,schoolId:0}};
const chart = engine.calculateChart(input);
const diff = engine.compareChartFacts(chart, engine.calculateChart({...input,time:'23:00'}));
const schools = engine.compareSchools(input);
const debug = engine.calendarDebug(input);
const graph = engine.chartEvidenceGraph(chart);
const zw = engine.calculateModule('ziwei',{...input,referenceYear:2024});
const qm = engine.calculateModule('qimen',input);
const ly = engine.calculateModule('liuyao',{...input,mode:1,numStr:'1 2 3'});
```

Input `date` is a Gregorian wall-clock date; use explicit UTC standard offset and optional manual DST. `gender` is 0/1 for legacy directional rules. Defaults are UTC+8, no DST, school0, 23:00 boundary and 12:00 **only for developer convenience**; supply `unknownTime:true` for a real unknown birth time, which returns candidate intervals rather than a definite chart. `hourIdx` without `time` requests the documented hour midpoint. Do not silently use defaults for incomplete personal records.

Output includes `schemaVersion`, untouched input facts, versioned rules, actual `instantUtc`, named civil clock strings, four named pillars and hidden stems, lunar date, five-element count convention, strength contributions, competing use-god rules, DaYun and provenance. Clock strings intentionally have no `Z`; only the actual UTC instant does. Serialize the result directly with `JSON.stringify`.

`calculateModule` accepts `ziwei`, `qimen`, `liuyao`; specify `referenceYear` for repeatable Ziwei annual annotations. These modules currently use UTC+8 clock fields; their API does not claim the main chart's offset options. Liuyao `mode` 0=time,1=three numbers,2=six coin counts; `yaoSeq` is six integers0..3. Hehun `comparePair(left,right)` returns both factual charts and traditional comparison; its index is a subjective rule score, not calibrated relationship prediction.

`batchCalculate(inputs)` is bounded to1000 rows, returns per-row success/error without stopping the rest. CLI: `node scripts/batch.cjs authorized-input.json output.json`; output must not already exist. It performs no network calls and leaves inputs in place. Use synthetic or explicitly authorized local data.

## Declarative scoring packs

`validateRulePack({id:'custom-example',version:'1',strength:{...}})` accepts only finite bounded month/root/momentum weights and strictly increasing thresholds with the documented `STRENGTH_RULES` shape. Pass as `calculateChart(input,{rulePack})`. The pack is copied and frozen, does not execute code, does not change shared defaults, and the result records the pack's id/version. These are custom **scoring** packages; arbitrary astronomy or executable plugins are not supported.

Errors use TypeError/RangeError with explanations. Supported Gregorian range remains1900-01-31..2099-12-31 after time correction. No API needs DOM, localStorage or a network connection.

## Additive study and offline comparison views

`chartStudyFacts(chart)` returns detailed pillars, natal day-xun void flags, position-aware relations and eight DaYun periods with ten annual entries each. `chartStudyMonths(chart, year)` returns twelve Jie-month intervals with exact Beijing clock boundaries for1900..2099, including the final interval ending at next year's LiChun. These views do not change the original chart JSON or AI identity. Main qi is marked; secondary qi categories/weights are not inferred from array order.

`createStudySnapshot(chart)` wraps the original chart and study facts as `format: 'bazimingli-study', formatVersion: 1`. `compareReferenceChart(chart, savedJSON)` compares supported provided fields, keeps missing fields and spelling-alias markers, and discloses unspecified clock conventions and unequal DaYun coverage. It performs no network requests. See [reference materials and comparison limits](REFERENCE-MATERIALS.md) for CLI usage, supported shapes and the single supplied sample's bounded result.
