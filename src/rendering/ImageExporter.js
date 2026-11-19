const TIFF_SHORT = 3
const TIFF_LONG = 4
const TIFF_RATIONAL = 5
const MAX_UINT32 = 0xffffffff
const CHANNELS = 4

function tiffHeader(width, height, ppi, rowsPerStrip) {
  if (![width, height, ppi, rowsPerStrip].every((value) => Number.isInteger(value) && value > 0 && value <= MAX_UINT32)) {
    throw new RangeError('TIFF dimensions, PPI, and strip height must be positive integers.')
  }

  const strips = Math.ceil(height / rowsPerStrip)
  const bitsOffset = 8 + 2 + 14 * 12 + 4
  const resolutionOffset = bitsOffset + 8
  const offsetsOffset = resolutionOffset + 8
  const countsOffset = offsetsOffset + (strips > 1 ? strips * 4 : 0)
  const firstPixel = countsOffset + (strips > 1 ? strips * 4 : 0)
  const pixelBytes = width * height * CHANNELS
  if (firstPixel + pixelBytes > MAX_UINT32) throw new RangeError('The raster is too large for classic TIFF.')

  const tags = [
    [256, TIFF_LONG, 1, width], [257, TIFF_LONG, 1, height],
    [258, TIFF_SHORT, CHANNELS, bitsOffset], [259, TIFF_SHORT, 1, 1],
    [262, TIFF_SHORT, 1, 2], [273, TIFF_LONG, strips, strips === 1 ? firstPixel : offsetsOffset],
    [277, TIFF_SHORT, 1, CHANNELS], [278, TIFF_LONG, 1, rowsPerStrip],
    [279, TIFF_LONG, strips, strips === 1 ? pixelBytes : countsOffset],
    [282, TIFF_RATIONAL, 1, resolutionOffset], [283, TIFF_RATIONAL, 1, resolutionOffset],
    [284, TIFF_SHORT, 1, 1], [296, TIFF_SHORT, 1, 2], [338, TIFF_SHORT, 1, 2],
  ]

  const bytes = new Uint8Array(firstPixel)
  const data = new DataView(bytes.buffer)
  // Classic little-endian TIFF, one image directory, uncompressed chunky RGBA.
  bytes.set([73, 73, 42, 0])
  data.setUint32(4, 8, true)
  data.setUint16(8, tags.length, true)
  tags.forEach(([tag, type, count, value], index) => {
    const offset = 10 + index * 12
    data.setUint16(offset, tag, true)
    data.setUint16(offset + 2, type, true)
    data.setUint32(offset + 4, count, true)
    data.setUint32(offset + 8, value, true)
  })
  for (let channel = 0; channel < CHANNELS; channel += 1) data.setUint16(bitsOffset + 2 * channel, 8, true)
  data.setUint32(resolutionOffset, ppi, true)
  data.setUint32(resolutionOffset + 4, 1, true)
  for (let strip = 0; strips > 1 && strip < strips; strip += 1) {
    const top = strip * rowsPerStrip
    data.setUint32(offsetsOffset + strip * 4, firstPixel + top * width * CHANNELS, true)
    data.setUint32(countsOffset + strip * 4, Math.min(rowsPerStrip, height - top) * width * CHANNELS, true)
  }
  return bytes
}

export async function encodePrintTiff(canvas, ppi, rowsPerStrip = 64) {
  const { width, height } = canvas
  const parts = [tiffHeader(width, height, ppi, rowsPerStrip)]
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable for TIFF export.')

  for (let top = 0; top < height; top += rowsPerStrip) {
    if (context.isContextLost?.()) throw new Error('The print canvas was lost during TIFF export.')
    const pixels = context.getImageData(0, top, width, Math.min(rowsPerStrip, height - top)).data
    parts.push(new Blob([pixels]))
    if (top + rowsPerStrip < height && parts.length % 8 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
  return new Blob(parts, { type: 'image/tiff' })
}

export function createPrintReport({ size, settings, files, printerProfile }) {
  const { ppi, nominalLpi, effectiveLpi, offsetPx } = settings
  const preset = printerProfile?.rasterPpi === ppi ? printerProfile : null
  return {
    schema: 'lenticular.print-job/v1',
    calibration: 'uncalibrated',
    raster: { widthPx: size.width, heightPx: size.height, ppi, paper: 'A4 portrait' },
    interlace: { nominalLpi, effectiveLpi, offsetPx, lensOrientation: 'vertical' },
    sources: files.map(({ name }) => name),
    ...(preset ? { printerPreset: { name: preset.name, printer: preset.printer, media: preset.media, notes: preset.notes } } : {}),
  }
}
