# 5.33 acceptance

Scope: structural JSON comparison and offline-reference reporting. Calendar, Bazi, interpretation, AI and storage rules remain unchanged.

Six Node regressions were observed failing before implementation: array/object false equality, missing-versus-null ambiguity, omitted solar-longitude checks, lunar dates treated as Gregorian, unchecked convention metadata and opaque invalid-period errors. Tests also cover numeric-string normalization and invalid longitude.

Two browser cases at1440/390px import longitude mismatches and omissions, export the resulting report, retain missing Gregorian-date status for lunar inputs, reject invalid longitude and clear the old report. They check no import-triggered requests, no storage changes, no page overflow and no script errors.

Local `npm run verify` passed145 Node tests,5 Python launcher tests and88 Chrome cases (238 total), with0 failures, skips or retries. Static checks found0 errors,32 existing warnings and0 new warnings; generated HTML copies are synchronized. Calendar, Bazi, interpretation, AI and storage sources were not modified. The existing publication workflow reruns verification, rebuilds and self-tests a fresh Windows EXE; Pages and downloaded asset receipts are checked separately at delivery.
