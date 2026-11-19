import { describe, expect, it } from 'vitest'
import { a4Raster, createLensModel, lpiToMillimeters } from '../engine/LensModel.js'

describe('A4 lens geometry', () => {
  it('separates nominal pitch from the calibrated effective pitch', () => {
    expect(lpiToMillimeters(50)).toBeCloseTo(0.508)
    const lens = createLensModel({ nominalLpi: 50, effectiveLpi: 49.95, ppi: 600 })
    expect(lens.nominalPitchMm).toBeCloseTo(0.508)
    expect(lens.effectivePitchMm).toBeCloseTo(25.4 / 49.95, 12)
    expect(lens.pixelsPerLens).toBeCloseTo(600 / 49.95, 12)
  })

  it.each([
    [600, 4961, 7016, 12],
    [720, 5953, 8419, 14.4],
  ])('converts A4 and 50 LPI at %i PPI', (ppi, width, height, pitch) => {
    expect(a4Raster(ppi)).toEqual({ width, height })
    expect(createLensModel({ nominalLpi: 50, effectiveLpi: 50, ppi }).pixelsPerLens).toBe(pitch)
  })

  it('applies a signed horizontal offset and wraps negative positions', () => {
    const lens = createLensModel({ nominalLpi: 50, effectiveLpi: 50, ppi: 600, offsetPx: 3 })
    expect(lens.positionAt(0)).toEqual({ lensIndex: -1, phase: 0.75 })
    expect(lens.positionAt(3)).toEqual({ lensIndex: 0, phase: 0 })
    expect(lens.positionAt(15)).toEqual({ lensIndex: 1, phase: 0 })
  })

  it('rejects nonphysical or nonfinite settings', () => {
    const valid = { nominalLpi: 50, effectiveLpi: 50, ppi: 600, offsetPx: 0 }
    for (const overrides of [{ nominalLpi: 0 }, { effectiveLpi: NaN }, { ppi: -1 }, { offsetPx: Infinity }]) {
      expect(() => createLensModel({ ...valid, ...overrides })).toThrow(RangeError)
    }
  })
})
