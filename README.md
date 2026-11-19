# Lenticular Optical Simulator

Prepare and inspect a vertical-lens, two- or three-image flip on an A4 raster. This release interlaces images; it does not simulate optics, estimate ghosting, or export print files.

## Run locally

Requires Node.js 22.12+ (22 LTS or newer) and npm.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Use a current desktop browser with Canvas 2D, module workers, and OffscreenCanvas. Images are processed locally; no backend or upload service is used.

1. Add two or three JPG, PNG, or WebP images, or start with **Load test patterns**. Use the arrows to set the left-to-right order of views within each lens.
2. Enter the calibrated **Effective LPI** and a signed horizontal offset in raster pixels. Defaults: 50 nominal and effective LPI, 600 PPI, zero offset.
3. Select **Generate interlace**. Use **Stripe detail** to view a magnified crop of the actual raster without the overview's downsampling. Changing inputs invalidates the preceding result.

Original files stay untouched. Thumbnails show the full sources. Raster preparation center-crops each image to A4's aspect ratio, then resamples to the common width and height without stretching it.

## Lens equations

| Quantity | Definition |
| --- | --- |
| Nominal pitch | `25.4 / nominalLpi` mm per lens (specification only) |
| Effective pitch | `25.4 / effectiveLpi` mm per lens (used in rendering) |
| Raster pitch | `PPI / effectiveLpi` pixels per lens |
| A4 raster | `round(210 × PPI / 25.4) × round(297 × PPI / 25.4)` pixels |
| Lens coordinate | `u = (x + 0.5 − offsetPx) × effectiveLpi / PPI` for zero-based raster column `x` |
| Lens and phase | `lensIndex = floor(u)`; `phase = u − lensIndex` |
| View index | `positiveModulo(floor(u × viewCount), viewCount)` |

Columns are sampled at their centers. Positive offset moves stripes right; an exact stripe boundary selects the stripe to its right. The implementation snaps values within floating-point roundoff of an integer before flooring. Pitch is never rounded or repeatedly added, so strip boundaries do not drift across the page. At 600 PPI and 50 LPI a lens is 12 px wide (6 or 4 px per view); at 720 PPI it is 14.4 px wide and stripe widths vary on the discrete raster.

PPI describes the image raster, not the printer's addressable dot density. The app accepts 72–900 PPI and requires at least one raster pixel per view per ideal lens period. High settings use significant browser memory: the A4 page at 600 PPI alone has about 139 MB of RGBA pixels. Tiled processing avoids retaining extra full-page copies of each normalized source.

## Verify and navigate

```sh
npm run test:run
npm run build
```

| Location | Role |
| --- | --- |
| `src/engine/` | Lens geometry, column assignment, and RGBA composition |
| `src/components/`, `src/utils/` | Image and setting controls, crop math, test patterns, and Canvas presentation |
| `src/workers/` | Decoding and resampling originals in bounded row bands |
| `src/tests/` | Geometry, color-band, phase, offset, and long-raster regression tests |

The conceptual roadmap is in `archivo.md`. Optical work needs a calibrated physical model and measurements before ghosting estimates can be meaningful.
