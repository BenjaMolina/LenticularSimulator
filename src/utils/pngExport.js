const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10]
const PNG_MIME = 'image/png'
const nameOf = (bytes) => String.fromCharCode(...bytes.subarray(4, 8))

function pngCrc(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function densityChunk(pixelsPerMeter) {
  const bytes = new Uint8Array(21)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 9)
  bytes.set([112, 72, 89, 115], 4) // pHYs
  view.setUint32(8, pixelsPerMeter)
  view.setUint32(12, pixelsPerMeter)
  view.setUint8(16, 1) // Meter
  view.setUint32(17, pngCrc(bytes.subarray(4, 17)))
  return bytes
}

export async function withPngResolution(png, ppi) {
  const density = Math.round(ppi / 0.0254)
  if (!Number.isFinite(density) || density < 1 || density > 0xffffffff) {
    throw new RangeError('PPI cannot be represented as PNG resolution.')
  }
  const header = new Uint8Array(await png.slice(0, 8).arrayBuffer())
  if (header.length !== 8 || !PNG_SIGNATURE.every((byte, index) => header[index] === byte)) {
    throw new Error('Invalid PNG signature.')
  }

  // Only read chunk headers. Keep the potentially large IDAT data in Blob slices.
  for (let offset = 8; offset + 12 <= png.size;) {
    const bytes = new Uint8Array(await png.slice(offset, offset + 8).arrayBuffer())
    const length = new DataView(bytes.buffer).getUint32(0)
    const name = nameOf(bytes)
    const next = offset + length + 12
    if (next > png.size || (offset === 8 && (name !== 'IHDR' || length !== 13))) break
    if (name === 'pHYs' || name === 'IDAT') {
      const after = name === 'pHYs' ? next : offset
      return new Blob([png.slice(0, offset), densityChunk(density), png.slice(after)], { type: PNG_MIME })
    }
    if (name === 'IEND') break
    offset = next
  }
  throw new Error('Invalid PNG chunk layout.')
}

export async function encodePrintPng(canvas, ppi) {
  const png = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('The browser could not encode the raster as PNG.'))
    }, PNG_MIME)
  })
  return withPngResolution(png, ppi)
}
