import { describe, expect, it } from 'vitest'
import { createLensModel } from '../engine/LensModel.js'
import { buildColumnMap } from '../engine/InterlacingEngine.js'
import { cylindricalProfileError, traceCylindricalRay } from '../engine/RefractionModel.js'
import { projectCylindricalColumns, renderAngularFrame, traceDisplacementMm } from '../engine/OpticalSimulation.js'

const profile = { sheetLpi: 50, radiusMm: 0.4, depthMm: 1.2, refractiveIndex: 1.5 }
const settings = { ppi: 600, nominalLpi: 50, effectiveLpi: 50, offsetPx: 0 }

describe('cylindrical ray model', () => {
  it('matches planar Snell refraction at the apex and is symmetric across the lens', () => {
    expect(traceCylindricalRay(30, 0, profile).filmX)
      .toBeCloseTo(-traceDisplacementMm(30, profile), 12)
    const right = traceCylindricalRay(10, 0.12, profile)
    const left = traceCylindricalRay(-10, -0.12, profile)
    expect(right.filmX).toBeCloseTo(-left.filmX, 12)
    expect(right.weight).toBeCloseTo(left.weight, 12)
  })

  it('focuses paraxial rays near the axis at nR/(n−1), but not out of focus', () => {
    const focused = traceCylindricalRay(0, 0.01, profile)
    const shorter = traceCylindricalRay(0, 0.01, { ...profile, depthMm: 0.6 })
    expect(Math.abs(focused.filmX)).toBeLessThan(0.00001)
    expect(shorter.filmX).toBeCloseTo(0.005, 5)
  })

  it('rejects profiles where the curvature or print-plane depth cannot fit', () => {
    expect(cylindricalProfileError(profile)).toBeNull()
    expect(cylindricalProfileError({ ...profile, radiusMm: 0.2 })).toMatch(/radius/i)
    expect(cylindricalProfileError({ ...profile, depthMm: 0.02 })).toMatch(/depth/i)
  })

  it('samples opposite printed stripes at opposite angles and preserves the planar geometry', () => {
    const raster = buildColumnMap(24, 2, createLensModel(settings))
    const rgba = Uint8ClampedArray.from([...raster].flatMap((stripe) =>
      stripe === 0 ? [255, 0, 0, 255] : [0, 0, 255, 255]))
    for (const [angleDeg, color] of [[-12, [0, 0, 255, 255]], [12, [255, 0, 0, 255]]]) {
      const columns = projectCylindricalColumns({ rasterWidth: 24, previewWidth: 2, settings, angleDeg, profile })
      expect([...renderAngularFrame(rgba, 24, columns).slice(0, 4)]).toEqual(color)
    }
  })

  it('locates sheet lenses independently of the printed period', () => {
    const columns = projectCylindricalColumns({
      rasterWidth: 240, previewWidth: 240, settings, angleDeg: 0, profile: { ...profile, sheetLpi: 60 },
    })
    const center = (samples) => samples.reduce((sum, { x, weight }) => sum + (x + 0.5) * weight, 0)
    expect(center(columns[9])).toBeCloseTo(5, 10)
    expect(center(columns[10])).toBeCloseTo(15, 10)
    expect(createLensModel(settings).pixelsPerLens).toBe(12)
  })
})
