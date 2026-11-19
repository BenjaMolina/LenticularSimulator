import { describe, expect, it, vi } from 'vitest'
import { comparePrintSettings, comparePrintSweep } from '../engine/PrintComparison.js'
import { projectCylindricalColumns } from '../engine/OpticalSimulation.js'

const settings = { nominalLpi: 50, effectiveLpi: 50, ppi: 600, offsetPx: 0 }
const profile = { sheetLpi: 50, radiusMm: 0.4, depthMm: 1.2, refractiveIndex: 1.5 }
const geometry = { rasterWidth: 24, previewWidth: 2, settings }
const project = (angleDeg) => projectCylindricalColumns({ ...geometry, angleDeg, profile })

describe('modeled print comparison', () => {
  it('uses the same projection once and returns identical shares for identical settings', () => {
    const trace = vi.fn(project)
    const result = comparePrintSettings({
      ...geometry, angleDeg: 38, viewCount: 2, project: trace, candidate: { effectiveLpi: 50, offsetPx: 0 },
    })
    expect(trace).toHaveBeenCalledExactlyOnceWith(38)
    expect(result.current).toEqual(result.candidate)
    expect(result.current[2]).toBeGreaterThan(0)
  })

  it('compares offsets without changing sheet geometry or the current print assignment', () => {
    const result = comparePrintSettings({
      ...geometry, angleDeg: 12, viewCount: 2, project, candidate: { effectiveLpi: 50, offsetPx: 6 },
    })
    expect(result.current[0]).toBeCloseTo(1, 12)
    expect(result.candidate[1]).toBeCloseTo(1, 12)
    expect(result.candidate[2]).toBeCloseTo(result.current[2], 12)
    expect(settings.offsetPx).toBe(0)
  })

  it('compares fractional print pitch using the same sampled columns for three views', () => {
    const result = comparePrintSettings({
      ...geometry, rasterWidth: 120, angleDeg: 0, viewCount: 3,
      project: () => [[{ x: 59, weight: 0.75 }]],
      candidate: { effectiveLpi: 55, offsetPx: 0 },
    })
    expect(result.current).toEqual([0, 0, 0.75, 0.25])
    expect(result.candidate).toEqual([0, 0.75, 0, 0.25])
  })

  it('rejects a candidate whose raster cannot resolve all views', () => {
    expect(() => comparePrintSettings({
      ...geometry, angleDeg: 0, viewCount: 3, project, candidate: { effectiveLpi: 250, offsetPx: 0 },
    })).toThrow('Configuration B needs at least one raster pixel per view per lens.')
  })

  it('compares the same rays at every angle without changing A or unassigned weights', () => {
    const trace = vi.fn(project)
    const angles = [-38, -12, 0, 12, 38]
    const options = { ...geometry, viewCount: 2, candidate: { effectiveLpi: 50, offsetPx: 6 } }
    const sweep = comparePrintSweep({ ...options, angles, project: trace })
    expect(trace.mock.calls).toEqual(angles.map((angle) => [angle]))
    expect(sweep.current.map(({ angleDeg }) => angleDeg)).toEqual(angles)
    expect(sweep.candidate.map(({ angleDeg }) => angleDeg)).toEqual(angles)
    for (const [index, angleDeg] of angles.entries()) {
      const single = comparePrintSettings({ ...options, angleDeg, project })
      expect(sweep.current[index].shares).toEqual(single.current)
      expect(sweep.candidate[index].shares).toEqual(single.candidate)
      expect(sweep.current[index].shares[2]).toBeCloseTo(sweep.candidate[index].shares[2], 12)
    }
    expect(sweep.current[3].shares[0]).toBeCloseTo(1, 12)
    expect(sweep.candidate[3].shares[1]).toBeCloseTo(1, 12)
  })

  it('does not project a sweep for an undersampled B', () => {
    const trace = vi.fn(project)
    expect(() => comparePrintSweep({
      ...geometry, viewCount: 3, angles: [-12, 0, 12], project: trace,
      candidate: { effectiveLpi: 250, offsetPx: 0 },
    })).toThrow(RangeError)
    expect(trace).not.toHaveBeenCalled()
  })
})
