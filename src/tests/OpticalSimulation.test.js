import { describe, expect, it } from 'vitest'
import { buildColumnMap } from '../engine/InterlacingEngine.js'
import { createLensModel } from '../engine/LensModel.js'
import { projectAngularColumns, renderAngularFrame, traceDisplacementMm } from '../engine/OpticalSimulation.js'

const settings = { nominalLpi: 50, effectiveLpi: 50, ppi: 600, offsetPx: 0 }
const profile = { depthMm: 0.5, refractiveIndex: 1.5 }
const project = (angleDeg, overrides = {}) => projectAngularColumns({
  rasterWidth: 24, previewWidth: 2, settings, angleDeg, ...profile, ...overrides,
})

function render(angleDeg, offsetPx = 0, viewCount = 2) {
  const printSettings = { ...settings, offsetPx }
  const colors = [[255, 0, 0, 255], [0, 0, 255, 255], [0, 255, 0, 255]]
  const indices = buildColumnMap(24, viewCount, createLensModel(printSettings))
  const source = Uint8ClampedArray.from([...indices].flatMap((i) => colors[i]))
  return [...renderAngularFrame(source, 24, project(angleDeg, { settings: printSettings }))]
}

describe('uncalibrated angular sampling', () => {
  it('traces a neutral and signed displacement with Snell refraction', () => {
    expect(traceDisplacementMm(0, profile)).toBe(0)
    // sin(30°) / 1.5 = 1/3, so tan(thetaInside) = 1 / sqrt(8).
    expect(traceDisplacementMm(30, profile)).toBeCloseTo(0.5 / Math.sqrt(8), 12)
    expect(traceDisplacementMm(-30, profile)).toBeCloseTo(-0.5 / Math.sqrt(8), 12)
  })

  it('selects different stripes at opposite angles, with a continuous linear-light mix between', () => {
    expect(render(30).slice(0, 4)).toEqual([255, 0, 0, 255])
    expect(render(-30).slice(0, 4)).toEqual([0, 0, 255, 255])
    expect(render(0).slice(0, 4)).toEqual([188, 0, 188, 255])
    const near = render(1).slice(0, 4)
    expect(near[0]).toBeGreaterThan(188)
    expect(near[0]).toBeLessThan(255)
    expect(near[2]).toBeGreaterThan(0)
    expect(near[2]).toBeLessThan(188)
  })

  it('uses print offset from the actual raster, and supports three views', () => {
    expect(render(0, 2).slice(0, 4)).toEqual([255, 0, 0, 255])
    expect(render(0, 0, 3).slice(0, 4)).toEqual([0, 0, 255, 255])
  })

  it('keeps fractional-pitch samples inside each aperture and discards out-of-range rays', () => {
    const map = project(0, { settings: { ...settings, ppi: 720 }, rasterWidth: 29 })
    expect(map[0].map(({ x }) => x)).toEqual([5, 6, 7, 8])
    expect(map[1].every(({ x }) => x + 0.5 >= 14.4 && x + 0.5 < 28.8)).toBe(true)
    expect(project(40, { depthMm: 2 })).toEqual([[], []])
    expect([...renderAngularFrame(new Uint8ClampedArray(24 * 4), 24, [[], []])])
      .toEqual([0, 0, 0, 0, 0, 0, 0, 0])
  })
})
