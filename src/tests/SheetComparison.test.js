import { describe, expect, it } from 'vitest'
import { compareSheetProfiles } from '../engine/SheetComparison.js'

const settings = Object.freeze({ nominalLpi: 50, effectiveLpi: 50, ppi: 600, offsetPx: 0 })
const optics = Object.freeze({ sheetLpi: 50, radiusMm: 0.4, depthMm: 1.2, refractiveIndex: 1.5 })
const job = { settings, rasterWidth: 240, previewWidth: 24, viewCount: 2, angleDeg: 12 }

describe('sheet A/B on a fixed print', () => {
  it('returns the same columns and weights for identical profiles', () => {
    const result = compareSheetProfiles({ ...job, opticsA: optics, opticsB: optics })
    expect(result.a).toEqual(result.b)
    expect(result.a.columns).toHaveLength(24)
    expect(result.a.shares[0]).toBeCloseTo(1, 10)
  })

  it('changes only the B response when its sheet changes, retaining the same print and all channels', () => {
    const reference = compareSheetProfiles({ ...job, opticsA: optics, opticsB: optics })
    const compared = compareSheetProfiles({
      ...job, opticsA: optics, opticsB: { ...optics, sheetLpi: 60, depthMm: 0.5 },
    })
    expect(compared.a).toEqual(reference.a)
    expect(compared.b.columns).not.toEqual(reference.b.columns)
    expect(compared.b.shares[0]).toBeLessThan(reference.b.shares[0])
    expect(compared.b.shares).toHaveLength(3)
    expect(compared.b.shares.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 10)
    expect(job.settings).toBe(settings)
    expect(settings.effectiveLpi).toBe(50)
  })
})
