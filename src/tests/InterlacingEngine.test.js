import { describe, expect, it } from 'vitest'
import { buildColumnMap, copySourceBand } from '../engine/InterlacingEngine.js'
import { a4Raster, createLensModel } from '../engine/LensModel.js'

const colors = [
  [230, 45, 20, 255],
  [20, 200, 76, 255],
  [39, 95, 230, 255],
]
const lens = (ppi = 600, effectiveLpi = 50, offsetPx = 0) =>
  createLensModel({ nominalLpi: 50, effectiveLpi, ppi, offsetPx })

function verifyColors(columnMap, expected, count, rows = 2) {
  const width = expected.length
  const output = new Uint8ClampedArray(width * rows * 4)
  for (let index = 0; index < count; index += 1) {
    const data = new Uint8ClampedArray(width * rows * 4)
    for (let pixel = 0; pixel < width * rows; pixel += 1) {
      const color = [...colors[index]]
      if (pixel >= width) color[3] = 128
      data.set(color, pixel * 4)
    }
    copySourceBand(output, data, columnMap, index)
  }
  for (let row = 0; row < rows; row += 1) {
    const pixels = expected.flatMap((index) => [...colors[index].slice(0, 3), row ? 128 : 255])
    expect([...output.slice(row * width * 4, (row + 1) * width * 4)]).toEqual(pixels)
  }
}

const runs = (...groups) => groups.flatMap(([index, length]) => Array(length).fill(index))

describe('vertical interlacing', () => {
  it('writes six columns per view at 50 LPI / 600 PPI with two views', () => {
    const expected = runs([0, 6], [1, 6], [0, 6], [1, 6])
    verifyColors(buildColumnMap(24, 2, lens()), expected, 2)
  })

  it('writes four columns per view at 50 LPI / 600 PPI with three views', () => {
    const expected = runs([0, 4], [1, 4], [2, 4], [0, 4], [1, 4], [2, 4])
    verifyColors(buildColumnMap(24, 3, lens()), expected, 3)
  })

  it('distributes fractional stripes instead of rounding each lens at 720 PPI', () => {
    const expected = runs([0, 7], [1, 7], [0, 8], [1, 7], [0, 7])
    verifyColors(buildColumnMap(36, 2, lens(720)), expected, 2)
  })

  it('wraps positive and negative fractional offsets and assigns exact ties to the next stripe', () => {
    expect([...buildColumnMap(8, 2, lens(600, 50, 2.5))]).toEqual([1, 1, 0, 0, 0, 0, 0, 0])
    expect([...buildColumnMap(8, 2, lens(600, 50, -0.5))]).toEqual([0, 0, 0, 0, 0, 1, 1, 1])
    expect(buildColumnMap(421, 3, lens(720, 50.4, 0.5))[400]).toBe(0)
  })

  it('matches an integer oracle over A4 and preserves the same column phase in far-away crops', () => {
    const model = lens(720, 49.95, -0.25)
    const { width } = a4Raster(720)
    const expectedAt = (x) => Math.floor(((4 * x + 3) * 999) / 19200) % 3
    expect([...buildColumnMap(width, 3, model)]).toEqual(Array.from({ length: width }, (_, x) => expectedAt(x)))
    const start = 125_007
    expect([...buildColumnMap(257, 3, model, start)]).toEqual(
      Array.from({ length: 257 }, (_, x) => expectedAt(start + x)),
    )
  })
})
