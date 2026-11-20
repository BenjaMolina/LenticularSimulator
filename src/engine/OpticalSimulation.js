import { createLensModel, lpiToMillimeters } from './LensModel.js'
import { cylindricalProfileError, traceCylindricalRay } from './RefractionModel.js'

export const VIEWING_DISTANCE_MM = Object.freeze({ min: 100, max: 10000 })

export function viewingDistanceError(distanceMm) {
  if (distanceMm === undefined) return null
  const { min, max } = VIEWING_DISTANCE_MM
  return Number.isFinite(distanceMm) && distanceMm >= min && distanceMm <= max
    ? null : `Viewing distance must be between ${min} and ${max} mm, or blank for parallel rays.`
}

function createObserver(angleDeg, distanceMm) {
  const error = viewingDistanceError(distanceMm)
  if (error) throw new RangeError(error)
  if (distanceMm === undefined) return null
  return { distanceMm, xMm: distanceMm * Math.tan(angleDeg * Math.PI / 180) }
}

export function traceDisplacementMm(angleDeg, { depthMm, refractiveIndex }) {
  if (!Number.isFinite(angleDeg) || Math.abs(angleDeg) >= 90 ||
    !Number.isFinite(depthMm) || depthMm <= 0 ||
    !Number.isFinite(refractiveIndex) || refractiveIndex < 1) {
    throw new RangeError('Use a viewing angle between −90° and 90°, positive depth, and a refractive index of at least 1.')
  }
  const angleInside = Math.asin(Math.sin(angleDeg * Math.PI / 180) / refractiveIndex)
  return depthMm * Math.tan(angleInside)
}

export function projectAngularColumns({ rasterWidth, previewWidth, settings, angleDeg, depthMm, refractiveIndex, viewingDistanceMm }) {
  const { pixelsPerLens, effectivePitchMm } = createLensModel(settings)
  const optics = { depthMm, refractiveIndex }
  const parallelShiftPx = traceDisplacementMm(angleDeg, optics) * pixelsPerLens / effectivePitchMm
  const observer = createObserver(angleDeg, viewingDistanceMm)
  const radius = Math.max(1, pixelsPerLens / 8)
  const cache = new Map()

  return Array.from({ length: previewWidth }, (_, column) => {
    const lens = Math.floor((column + 0.5) * rasterWidth / previewWidth / pixelsPerLens)
    if (cache.has(lens)) return cache.get(lens)
    const left = lens * pixelsPerLens
    const right = (lens + 1) * pixelsPerLens
    const centerPx = (lens + 0.5) * pixelsPerLens
    const localAngle = observer && Math.atan2(
      observer.xMm - (centerPx - rasterWidth / 2) * effectivePitchMm / pixelsPerLens, observer.distanceMm,
    ) * 180 / Math.PI
    const shiftPx = observer ? traceDisplacementMm(localAngle, optics) * pixelsPerLens / effectivePitchMm : parallelShiftPx
    const hit = centerPx - shiftPx
    const taps = []
    let weightSum = 0
    for (let x = Math.ceil(hit - radius - 0.5); x <= Math.floor(hit + radius - 0.5); x += 1) {
      const center = x + 0.5
      const weight = 1 - Math.abs(center - hit) / radius
      if (weight <= 0) continue
      weightSum += weight
      if (x >= 0 && x < rasterWidth && center >= left && center < right) taps.push({ x, weight })
    }
    // Normalize against the unmasked response so a clipped ray loses coverage.
    for (const tap of taps) tap.weight /= weightSum
    cache.set(lens, taps)
    return taps
  })
}

const TO_LINEAR = Float64Array.from({ length: 256 }, (_, byte) => {
  const value = byte / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
})

export function projectCylindricalColumns({ rasterWidth, previewWidth, settings, angleDeg, profile, viewingDistanceMm }) {
  const error = cylindricalProfileError(profile)
  if (error) throw new RangeError(error)
  if (!Number.isFinite(angleDeg) || Math.abs(angleDeg) >= 90) throw new RangeError('Invalid viewing angle.')

  const pitchMm = lpiToMillimeters(profile.sheetLpi)
  const pitchPx = settings.ppi / profile.sheetLpi
  const pixelsPerMm = pitchPx / pitchMm
  const observer = createObserver(angleDeg, viewingDistanceMm)
  const apertureSamples = 17
  const surfacePoints = Array.from({ length: apertureSamples }, (_, i) => ((i + 0.5) / apertureSamples - 0.5) * pitchMm)
  function traceAperture(localObserver) {
    const rays = surfacePoints.map((x) => traceCylindricalRay(angleDeg, x, profile, localObserver)).filter(Boolean)
    return { rays, fullWeight: rays.reduce((total, ray) => total + ray.weight, 0) }
  }
  const parallel = observer ? null : traceAperture()
  const cache = new Map()

  return Array.from({ length: previewWidth }, (_, column) => {
    const lens = Math.floor((column + 0.5) * rasterWidth / previewWidth / pitchPx)
    if (cache.has(lens)) return cache.get(lens)
    const left = lens * pitchPx
    const right = (lens + 1) * pitchPx
    const centerPx = (lens + 0.5) * pitchPx
    const { rays, fullWeight } = parallel ?? traceAperture({
      distanceMm: observer.distanceMm,
      offsetMm: observer.xMm - (centerPx - rasterWidth / 2) / pixelsPerMm,
    })
    const taps = new Map()
    for (const { filmX, weight } of rays) {
      const hit = centerPx + filmX * pixelsPerMm
      if (hit < left || hit >= right) continue
      const x = Math.floor(hit - 0.5)
      const fraction = hit - (x + 0.5)
      for (const [sample, part] of [[x, 1 - fraction], [x + 1, fraction]]) {
        if (!part || sample < 0 || sample >= rasterWidth || sample + 0.5 < left || sample + 0.5 >= right) continue
        taps.set(sample, (taps.get(sample) ?? 0) + part * weight / fullWeight)
      }
    }
    const samples = Array.from(taps, ([x, weight]) => ({ x, weight }))
    cache.set(lens, samples)
    return samples
  })
}

function toSrgb(value) {
  return 255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055)
}

export function renderAngularFrame(source, sourceWidth, columns) {
  const height = source.length / (4 * sourceWidth)
  const output = new Uint8ClampedArray(columns.length * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < columns.length; x += 1) {
      let r = 0, g = 0, b = 0, alpha = 0
      for (const tap of columns[x]) {
        const offset = (y * sourceWidth + tap.x) * 4
        const weight = tap.weight * source[offset + 3] / 255
        r += TO_LINEAR[source[offset]] * weight
        g += TO_LINEAR[source[offset + 1]] * weight
        b += TO_LINEAR[source[offset + 2]] * weight
        alpha += weight
      }
      if (!alpha) continue
      const offset = (y * columns.length + x) * 4
      output[offset] = toSrgb(r / alpha)
      output[offset + 1] = toSrgb(g / alpha)
      output[offset + 2] = toSrgb(b / alpha)
      output[offset + 3] = 255 * alpha
    }
  }
  return output
}
