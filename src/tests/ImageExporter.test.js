import { describe, expect, it, vi } from 'vitest'
import { createPrintReport, encodePrintTiff } from '../rendering/ImageExporter.js'

function entries(bytes) {
  const data = new DataView(bytes.buffer)
  const directory = data.getUint32(4, true)
  const tags = new Map()
  for (let index = 0; index < data.getUint16(directory, true); index += 1) {
    const start = directory + 2 + index * 12
    tags.set(data.getUint16(start, true), data.getUint32(start + 8, true))
  }
  return { data, tags }
}

describe('TIFF print export', () => {
  it('preserves 8-bit RGBA pixels, strip layout, dimensions and exact PPI', async () => {
    const first = Uint8ClampedArray.from({ length: 16 }, (_, index) => 10 + index)
    const second = Uint8ClampedArray.from({ length: 8 }, (_, index) => 100 + index)
    const read = vi.fn().mockReturnValueOnce({ data: first }).mockReturnValueOnce({ data: second })
    const file = await encodePrintTiff({ width: 2, height: 3, getContext: () => ({ getImageData: read }) }, 720, 2)
    expect(file.type).toBe('image/tiff')
    expect(read.mock.calls).toEqual([[0, 0, 2, 2], [0, 2, 2, 1]])
    const bytes = new Uint8Array(await file.arrayBuffer())
    expect([...bytes.slice(0, 4)]).toEqual([73, 73, 42, 0])
    const { data, tags } = entries(bytes)
    expect([256, 257, 259, 262, 277, 278, 296, 338].map((tag) => tags.get(tag)))
      .toEqual([2, 3, 1, 2, 4, 2, 2, 2])
    expect([...bytes.slice(tags.get(258), tags.get(258) + 8)]).toEqual([8, 0, 8, 0, 8, 0, 8, 0])
    for (const tag of [282, 283]) {
      const ratio = tags.get(tag)
      expect(data.getUint32(ratio, true) / data.getUint32(ratio + 4, true)).toBe(720)
    }
    const offsets = tags.get(273)
    const counts = tags.get(279)
    for (const [index, pixels] of [first, second].entries()) {
      const offset = data.getUint32(offsets + index * 4, true)
      const length = data.getUint32(counts + index * 4, true)
      expect([...bytes.slice(offset, offset + length)]).toEqual([...pixels])
    }
  })

  it('inlines offsets and byte counts for a single strip', async () => {
    const sample = Uint8ClampedArray.of(255, 2, 19, 100)
    const file = await encodePrintTiff({ width: 1, height: 1, getContext: () => ({ getImageData: () => ({ data: sample }) }) }, 600)
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { tags } = entries(bytes)
    expect(tags.get(279)).toBe(4)
    expect([...bytes.slice(tags.get(273))]).toEqual([...sample])
  })
})

it('reports ordered sources, actual raster settings and the uncalibrated boundary', () => {
  expect(createPrintReport({
    size: { width: 4961, height: 7016 }, settings: { ppi: 600, nominalLpi: 50, effectiveLpi: 49.95, offsetPx: 0.5 },
    files: [{ name: 'first.png', data: 'not serialized' }, { name: 'second.png' }],
  })).toEqual({
    schema: 'lenticular.print-job/v1', calibration: 'uncalibrated',
    raster: { widthPx: 4961, heightPx: 7016, ppi: 600, paper: 'A4 portrait' },
    interlace: { nominalLpi: 50, effectiveLpi: 49.95, offsetPx: 0.5, lensOrientation: 'vertical' },
    sources: ['first.png', 'second.png'],
  })
})
