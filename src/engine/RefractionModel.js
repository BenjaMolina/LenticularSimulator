import { lpiToMillimeters } from './LensModel.js'

export function cylindricalProfileError({ sheetLpi, radiusMm, depthMm, refractiveIndex }) {
  if (!(sheetLpi >= 1 && sheetLpi <= 300)) return 'Sheet LPI must be between 1 and 300.'
  const halfPitch = lpiToMillimeters(sheetLpi) / 2
  if (!Number.isFinite(radiusMm) || radiusMm <= halfPitch) {
    return 'Curvature radius must exceed half the sheet pitch.'
  }
  // Rationalized circle sag avoids subtracting almost equal numbers for large radii.
  const edgeSag = halfPitch ** 2 / (radiusMm + Math.sqrt(radiusMm ** 2 - halfPitch ** 2))
  if (!Number.isFinite(depthMm) || depthMm <= edgeSag || depthMm > 5) {
    return 'Print plane depth must be greater than the edge sag and no more than 5 mm.'
  }
  if (!(refractiveIndex >= 1 && refractiveIndex <= 3)) return 'Refractive index must be between 1 and 3.'
  return null
}

// Trace backward from the observer. The apex is at z=0; the print plane is at z=depthMm.
export function traceCylindricalRay(angleDeg, surfaceX, { radiusMm, depthMm, refractiveIndex }) {
  const radians = angleDeg * Math.PI / 180
  const ix = -Math.sin(radians)
  const iz = Math.cos(radians)
  const nx = -surfaceX / radiusMm
  const nz = Math.sqrt(1 - nx ** 2)
  const incidence = ix * nx + iz * nz
  if (!(incidence > 0)) return null

  const eta = 1 / refractiveIndex
  const normalFactor = Math.sqrt(1 - eta ** 2 * (1 - incidence ** 2)) - eta * incidence
  const tx = eta * ix + normalFactor * nx
  const tz = eta * iz + normalFactor * nz
  if (!(tz > 0)) return null

  const surfaceZ = surfaceX ** 2 / (radiusMm * (1 + nz))
  return {
    filmX: surfaceX + (depthMm - surfaceZ) * tx / tz,
    weight: incidence / nz,
  }
}
