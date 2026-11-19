# Lenticular MVP: raster, angular preview, and print export

The print raster is the source of truth. The browser produces that raster once, then inspects it directly, samples it with an experimental optical model, or exports it. The three outputs are intentionally separate.

## Data flow

| Layer | Responsibility |
| --- | --- |
| React, Canvas 2D | Accept local source files, configure the A4 raster, display a pixel crop and the angular view, and download PNG. No backend. |
| Interlacing worker | Normalize originals to a centered A4 crop and fill the raster in row bands. The existing geometry uses absolute pixel centers, effective LPI, and signed print offset. |
| Optical engine | Define a ray and response in the horizontal plane, sample actual pixels from the print raster, and composite samples in linear light. It has no browser or React dependencies. |
| PNG export | Encode the finished raster, then set the PNG physical-density chunk without changing its dimensions or pixels. |

## Uncalibrated angular model

Use a plane parallel to the print surface as the reference for refraction, and one central ray per vertical lenticule. For an external angle θ from the normal, air index 1, illustrative refractive index *n* and optical depth *d* in mm:

```text
θ_inside = asin(sin(θ) / n)
displacement_mm = d × tan(θ_inside)
sample_x_px = (lens_index + 0.5) × pitch_px − displacement_mm × PPI / 25.4
```

Positive θ places the observer to the right; the ray traced back to the print plane shifts left. Physical lenses are anchored at x = 0 and share the selected effective pitch with the printed period in this MVP. Print offset is already in the raster and is not applied twice.

For each raster pixel center near the ray, use a tent response `max(0, 1 − abs(x − sample_x_px) / R)`, where `R = max(1 pixel, pitch_px / 8)`. Normalize by the unmasked tent weight, then reject samples outside the current lenticule or page. Lost weight displays as transparency, not as light transmitted by a neighboring lens. The finite response produces continuous mixing across stripe boundaries. The preview downsamples the raster vertically only before sampling to avoid blurring horizontal stripes.

**The default depth (0.50 mm), index (1.50), and tent response are illustrative, not measured.** This model does not trace a curved cylindrical surface or model its focal geometry, scattering, printer blur, or view distance. A darker or mixed region is not a validated ghosting estimate.

## Verification and calibration boundary

- Test sign and symmetry of the refracted ray, clipped aperture weights, fractional pitch, signed print offset, and continuous transitions with synthetic stripes.
- Check exported PNG dimensions and pixels against the print raster; verify its physical-density chunk independently. The physical print workflow must still honor the PNG size without automatic rescaling.
- Nominal LPI from the manufacturer and the requested file PPI are known inputs. Effective pitch, alignment, refractive index, depth, and measured angular response require sheet data or physical calibration. PPI is not the printer's advertised DPI.
- A later calibrated model can estimate channel crosstalk by integrating measured angular response over each view's printed stripe and normalizing to the total response at that angle. Compare the resulting contributions with photographs or measurements of known test patterns before reporting ghosting as a useful prediction.
