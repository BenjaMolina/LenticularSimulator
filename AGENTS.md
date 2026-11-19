# Lenticular Optical Simulator

## Scope

- React, JavaScript (no TypeScript), Vite, Canvas 2D, CSS, and Vitest. No backend or image uploads.
- The current release supports vertical lenses, an A4 portrait raster, and two or three views. Defaults are 50 nominal/effective LPI, 600 PPI, and zero horizontal offset.
- Do not present an image switcher, a color mixture, or the interlaced raster as optical simulation. Do not add ghosting metrics without a separately requested and validated physical model.
- Treat `archivo.md` as the larger roadmap, not as the scope of the current release.

## Implementation conventions

- `src/engine/` is pure geometry and pixel logic; keep it independent of React and browser globals. `src/workers/` owns decoding, resampling, and row-band rendering; UI lives in `src/components/` and shared image helpers in `src/utils/`.
- Keep original `File` objects separate from thumbnails and derived raster pixels. Revoke preview object URLs, close decoded bitmaps, and terminate workers when their results become obsolete.
- Use effective LPI for raster geometry. Use absolute raster pixel centers and a signed offset in raster pixels (positive moves bands right). Never step across the page using a rounded pitch.
- Keep the overview separate from stripe inspection. Browser scaling can hide or blend stripes; it is not an optical observation.
- Use English for code, comments, UI copy, and technical docs. Add deterministic color fixtures when geometry changes.

## Checks

Run `npm run test:run` and `npm run build`. For UI, Canvas, or worker changes, also exercise upload/reorder and preview generation in a browser. The README documents equations and expected strip widths.
