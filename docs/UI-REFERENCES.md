# Frontend references and original implementation

Reviewed2026-10-21. This redesign uses original HTML/CSS/JS and retains this repository's calculations, input IDs and record schema. No third-party code, screenshots, logos, fonts or other assets were copied into the application.

| Reference | Checked evidence | Interaction ideas considered | License boundary |
| --- | --- | --- | --- |
| [hkargc/bazi](https://github.com/hkargc/bazi) | README, actual browser interface, `LICENSE` | Compact four-pillar data, keeping calculation facts and comparison close to inputs | MIT file verified, copyright2026 hkargc; no source copied |
| [sorenHoult/taro-bazi](https://github.com/sorenHoult/taro-bazi) | README and LICENSE | Mobile-oriented input flow and explicit prompt-copy affordance | MIT; no code/assets copied |
| [xizhilanre/xizhilanrezw](https://github.com/xizhilanre/xizhilanrezw) | README, live linked site and navigation | Separate chart modules and learning/knowledge entry | README declares MIT but root LICENSE returned404; used only as an interaction reference, no source reuse |

## Design

The2026-10-22 user-approved revision uses pale paper and muted jade, narrow navigation, Song-style headings and restrained five-element colors. An aligned compact table brings pillar facts, hidden-stem ten-gods, NaYin, twelve stages, void flags and month command together; element counts and DaYun overview follow. The complete original cards, weights, flow diagrams and use-god explanations remain in a disclosure and in professional view. No framework or dependency was added.

On narrow screens, successful recalculation collapses the input editor and exposes persistent edit, records and AI actions. Initial input and failed recalculation retain the editor. The six modules remain in a horizontal navigation strip. Export, copy, print and backup handlers are grouped under “更多”; AI settings use bounded internal scrolling. Gan-Zhi relations open separately as eight position-labeled nodes with soft arrows, focus/type filters, group participants and expandable [text references](GAN-ZHI-READING.md).

The default learning view does not change calculations or delete content. Its visibility state is a local preference. All original fields remain available under “排盘设置”; existing local records and backups keep their schema. New example data are synthetic. The knowledge catalog marks old source claims as pending rather than asserting verified ancient quotations. AI settings and actual network behavior remain separate from local chart calculation.

Verification covers original browser regressions plus view switching, original pillar equality, mobile page overflow, dark theme, search without data mutation, glossary search, focus trapping/restoration and keyboard module navigation. Screenshots are generated from the running application by browser tests, not design mockups.
