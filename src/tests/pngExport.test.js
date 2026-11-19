import { crc32 } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { withPngResolution } from '../utils/pngExport.js'

const basePng = new Blob([Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/uoQAAAAASUVORK5CYII=',
  'base64',
)], { type: 'image/png' })

async function chunks(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const view = new DataView(bytes.buffer)
  const result = []
  for (let offset = 8; offset < bytes.length;) {
    const size = view.getUint32(offset)
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8))
    const next = offset + size + 12
    result.push({ type, bytes: bytes.slice(offset, next) })
    offset = next
  }
  return result
}

describe('print PNG resolution', () => {
  it('sets square-pixel density and preserves all original image chunks', async () => {
    const updated = await withPngResolution(basePng, 600)
    expect(updated.type).toBe('image/png')
    const result = await chunks(updated)
    expect(result.map(({ type }) => type)).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND'])
    const { bytes } = result[1]
    const chunk = new DataView(bytes.buffer)
    expect(chunk.getUint32(8)).toBe(23622)
    expect(chunk.getUint32(12)).toBe(23622)
    expect(chunk.getUint8(16)).toBe(1)
    expect(chunk.getUint32(17)).toBe(crc32(bytes.subarray(4, 17)))
    expect(result.filter(({ type }) => type !== 'pHYs')).toEqual(await chunks(basePng))
  })

  it('replaces previous resolution rather than adding a duplicate chunk', async () => {
    const old = await withPngResolution(basePng, 96)
    const updated = await withPngResolution(old, 720)
    const result = await chunks(updated)
    expect(result.filter(({ type }) => type === 'pHYs')).toHaveLength(1)
    expect(new DataView(result[1].bytes.buffer).getUint32(8)).toBe(28346)
  })

  it('rejects invalid PPI or a truncated canvas encoding', async () => {
    await expect(withPngResolution(basePng, 0)).rejects.toThrow(RangeError)
    await expect(withPngResolution(basePng.slice(0, 22), 600)).rejects.toThrow('Invalid PNG')
  })
})
