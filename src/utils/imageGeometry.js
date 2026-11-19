export function coverCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = targetWidth / scale
  const height = targetHeight / scale
  return [(sourceWidth - width) / 2, (sourceHeight - height) / 2, width, height]
}
