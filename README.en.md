# Xuanji: traditional Chinese calendrical charts

[中文说明](README.md) · [Open the workbench](https://zhan27.github.io/bazimingli/docs/) · [Downloads](https://github.com/Zhan27/bazimingli/releases/latest)

This project provides calculation references and learning tools for people around the world interested in Chinese traditional culture, Bazi (Four Pillars), and related traditions. OpenAI Codex assists with code writing and revision, data organization and statistics, tests, and documentation. Traditional interpretations are cultural references; their real-world predictive accuracy has not been established by this project's software tests.

The interface is currently Chinese. This guide explains the main workflow and international birth-time settings; it does not claim full interface translation.

## Run it

- Online: open the workbench above.
- Offline: download `mingli-paipan.html` from a Release and open it in a browser. Calculation and built-in reference data are included; optional AI needs a configured network service.
- Windows x64: download `mingli-paipan.exe`. The native window requires a working WebView2 runtime. Source scripts can also fall back to a system browser when pywebview is unavailable. Native macOS/Linux packages are not currently provided.

Use the same browser and origin to access saved records. The desktop launcher prefers `127.0.0.1:8765` and binds another port if occupied. A different port, a downloaded file, and the online site have separate browser storage. A blank record list at another origin does not mean the original records were deleted. Export a backup before changing your setup.

## First chart

1. Choose **八字排盘** (Bazi). Use **试用示例** for a synthetic example, or enter your birth information.
2. Choose **公历** (Gregorian) or **农历** (Chinese lunar), enter date and time, and confirm the location. The supported Gregorian range is 1900-01-31 through 2099-12-31; time corrections can move an input beyond those bounds.
3. Open **排盘设置** for time offset, manual daylight saving, true solar time, day boundary and school. Defaults are UTC+8 and no daylight saving. Confirm these explicitly for births outside that setting.
4. Read the year/month/day/hour pillars first, then hidden stems and five-element counts. **学习** is the simpler reading view; **专业** exposes more settings and traditional commentary. Switching the view preserves the calculated chart.
5. Use **术语小辞典** to search terms and their source status. Unverified quotations remain learning leads, not verified original passages.

| Chinese label | Meaning |
|---|---|
| 四柱 / 年月日时 | Four pillars / year, month, day, hour |
| 天干 / 地支 / 藏干 | Heavenly stems / earthly branches / hidden stems |
| 五行 / 十神 | Five elements / ten relational categories |
| 旺衰 / 用神 | Rule-based strength classification / preferred element interpretation |
| 大运 / 流年 | Traditional decadal cycles / annual annotations |
| 时辰不确定 | Birth time unknown: show candidates rather than invent an hour |
| 子初 / 子正换日 | Day rollover at 23:00 / 00:00 |

## Births outside mainland China

Enter the birth location's **standard UTC offset** and, separately, a manual DST adjustment of 0 or 60 minutes. For example, a New York birth during a period when standard UTC−5 and one hour of daylight saving both applied uses offset −300 minutes plus DST +60. Confirm the actual historical rule for the date; the application does not look it up. Countries with different historical transitions or non-hour DST need independently checked input preparation.

The city database currently covers mainland China, Hong Kong, Macao and Taiwan; it is not a worldwide city database. With true solar time enabled, an unsupported location requires an explicit longitude such as `-74.006°` (west negative, east positive), within −180° to +180°. Choose a specific city when a name is ambiguous. Approximate coordinates and equation-of-time calculations can matter near day/hour/solar-term boundaries.

Choosing an unknown birth time displays candidate intervals and stable/changing pillars. Do not replace unknown information with the developer API's convenience defaults. Other traditional modules still have their own legacy input/time conventions; the main Bazi offset settings should not be assumed to apply to all modules. See [API conventions](docs/API.md).

## Privacy, records and optional AI

The footer's **统一记录管理** opens one manager for the five existing stores (main Bazi, the Bazi module, Ziwei, Qimen and Liuyao). Search, category filters, sorting and notes are available. Selected backups use `v6-selection` and merge into the corresponding stores, preserving unselected IDs; older versions reject that format. Full v4/v5 backups retain replacement semantics for included categories. AI cards support collapse/copy/single-card JSON export. See [record/backup semantics](docs/RECORDS.md).

Calculations run on your device. Online hosting still receives normal webpage access information. The project has no added analytics or automatic chart upload feature. Names, birth dates, locations and saved records may be personal information; avoid real names when unnecessary.

API keys default to tab-session storage. Browser session restoration can retain session storage. Long-term storage requires explicitly clearing the session-only checkbox; previously explicit persistence choices are preserved. Browser storage is not encrypted. If storage is unavailable, the key stays in the current page's memory. Use **清除 Key** in AI settings when finished.

When you explicitly request AI analysis, chart data and supplied personal information are sent to your configured API address. A relay operator and upstream model provider may receive them. Connection tests also send a request and can incur provider usage. Review that service's data-retention and pricing policies before using it. No AI service is needed to calculate a chart or extract a prompt for manual use.

Backups exclude API settings but contain chart records. Copied summaries/prompts, exported images and backups can contain birth information. Deleting local records does not delete exported files, clipboard content, or data retained by a service provider. The offline **隐私与数据** dialog explains storage and deletion. Optional Worker operators should read its [configuration and limits](worker/README.md), especially origin allowlists and the limit of isolate-local quotas.

## Development and evidence

Use Node.js 22+ and Python 3.12+:

```bash
npm ci
npx playwright install chromium
npm run build
npm run verify
```

Edit `src/` and `data/`; the build generates matching `命理排盘.html` and `docs/index.html`. Node tests cover algorithms/contracts/security, browser tests exercise the actual page, and Python tests exercise the real loopback server with mocked native-window failures. Frozen chart cases and independent astronomical software comparisons are regression/reference checks, not empirical validation of fortune-telling or every native GUI environment.

The DOM-free [JSON engine API](docs/API.md) supports calculation, comparisons, evidence references and bounded local batches. The AI UI supports structured JSON cards, explicit Markdown compatibility, cancellation, a recent-chart session draft and per-card/missing-dimension retries. Retries require an explicit user action and can incur provider usage. Structural/reference checks do not verify free prose; real cross-model evaluations remain unfinished. The legacy server-template route supports full Markdown only. See [AI workflow boundaries](docs/AI-CONTRACT.md), [current progress](PROGRESS-21-96.md) and [release procedure](docs/RELEASING.md).

Code is MIT licensed. Embedded libraries and GeoNames-derived city data have their own attribution requirements; see [third-party notices](THIRD_PARTY_NOTICES.md). Contributions should include reproducible input, expected/actual behavior, evidence sources and tests, and must not commit credentials or private birth records.
