# Third-party notices

`vendor/lunar.js` is an unmodified copy of **lunar-javascript 1.7.7**, Copyright (c) 2018 6tail, MIT licensed. The full upstream license is in `vendor/lunar-LICENSE.txt`; its full text is also embedded in each generated HTML file. Upstream: https://github.com/6tail/lunar-javascript . The npm dependency is version pinned and recorded in `package-lock.json`.

Solar apparent time uses the documented NOAA fractional-year approximation, implemented in `src/calendar/calendar.js`. Source: https://gml.noaa.gov/grad/solcalc/solareqns.PDF . The independent Hong Kong Observatory calendar and solar-term references are linked in `tests/fixtures/SOURCES.md`. Reference facts are used for checks; HKO does not endorse this application or its traditional interpretations.

Existing optional web fonts retain their original provider terms and fallback system fonts; calendar calculations do not require external requests.

`data/cities.json` contains an adapted selection of GeoNames geographical data, retrieved 2026-10-21 from the CN/HK/MO/TW country dumps at https://download.geonames.org/export/dump/ . Attribution: **GeoNames.org** (https://www.geonames.org/), licensed under **Creative Commons Attribution 4.0** (https://creativecommons.org/licenses/by/4.0/). Changes: selected populated-place records, normalized fields, selected Chinese aliases and province labels, and retained source IDs and WGS84 coordinates. Source archive hashes, selection criteria and date are included in the JSON. This is not a complete or current administrative registry. Attribution is also visible in the application city picker. The application MIT license does not replace this dataset license.

**Astronomy Engine 2.1.19**, Copyright (c) 2019-2023 Don Cross, MIT, https://github.com/cosinekitty/astronomy , is a pinned development-only reference dependency for independent solar hour-angle comparisons. It is not embedded in the released HTML. Its full upstream license is included in the npm package's `astronomy.js` header; tests are software cross-checks, not observational validation.
