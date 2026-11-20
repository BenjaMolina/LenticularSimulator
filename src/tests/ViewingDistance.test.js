import { describe, expect, it } from 'vitest'
import { projectAngularColumns, projectCylindricalColumns } from '../engine/OpticalSimulation.js'
import { compareSheetProfiles } from '../engine/SheetComparison.js'

const settings = { ppi: 600, nominalLpi: 50, effectiveLpi: 50, offsetPx: 0 }
const profile = { sheetLpi: 50, radiusMm: 0.4, depthMm: 1.2, refractiveIndex: 1.5 }
const page = { rasterWidth: 2412, previewWidth: 201, settings, angleDeg: 0 }
const planar = (options) => projectAngularColumns({ depthMm: 0.5, refractiveIndex: 1.5, ...page, ...options })
const cylindrical = (options) => projectCylindricalColumns({ profile, ...page, ...options })
const centroid = (samples) => samples.reduce((sum, { x, weight }) => sum + (x + 0.5) * weight, 0) /
  samples.reduce((sum, { weight }) => sum + weight, 0)

describe('finite observer distance', () => {
  it('uses the page center as the angle reference and sends oblique rays through the outer lenses', () => {
    const columns = planar({ viewingDistanceMm: 100 })
    const leftLocalDeg = Math.atan(50.8 / 100) * 180 / Math.PI
    expect(centroid(columns[0])).toBeCloseTo(centroid(planar({ angleDeg: leftLocalDeg })[0]), 10)
    expect(centroid(columns[100])).toBeCloseTo(page.rasterWidth / 2, 10)
    expect(centroid(columns[200])).toBeCloseTo(page.rasterWidth - centroid(columns[0]), 10)
    const angled = planar({ angleDeg: 15, viewingDistanceMm: 100 })
    expect(centroid(angled[100])).toBeCloseTo(centroid(planar({ angleDeg: 15 })[100]), 10)
  })

  it('aims the individual cylindrical aperture rays and converges toward parallel rays as distance increases', () => {
    const lens = { rasterWidth: 12, previewWidth: 1 }
    const weights = (options) => cylindrical({ ...lens, ...options })[0]
    const parallel = weights({})
    const near = weights({ viewingDistanceMm: 100 })
    const far = weights({ viewingDistanceMm: 10000 })
    const difference = (samples) => {
      const at = (taps, x) => taps.find((tap) => tap.x === x)?.weight ?? 0
      return Array.from({ length: 12 }, (_, x) => Math.abs(at(samples, x) - at(parallel, x)))
        .reduce((sum, weight) => sum + weight, 0)
    }
    expect(centroid(near)).toBeCloseTo(6, 10)
    expect(difference(near)).toBeGreaterThan(difference(far))
    expect(difference(far)).toBeLessThan(0.001)
    expect(cylindrical({ viewingDistanceMm: 100 })[0]).not.toEqual(cylindrical({})[0])
  })

  it('uses the same finite observer for both sheet profiles without modifying the print settings', () => {
    const viewed = { ...page, angleDeg: 10, viewingDistanceMm: 200 }
    const opticsB = { ...profile, sheetLpi: 60 }
    const result = compareSheetProfiles({ ...viewed, opticsA: profile, opticsB, viewCount: 2 })
    expect(result.a.columns).toEqual(cylindrical(viewed))
    expect(result.b.columns).toEqual(cylindrical({ ...viewed, profile: opticsB }))
    expect(result.a.columns).not.toEqual(cylindrical({ angleDeg: 10 }))
    expect(settings).toEqual({ ppi: 600, nominalLpi: 50, effectiveLpi: 50, offsetPx: 0 })
  })

  it.each([99, 10001, NaN])('rejects unsupported distance %s in both models', (viewingDistanceMm) => {
    expect(() => planar({ viewingDistanceMm })).toThrow(/distance/i)
    expect(() => cylindrical({ viewingDistanceMm })).toThrow(/distance/i)
  })
})
