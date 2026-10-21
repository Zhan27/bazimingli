# Frontend references and original implementation

Reviewed2026-10-21. This redesign uses original HTML/CSS/JS and retains this repository's calculations, input IDs and record schema. No third-party code, screenshots, logos, fonts or other assets were copied into the application.

| Reference | Checked evidence | Interaction ideas considered | License boundary |
| --- | --- | --- | --- |
| [hkargc/bazi](https://github.com/hkargc/bazi) | README, actual browser interface, `LICENSE` | Compact four-pillar data, keeping calculation facts and comparison close to inputs | MIT file verified, copyright2026 hkargc; no source copied |
| [sorenHoult/taro-bazi](https://github.com/sorenHoult/taro-bazi) | README and LICENSE | Mobile-oriented input flow and explicit prompt-copy affordance | MIT; no code/assets copied |
| [xizhilanre/xizhilanrezw](https://github.com/xizhilanre/xizhilanrezw) | README, live linked site and navigation | Separate chart modules and learning/knowledge entry | README declares MIT but root LICENSE returned404; used only as an interaction reference, no source reuse |

## Design

An editorial study workbench: dark jade navigation, warm paper content, a small vermilion seal, Song-style titles and restrained five-element colors. The desktop layout puts birth input beside the actual chart; narrow screens stack them with a six-module navigation grid. Four pillars lead the result, time assumptions remain available, and dense rule tables and traditional narrative panels can be opened in professional view.

The default learning view does not change calculations or delete content. Its visibility state is a local preference. All original fields remain available under “排盘设置”; existing local records and backups keep their schema. New example data are synthetic. The knowledge catalog marks old source claims as pending rather than asserting verified ancient quotations. AI settings and actual network behavior remain separate from local chart calculation.

Verification covers original browser regressions plus view switching, original pillar equality, mobile page overflow, dark theme, search without data mutation, glossary search, focus trapping/restoration and keyboard module navigation. Screenshots are generated from the running application by browser tests, not design mockups.
