import { buildAngularResponse } from './AngularResponse.js'
import { createLensModel } from './LensModel.js'

export function comparePrintSweep({ rasterWidth, viewCount, angles, project, settings, candidate }) {
  const candidateSettings = { ...settings, effectiveLpi: candidate.effectiveLpi, offsetPx: candidate.offsetPx }
  if (createLensModel(candidateSettings).pixelsPerLens < viewCount) {
    throw new RangeError('Configuration B needs at least one raster pixel per view per lens.')
  }

  // Hold the optical rays fixed; only the source stripe assigned to each hit can change.
  const columns = new Map(angles.map((angle) => [angle, project(angle)]))
  const summarize = (printSettings) => buildAngularResponse({
    rasterWidth, viewCount, angles, settings: printSettings, project: (angle) => columns.get(angle),
  })

  return { current: summarize(settings), candidate: summarize(candidateSettings) }
}

export function comparePrintSettings({ angleDeg, ...options }) {
  const sweep = comparePrintSweep({ ...options, angles: [angleDeg] })
  return { current: sweep.current[0].shares, candidate: sweep.candidate[0].shares }
}
