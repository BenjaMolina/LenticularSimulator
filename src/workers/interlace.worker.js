import { buildColumnMap, copySourceBand } from '../engine/InterlacingEngine.js'
import { createLensModel } from '../engine/LensModel.js'
import { coverCrop } from '../utils/imageGeometry.js'

const BAND_HEIGHT = 64
let job

async function prepare({ files, size, settings }) {
  const { width, height } = size
  const columnMap = buildColumnMap(width, files.length, createLensModel(settings))
  const canvas = new OffscreenCanvas(width, Math.min(BAND_HEIGHT, height))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D is unavailable.')
  context.imageSmoothingQuality = 'high'
  const views = []
  job = { context, views, columnMap, width, height, top: 0 }

  for (const file of files) {
    let bitmap
    try {
      bitmap = await createImageBitmap(file)
    } catch {
      throw new Error(`Could not decode "${file.name}". Replace it with a valid image.`)
    }
    views.push({ bitmap, crop: coverCrop(bitmap.width, bitmap.height, width, height) })
  }
}

function renderBand() {
  const { context, views, columnMap, width, height, top } = job
  const rows = Math.min(BAND_HEIGHT, height - top)
  const pixels = new Uint8ClampedArray(width * rows * 4)

  for (const [index, { bitmap, crop }] of views.entries()) {
    context.clearRect(0, 0, width, rows)
    context.drawImage(bitmap, ...crop, 0, -top, width, height)
    const source = context.getImageData(0, 0, width, rows)
    copySourceBand(pixels, source.data, columnMap, index)
  }

  job.top += rows
  self.postMessage({ type: 'band', top, rows, pixels }, [pixels.buffer])
  if (job.top === height) release()
}

function release() {
  job?.views.forEach(({ bitmap }) => bitmap.close())
  job = undefined
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'start') await prepare(data)
    renderBand()
  } catch (error) {
    release()
    self.postMessage({ type: 'error', message: error.message })
  }
}
