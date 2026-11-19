# Phase 4: sheet profiles and calibration
Objective: make sheet optics reusable now and retain a distinct checkpoint for physical calibration.
Branch: `feat/sheet-profiles` · Baseline: `4b310d7` · Delivery: `ask-on-risk` (forecast approximately 350 authored lines) · Checks: Vitest, Vite build, Edge.

## Specs

- S1 — “Ok, dale pues con la fase 4, con la metodologia....” Implement the agreed named sheet profiles with browser-local storage, explicit reuse in the angular preview, and versioned JSON import/export. Retain the uncalibrated label; applying a profile changes optics only.
- S2 — “avisame cuando hayas terminado esa fase” Report digital verification separately from physical fitting and validation. Follow the completed-phase publication rule only when the phase is complete.

## Tasks

- [x] T1 · S1 · Inline: model, additive local storage, JSON, preview, tests, and docs · `c7796ea`.
- [ ] T2 · S2 · External calibration: fit and validate against known-angle observations from the actual sheet and printing workflow. No physical setup is currently available.

## Log

- L1 — 2026-11-19: “Ok, dale pues con la fase 4, con la metodologia.... avisame cuando hayas terminado esa fase”
- Continue from published Phase 3. Physical calibration stays pending rather than being inferred from example optics.
- T1: missing-module RED, 4 focused tests GREEN, 38 full-suite tests and production build passed. Edge verified save/import/export, calibrated-claim rejection, persistence after reload, unchanged print settings/raster, and mobile layout. Native committed assessment: medium, under budget.
- T2 remains pending for a real print and sheet observed at known angles. The work unit does not establish a calibrated model or complete the physical phase; do not publish it under the completed-phase rule.
