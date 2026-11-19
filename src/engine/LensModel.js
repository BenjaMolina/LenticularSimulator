const MM_PER_INCH = 25.4

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive and finite.`)
  return value
}

function floorAtBoundary(value) {
  const nearest = Math.round(value)
  const roundoff = 2 * Number.EPSILON * Math.max(1, Math.abs(value))
  return Math.abs(value - nearest) <= roundoff ? nearest || 0 : Math.floor(value)
}

export function lpiToMillimeters(lpi) {
  return MM_PER_INCH / positive(lpi, 'LPI')
}

export function a4Raster(ppi) {
  positive(ppi, 'PPI')
  return {
    width: Math.round((210 * ppi) / MM_PER_INCH),
    height: Math.round((297 * ppi) / MM_PER_INCH),
  }
}

export function createLensModel({ nominalLpi, effectiveLpi, ppi, offsetPx = 0 }) {
  const nominalPitchMm = lpiToMillimeters(nominalLpi)
  const effectivePitchMm = lpiToMillimeters(effectiveLpi)
  positive(ppi, 'PPI')
  if (!Number.isFinite(offsetPx)) throw new RangeError('Offset must be finite.')

  const coordinateAt = (x, subdivisions = 1) => ((x - offsetPx) * effectiveLpi * subdivisions) / ppi

  return {
    nominalPitchMm,
    effectivePitchMm,
    pixelsPerLens: ppi / effectiveLpi,
    positionAt(x) {
      const position = coordinateAt(x)
      const lensIndex = floorAtBoundary(position)
      return { lensIndex, phase: Math.max(0, position - lensIndex) }
    },
    stripeAt(x, viewCount) {
      return floorAtBoundary(coordinateAt(x, viewCount))
    },
  }
}
