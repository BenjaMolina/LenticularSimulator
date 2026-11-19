import { mkdirSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'

const WIDTH = 420
const HEIGHT = 594

function chunk(name, payload) {
  const bytes = Buffer.alloc(12 + payload.length)
  bytes.writeUInt32BE(payload.length)
  bytes.write(name, 4, 'ascii')
  payload.copy(bytes, 8)
  bytes.writeUInt32BE(crc32(bytes.subarray(4, bytes.length - 4)), bytes.length - 4)
  return bytes
}

function target(firstView) {
  const stride = WIDTH + 1
  const raster = Buffer.alloc(stride * HEIGHT)
  function fill(x, y, width, height, value) {
    for (let row = y; row < y + height; row += 1) {
      raster.fill(value, row * stride + 1 + x, row * stride + 1 + x + width)
    }
  }

  fill(0, 0, WIDTH, HEIGHT, 240)
  fill(54, 70, 150, 96, 0)
  fill(56, 72, 146, 92, 255) // White reference, shared by both views.
  fill(216, 70, 150, 96, 0) // Black reference, shared by both views.
  fill(56, 212, 308, 110, firstView ? 255 : 0)
  fill(56, 356, 308, 110, firstView ? 0 : 255)
  fill(110, 520, 201, 2, 0)
  fill(110, 512, 1, 18, 0)
  fill(310, 512, 1, 18, 0) // 200 pixels between tick centers = 100 mm on A4.

  const header = Buffer.alloc(13)
  header.writeUInt32BE(WIDTH, 0)
  header.writeUInt32BE(HEIGHT, 4)
  header[8] = 8
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raster)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const directory = new URL('../public/calibration/', import.meta.url)
mkdirSync(directory, { recursive: true })
for (const [name, firstView] of [['view-a.png', true], ['view-b.png', false]]) {
  writeFileSync(new URL(name, directory), target(firstView))
}
