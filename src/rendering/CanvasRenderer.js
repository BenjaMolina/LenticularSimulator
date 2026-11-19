export function sampleRasterRows(raster, height) {
  const strip = document.createElement('canvas')
  strip.width = raster.width
  strip.height = height
  const context = strip.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable for the angular preview.')
  context.imageSmoothingEnabled = false
  context.drawImage(raster, 0, 0, strip.width, strip.height)
  return context.getImageData(0, 0, strip.width, strip.height).data
}

export function drawRgba(canvas, pixels) {
  const context = canvas.getContext('2d')
  if (!context || context.isContextLost?.()) throw new Error('Canvas 2D is unavailable for the angular preview.')
  context.putImageData(new ImageData(pixels, canvas.width, canvas.height), 0, 0)
}
