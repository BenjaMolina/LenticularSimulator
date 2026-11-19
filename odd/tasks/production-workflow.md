# Phase 5: production workflow
Status: digital production scope verified. Physical calibration remains separate.
Branch: `feat/ten-views` · Baseline: `534a5c4` · Delivery: `exception-ok` for the aggregate (authorized direct fast-forward to main; coherent commits, no PR requested) · Checks: Vitest, Vite, Edge, Pillow.
Forecast: approximately 530 authored lines in separate work units.

## Specs

- S1 — “haz los commits” Preserve and commit the approved 2–10 view workflow, including print, comparison and search.
- S2 — “termina con la fase 5” Add another full-resolution print format and a shareable job report; keep PNG working and preserve pixel dimensions and PPI.
- S3 — “termina con la fase 5” Add local reusable printer settings. Treat them as presets, not hardware configuration or calibration. Verify before integration and normal push to main.

## Tasks

- [x] T1 · S1 · Inline: verified ten-view increment · `c22c044`.
- [x] T2 · S2 · Inline: TIFF and JSON handoff on the existing completed raster · `6989bd5`.
- [x] T3 · S3 · Inline after T2: separate printer presets and matching job report metadata · `3aa9f38`.

## Log

- L1 — 2026-11-19: “haz los commits y termina con la fase 5”
- Phase 4 approved digital closure; physical calibration remains separately deferred. Extra animation formats and proprietary device control are not part of the print-production exit criteria.
- T1: 42 Vitest tests and production build passed, with prior Edge evidence for ten ordered stripes at 600 PPI, input limits and PNG output. Native committed assessment: medium, under budget.
- T2: missing-module RED, 3 focused and 45 suite tests GREEN, production build passed. Edge downloaded PNG, TIFF and job JSON; Pillow decoded the TIFF at exact 240 PPI and all RGBA pixels matched the PNG. Native committed assessment: medium, under budget.
- T3: missing-module RED, 6 export/preset tests GREEN, 48 suite tests and production build passed. Edge confirmed persistence, PPI-only application, report metadata, stale preset clearing on manual edits, and narrow layout. Native committed assessment: medium, under budget.
- Digital closure meets the authorized production scope: 2–10 views, full-resolution PNG/TIFF, job JSON and local printer presets. No physical performance or hardware control is asserted.
