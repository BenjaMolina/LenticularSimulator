import { describe, expect, it, vi } from 'vitest'
import { defaultTargetAngles, findPitchCandidates } from '../engine/PitchOptimizer.js'

const settings = { nominalLpi: 50, effectiveLpi: 50, ppi: 600, offsetPx: 0 }

describe('bounded theoretical pitch search', () => {
  it('keeps the previous defaults and projects a distinct ordered target for every one of ten views', () => {
    expect(defaultTargetAngles(2)).toEqual([12, -12])
    expect(defaultTargetAngles(3)).toEqual([12, 0, -12])
    const targetAngles = defaultTargetAngles(10)
    expect(targetAngles).toEqual([12, 9, 7, 4, 1, -1, -4, -7, -9, -12])
    const stripeCenters = [0, 1, 2, 4, 5, 6, 7, 8, 10, 11]
    const project = vi.fn((angle) => [[{ x: stripeCenters[targetAngles.indexOf(angle)], weight: 0.9 }]])
    const result = findPitchCandidates({
      rasterWidth: 12, settings, viewCount: 10, targetAngles, lpiRadius: 0, offsetRadius: 0, project,
    })
    expect(project.mock.calls).toEqual(targetAngles.map((angle) => [angle]))
    expect(result.tested).toBe(1)
    expect(result.baseline.worstShare).toBeCloseTo(0.9, 12)
  })

  it('favors the weakest intended view over the higher mean and traces each angle only once', () => {
    const project = vi.fn((angle) => angle > 0
      ? [[{ x: 5, weight: 0.4 }, { x: 0, weight: 0.5 }]]
      : [[{ x: 5, weight: 0.35 }, { x: 6, weight: 0.15 }]])
    const result = findPitchCandidates({
      rasterWidth: 12, settings, viewCount: 2, targetAngles: [12, -12],
      lpiRadius: 0, offsetRadius: 0.5, project,
    })
    expect(project.mock.calls).toEqual([[12], [-12]])
    expect(result.tested).toBe(3)
    expect(result.baseline.meanShare).toBeCloseTo(0.525, 12)
    expect(result.baseline.worstShare).toBeCloseTo(0.15, 12)
    expect(result.best[0]).toMatchObject({ effectiveLpi: 50, offsetPx: -0.5, worstShare: 0.5, meanShare: 0.5 })
  })

  it('omits undersampled candidates, returns at most five, and favors baseline proximity on ties', () => {
    const result = findPitchCandidates({
      rasterWidth: 30, settings: { ...settings, effectiveLpi: 200 }, viewCount: 3, targetAngles: [12, 0, -12],
      lpiRadius: 0.1, offsetRadius: 0.5, project: () => [[]],
    })
    expect(result.tested).toBe(9)
    expect(result.best).toHaveLength(5)
    expect(result.best[0]).toMatchObject({ effectiveLpi: 200, offsetPx: 0, worstShare: 0 })
    expect(result.best.every(({ effectiveLpi }) => effectiveLpi <= 200)).toBe(true)
  })

  it('caps the grid at 231 candidates and rejects invalid ranges or target angles before tracing', () => {
    const project = vi.fn(() => [[]])
    const options = {
      rasterWidth: 12, settings, viewCount: 2, targetAngles: [12, -12],
      lpiRadius: 0.5, offsetRadius: 2.5, project,
    }
    const bad = [
      { lpiRadius: 0.55 }, { offsetRadius: 2.6 }, { lpiRadius: 0.03 }, { offsetRadius: -0.5 },
      { targetAngles: [0, 0] }, { targetAngles: [41, 0] }, { targetAngles: [12] },
    ]
    for (const overrides of bad) expect(() => findPitchCandidates({ ...options, ...overrides })).toThrow(RangeError)
    expect(project).not.toHaveBeenCalled()
    expect(findPitchCandidates(options).tested).toBe(231)
  })
})
