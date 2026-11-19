# Lenticular architecture: raster, angular preview, and print export

The print raster is the source of truth. The browser produces that raster once, then inspects it directly, samples it with an experimental optical model, or exports it. The three outputs are intentionally separate.

## Data flow

| Layer | Responsibility |
| --- | --- |
| React, Canvas 2D | Accept local source files, configure the A4 raster, display a pixel crop and the angular view, and download PNG. No backend. |
| Interlacing worker | Normalize originals to a centered A4 crop and fill the raster in row bands. The existing geometry uses absolute pixel centers, effective LPI, and signed print offset. |
| `engine/RefractionModel.js` and `engine/OpticalSimulation.js` | Trace rays in the horizontal plane, sample actual print pixels, and composite in linear light. These modules have no browser or React dependencies. |
| `rendering/CanvasRenderer.js` | Read raster rows and paint preview pixels. It does not own lens math. |
| Print export | Encode the finished raster as PNG with its physical-density chunk, or use `rendering/ImageExporter.js` to write uncompressed RGBA TIFF strips with exact X/Y PPI. The separate versioned job report records the raster, stripe order and uncalibrated status. |

`engine/ViewCount.js` sets the 2–10 integer view limit shared by upload validation, the column map, and the theoretical search. The pixel-center stripe rule is unchanged; raising the count narrows each stripe and therefore raises the minimum usable raster PPI.

## Cylindrical preview (uncalibrated)

Trace 17 evenly spaced rays across the circular cross-section of a vertical lenticule. At surface point `x`, the sag is `z = R − sqrt(R² − x²)`, and the inward unit normal points toward the circle center. Backward rays come from air at the selected angle. For incident direction `I`, inward normal `N`, and `η = 1/n`, the transmitted direction is:

```text
c = dot(I, N)
T = η I + (sqrt(1 − η²(1 − c²)) − η c) N
film_x = x + (depth − z) × T_x / T_z
```

Visible rays are weighted by projected surface area, `c / N_z`. The preview interpolates the raster at each hit and rejects samples outside the associated lens aperture or page. The independently configurable sheet LPI determines where the physical lenses sit; **Effective LPI** in the print settings still determines the raster's stripes and is not modified by this preview.

Defaults of **0.40 mm radius, 1.20 mm optical depth, and 1.50 index are illustrative**. The depth is near the paraxial focus `nR / (n − 1)` for those inputs, not a measurement. The model assumes distant observation and a circular surface, and omits reflection, scattering, adhesive layers, dot gain, and finite viewing distance. Ray weights are not measured ghosting.

## Planar MVP reference

Use a plane parallel to the print surface as the reference for refraction, and one central ray per vertical lenticule. For an external angle θ from the normal, air index 1, illustrative refractive index *n* and optical depth *d* in mm:

```text
θ_inside = asin(sin(θ) / n)
displacement_mm = d × tan(θ_inside)
sample_x_px = (lens_index + 0.5) × pitch_px − displacement_mm × PPI / 25.4
```

Positive θ places the observer to the right; the ray traced back to the print plane shifts left. Physical lenses are anchored at x = 0 and share the selected effective pitch with the printed period in this MVP. Print offset is already in the raster and is not applied twice.

For each raster pixel center near the ray, use a tent response `max(0, 1 − abs(x − sample_x_px) / R)`, where `R = max(1 pixel, pitch_px / 8)`. Normalize by the unmasked tent weight, then reject samples outside the current lenticule or page. Lost weight displays as transparency, not as light transmitted by a neighboring lens. The finite response produces continuous mixing across stripe boundaries. The preview downsamples the raster vertically only before sampling to avoid blurring horizontal stripes.

The reference mode keeps the original 0.50 mm default depth and does not represent surface curvature.

## Angular response diagnostic

`engine/AngularResponse.js` groups the active projector's sample weights by their printed stripe index and averages across the same columns as the preview. The chart shows one curve per source view and a remainder for unassigned weight. The chart and slider share the same integer-degree samples. It does not renormalize away rejected samples or infer contributions from image colors, transparency, or brightness. The result describes the model, not measured optical transmission or physical ghosting.

`engine/PrintComparison.js` groups the **same projected samples** against two different stripe maps, at one angle for the table or across the preview range for the overlay. It traces each requested angle once and builds each stripe map once per comparison. This keeps the virtual sheet and model fixed even when sheet LPI defaults to A's print pitch. B changes only print effective LPI and offset; it does not redraw or export a different print. To print B, enter those settings in the print panel and regenerate.

`engine/PitchOptimizer.js` sweeps a local grid around A (0.05 LPI and 0.5 px steps, at most 231 candidates). It reuses the projected samples for one distinct target angle per intended view. A candidate's score is the lowest intended-view share, then the mean intended-view share, then proximity in grid steps. Shares include unassigned weight in the denominator. The top five are theoretical suggestions within the tested grid and angles, not a calibration or a global optimum.

## Verification and calibration boundary

`models/LenticularProfile.js` validates the versioned `lenticular.sheet-profile/v1` document: a name, uncalibrated status, and numeric sheet LPI, radius, depth, and refractive index. Browser storage adds independent records. The file does not contain image data, print settings, or measured calibration. Unknown schema versions and calibrated claims are rejected rather than silently interpreted.

- Test sign and symmetry of the refracted ray, clipped aperture weights, fractional pitch, signed print offset, and continuous transitions with synthetic stripes.
- Check the cylinder against planar refraction at its apex, paraxial focus, invalid sheet geometry, and pitch mismatch independently of printing.
- Check exported PNG dimensions and pixels against the print raster; verify its physical-density chunk independently. The physical print workflow must still honor the PNG size without automatic rescaling.
- Nominal LPI from the manufacturer and the requested file PPI are known inputs. Effective pitch, alignment, refractive index, depth, and measured angular response require sheet data or physical calibration. PPI is not the printer's advertised DPI.
- A later calibrated model can estimate channel crosstalk by integrating measured angular response over each view's printed stripe and normalizing to the total response at that angle. Compare the resulting contributions with photographs or measurements of known test patterns before reporting ghosting as a useful prediction.
