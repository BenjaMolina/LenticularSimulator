# Cylindrical optics and first print sample
Objective: advance Phase 2 while keeping physical validation separate from theoretical output.
Branch: `feat/cylindrical-optics` · Baseline: `6e9b131` · Delivery: `ask-on-risk` (forecast approximately 380 authored lines) · Checks: Vitest, Vite build, Edge smoke.

## Specs

- S1 — “OK, hazlo entonces, contiunua con lo siguiente...” Continue Phase 2 with the agreed cylindrical model and a prepared first physical baseline. No physical sample or measured ghosting may be claimed without observations.
- S2 — “y tambien estas siguiendo la arquitectura de carpetas que se definio?” Verify against the documented folders. Place the new pure refraction model and Canvas adapter in the planned engine and rendering directories.

## Tasks

- [x] T1 · S1–S2 · Inline: cylindrical model, planar reference, engine/rendering split · `c976c6b`.
- [x] T2 · S1 · Inline: printable two-view targets and capture procedure · `50b12e3`.
- [ ] T3 · S1 · Deferred: actual 50 LPI sheet, print, and photos at known angles. No printer or physical setup is currently available.

## Log

- L1 — 2026-11-19: “OK, hazlo entonces, contiunua con lo siguiente... y tambien estas siguiendo la arquitectura de carpetas que se definio?”
- The accepted next step was Phase 2 plus a first physical sample before assigning ghosting percentages. The sample can be prepared here, but the print and camera data must come from the physical setup.
- T1: missing-module RED, then 5 focused tests GREEN; full suite 22 passed, production build passed, and Edge confirmed curved angle response, invalid-radius handling, independent sheet LPI, and the original planar result. Native committed assessment: medium, under budget.
- T2: Node regenerated the source PNGs; Edge checked inverse patches and ruler marks, and downloaded a 4961 × 7016 PNG carrying 600 PPI. Native committed assessment: medium, under budget.
- L2 — 2026-11-19: “No, pero no tengo impresora ni nada”
- T3 remains unverified and does not block digital development. Do not mark the model calibrated.
