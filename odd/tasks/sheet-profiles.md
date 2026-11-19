# Phase 4: digital sheet profiles
Status: digital scope complete and verified. Physical calibration is a separate deferred milestone.
Branch: `feat/sheet-profiles` · Baseline: `4b310d7` · Delivery: `ask-on-risk` (forecast approximately 350 authored lines) · Checks: Vitest, Vite build, Edge.

## Specs

- S1 — “Ok, dale pues con la fase 4, con la metodologia....” Implement the agreed named sheet profiles with browser-local storage, explicit reuse in the angular preview, and versioned JSON import/export. Retain the uncalibrated label; applying a profile changes optics only.
- S2 — “avisame cuando hayas terminado esa fase”; “si, dale, asi lo hagamos”. Close and publish the verified digital scope. Physical fitting and validation are not part of this closure and must not be reported as complete.

## Tasks

- [x] T1 · S1 · Inline: model, additive local storage, JSON, preview, tests, and docs · `c7796ea`.
- [ ] T2 · S2 · Deferred separate milestone: fit and validate against known-angle observations from the actual sheet and printing workflow. No physical samples are available; this does not block digital publication.

## Log

- L1 — 2026-11-19: “Ok, dale pues con la fase 4, con la metodologia.... avisame cuando hayas terminado esa fase”
- Continue from published Phase 3. Physical calibration stays pending rather than being inferred from example optics.
- T1: missing-module RED, 4 focused tests GREEN, 38 full-suite tests and production build passed. Edge verified save/import/export, calibrated-claim rejection, persistence after reload, unchanged print settings/raster, and mobile layout. Native committed assessment: medium, under budget.
- L2 — 2026-11-19: “si, dale, asi lo hagamos”
- The user approved closing Phase 4 at the verified digital milestone. Profiles remain uncalibrated, and T2 remains unverified until a real print and sheet can be observed at known angles.
