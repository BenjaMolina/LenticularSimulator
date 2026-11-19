import { buildColumnMap } from './InterlacingEngine.js'
import { createLensModel } from './LensModel.js'

export const MIN_PREVIEW_ANGLE = -40
export const MAX_PREVIEW_ANGLE = 40

export function buildAngularResponse({ rasterWidth, settings, viewCount, angles, project }) {
  const stripes = buildColumnMap(rasterWidth, viewCount, createLensModel(settings))

  return angles.map((angleDeg) => {
    const columns = project(angleDeg)
    const weights = Array(viewCount).fill(0)
    for (const column of columns) {
      for (const { x, weight } of column) weights[stripes[x]] += weight
    }
    const shares = weights.map((weight) => weight / Math.max(columns.length, 1))
    const assigned = shares.reduce((sum, share) => sum + share, 0)
    return { angleDeg, shares: [...shares, Math.max(0, 1 - assigned)] }
  })
}
