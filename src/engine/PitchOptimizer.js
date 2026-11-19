import { buildAngularResponse, MIN_PREVIEW_ANGLE, MAX_PREVIEW_ANGLE } from './AngularResponse.js'
import { isSupportedViewCount } from './ViewCount.js'

export const PITCH_SEARCH_LIMITS = Object.freeze({
  lpi: { step: 0.05, maxRadius: 0.5 },
  offset: { step: 0.5, maxRadius: 2.5 },
})

export function defaultTargetAngles(viewCount) {
  if (!isSupportedViewCount(viewCount)) throw new RangeError('Unsupported target view count.')
  return Array.from({ length: viewCount }, (_, index) => Math.round(12 - 24 * index / (viewCount - 1)))
}

function radiusSteps(value, { step, maxRadius }, name) {
  const steps = Math.round(value / step)
  if (!Number.isFinite(value) || value < 0 || value > maxRadius || Math.abs(value / step - steps) > 1e-9) {
    throw new RangeError(`${name} must be between 0 and ${maxRadius}, in steps of ${step}.`)
  }
  return steps
}

export function findPitchCandidates({ rasterWidth, settings, viewCount, targetAngles, lpiRadius, offsetRadius, project }) {
  if (!isSupportedViewCount(viewCount) || targetAngles.length !== viewCount ||
      new Set(targetAngles).size !== viewCount ||
      targetAngles.some((angle) => !Number.isInteger(angle) || angle < MIN_PREVIEW_ANGLE || angle > MAX_PREVIEW_ANGLE)) {
    throw new RangeError(`Give every view a distinct whole-degree target angle between ${MIN_PREVIEW_ANGLE}° and ${MAX_PREVIEW_ANGLE}°.`)
  }

  const lpiSteps = radiusSteps(lpiRadius, PITCH_SEARCH_LIMITS.lpi, 'LPI radius')
  const offsetSteps = radiusSteps(offsetRadius, PITCH_SEARCH_LIMITS.offset, 'Offset radius')
  const projected = new Map(targetAngles.map((angle) => [angle, project(angle)]))

  function evaluate(effectiveLpi, offsetPx) {
    const response = buildAngularResponse({
      rasterWidth, viewCount, angles: targetAngles, settings: { ...settings, effectiveLpi, offsetPx },
      project: (angle) => projected.get(angle),
    })
    const targetShares = response.map(({ shares }, index) => shares[index])
    return {
      effectiveLpi, offsetPx,
      worstShare: Math.min(...targetShares),
      meanShare: targetShares.reduce((sum, share) => sum + share, 0) / viewCount,
    }
  }

  const baseline = evaluate(settings.effectiveLpi, settings.offsetPx)
  const candidates = []
  const ticksPerLpi = 1 / PITCH_SEARCH_LIMITS.lpi.step
  const center = Math.round(settings.effectiveLpi * ticksPerLpi)
  for (let lpi = -lpiSteps; lpi <= lpiSteps; lpi += 1) {
    const effectiveLpi = lpi === 0 ? settings.effectiveLpi : (center + lpi) / ticksPerLpi
    if (effectiveLpi < 1 || effectiveLpi > 300 || settings.ppi / effectiveLpi < viewCount) continue
    for (let offset = -offsetSteps; offset <= offsetSteps; offset += 1) {
      const offsetPx = settings.offsetPx + offset * PITCH_SEARCH_LIMITS.offset.step
      if (Math.abs(offsetPx) > 10000) continue
      const score = lpi === 0 && offset === 0 ? baseline : evaluate(effectiveLpi, offsetPx)
      candidates.push({ ...score, distance: Math.abs(lpi) + Math.abs(offset) })
    }
  }

  candidates.sort((a, b) => b.worstShare - a.worstShare || b.meanShare - a.meanShare || a.distance - b.distance)
  return { baseline, tested: candidates.length, best: candidates.slice(0, 5) }
}
