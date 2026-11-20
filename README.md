# Lenticular Optical Simulator

Prepare, inspect, and export a vertical-lens flip with 2–10 views on an A4 raster. The experimental angular preview is uncalibrated and does not estimate physical ghosting.

## Run locally

Requires Node.js 22.12+ (22 LTS or newer) and npm.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. Use a current desktop browser with Canvas 2D, module workers, and OffscreenCanvas. Images are processed locally; no backend or upload service is used.

1. Add 2–10 JPG, PNG, or WebP images, or start with **Load test patterns** (three images) or **Load 10 test patterns**. Use the arrows to set the left-to-right order of views within each lens.
2. Enter the calibrated **Effective LPI** and a signed horizontal offset in raster pixels. Defaults: 50 nominal and effective LPI, 600 PPI, zero offset.
3. Select **Generate interlace**. Under **Raster**, use **Stripe detail** to view a magnified crop of the actual raster without the overview's downsampling. Changing inputs invalidates the preceding result; switching tabs does not.
4. Open **Angular preview** and move the angle slider. To model a nearby observer, enter **Viewing distance (mm)** from 100 to 10,000, measured perpendicular to the sheet. Leave it blank to keep parallel rays. **Cylindrical lens** and **Planar reference** are uncalibrated; the chart shows modeled stripe contributions, not measured ghosting.
5. In **Export**, select **Download print PNG** or **Download print TIFF** to save the raster at its original dimensions and selected PPI. TIFF is uncompressed 8-bit RGBA; PNG is usually smaller. Print at actual size; do not let the driver fit it to the page. **Download job report JSON** saves the raster settings and source filenames in stripe order, without embedding images.

### Compare sheets or print settings

Save or import two cylindrical profiles under **Angular preview → Sheet profiles**, then switch to **Compare → Sheet profiles**. Choose A and B. The two previews and sampled-stripe weights use the same generated raster and observer position; only the sheet profiles differ. Angle and distance are shared with **Angular preview**. Selecting profiles does not apply them to the angular preview or change the print export. These are modeled results, not measured ghosting.

In **Compare → Print settings**, A is the generated print; B changes only the effective print LPI and horizontal offset in the theoretical comparison. Both use the optical settings, angle, and distance from **Angular preview**. B does not change the print export.

Open **Compare across angles** to overlay A and B from −40° to +40° for a selected view or the unassigned weight. This shows whether a change helps around the target angle as well as at the target itself.

Within that panel, open **Search print settings**, choose a target angle for each view, and run the bounded search. It ranks up to five suggestions by the weakest intended view first. **Use in B** lets you inspect a suggestion without applying it to the actual print.

Under **Angular preview → Sheet profiles**, name and save valid cylindrical settings, or import and export a profile JSON file. Saving or importing adds a new local profile. **Apply profile** changes the optical preview only; print LPI, offset, and the PNG remain unchanged. Profiles are not calibration evidence.

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

PPI describes the image raster, not the printer's addressable dot density. The app accepts 72–900 PPI and requires at least one raster pixel per view per ideal lens period. For ten views at 50 effective LPI, the minimum is 500 PPI. High settings use significant browser memory: the A4 page at 600 PPI alone has about 139 MB of RGBA pixels, and decoded originals also use memory. Tiled processing avoids retaining extra full-page copies of each normalized source.

## Verify and navigate

```sh
npm run test:run
npm run build
```

| Location | Role |
| --- | --- |
| `src/engine/` | Lens geometry, column assignment, and angular sampling of the print raster |
| `src/components/`, `src/utils/` | Image and setting controls, crop math, test patterns, and Canvas presentation |
| `src/workers/` | Decoding and resampling originals in bounded row bands |
| `src/tests/` | Print geometry, angular response, and PNG physical metadata |

See [the architecture and model limits](docs/architecture.md). The [continuity package](Contexto/README_INICIO.md) describes the broader roadmap.

Use the [two-view calibration target and capture guide](docs/calibration.md) for the first physical comparison.

**Printer presets** save the current raster PPI, a printer or print-service name, media, and driver notes in this browser. **Apply printer preset** changes only raster PPI; regenerate the raster to use it. The new job report includes the applied notes when the preset still matches the generated raster. This is not device DPI, a printer driver setting, or calibration.
