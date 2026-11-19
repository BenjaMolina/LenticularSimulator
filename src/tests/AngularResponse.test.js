import { describe, expect, it } from 'vitest'
import { buildAngularResponse } from '../engine/AngularResponse.js'
import { projectAngularColumns, projectCylindricalColumns } from '../engine/OpticalSimulation.js'

const settings = { nominalLpi: 50, effectiveLpi: 50, ppi: 600, offsetPx: 0 }
const geometry = { rasterWidth: 24, previewWidth: 2, settings }

describe('modeled angular response', () => {
  it('averages over all preview columns and leaves rejected weight unassigned', () => {
    const response = buildAngularResponse({
      ...geometry, viewCount: 2, angles: [0],
      project: () => [[{ x: 0, weight: 0.7 }, { x: 6, weight: 0.1 }], []],
    })
    expect(response[0].angleDeg).toBe(0)
    expect(response[0].shares).toEqual([0.35, 0.05, expect.closeTo(0.6, 12)])

    const rejected = buildAngularResponse({
      ...geometry, viewCount: 2, angles: [-40], project: () => [[], []],
    })
    expect(rejected).toEqual([{ angleDeg: -40, shares: [0, 0, 1] }])
  })

  it('tracks the cylindrical projector across opposite angles for two views', () => {
    const profile = { sheetLpi: 50, radiusMm: 0.4, depthMm: 1.2, refractiveIndex: 1.5 }
    const response = buildAngularResponse({
      ...geometry, viewCount: 2, angles: [-12, 0, 12],
      project: (angleDeg) => projectCylindricalColumns({ ...geometry, angleDeg, profile }),
    })
    expect(response.map(({ angleDeg }) => angleDeg)).toEqual([-12, 0, 12])
    expect(response[0].shares[1]).toBeCloseTo(1, 12)
    expect(response[1].shares[0]).toBeCloseTo(0.5, 12)
    expect(response[1].shares[1]).toBeCloseTo(0.5, 12)
    expect(response[2].shares[0]).toBeCloseTo(1, 12)
    for (const { shares } of response) expect(shares.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(1, 12)
  })

  it('uses printed offset and retains all three channels in the planar reference', () => {
    const printSettings = { ...settings, offsetPx: 2, ppi: 720 }
    const response = buildAngularResponse({
      ...geometry, settings: printSettings, viewCount: 3, angles: [0],
      project: (angleDeg) => projectAngularColumns({
        ...geometry, settings: printSettings, angleDeg, depthMm: 0.5, refractiveIndex: 1.5,
      }),
    })
    const [first, second, third, unassigned] = response[0].shares
    expect(first).toBeGreaterThan(0)
    expect(second).toBeGreaterThan(0)
    expect(third).toBe(0)
    expect(unassigned).toBeCloseTo(0, 12)
  })
})
