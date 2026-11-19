import { isSupportedViewCount, MIN_VIEWS, MAX_VIEWS } from './ViewCount.js'

export function buildColumnMap(width, viewCount, lens, startX = 0) {
  if (!isSupportedViewCount(viewCount)) throw new RangeError(`Between ${MIN_VIEWS} and ${MAX_VIEWS} views are required.`)
  const map = new Uint8Array(width)

  for (let x = 0; x < width; x += 1) {
    const stripe = lens.stripeAt(startX + x + 0.5, viewCount)
    map[x] = ((stripe % viewCount) + viewCount) % viewCount
  }

  return map
}

export function copySourceBand(output, source, columnMap, viewIndex) {
  // Copy one complete RGBA pixel at a time without interpreting its byte order.
  const dst = new Uint32Array(output.buffer, output.byteOffset, output.length / 4)
  const src = new Uint32Array(source.buffer, source.byteOffset, source.length / 4)
  const width = columnMap.length
  for (let rowStart = 0; rowStart < dst.length; rowStart += width) {
    for (let x = 0; x < width; x += 1) {
      if (columnMap[x] === viewIndex) dst[rowStart + x] = src[rowStart + x]
    }
  }
}
