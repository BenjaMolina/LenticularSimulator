import { useEffect, useRef, useState } from 'react'
import { projectAngularColumns, renderAngularFrame } from '../engine/OpticalSimulation.js'

const PREVIEW_WIDTH = 360

function sampleRows(raster, height) {
  const strip = document.createElement('canvas')
  strip.width = raster.width
  strip.height = height
  const context = strip.getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable for the angular preview.')
  context.imageSmoothingEnabled = false
  context.drawImage(raster, 0, 0, strip.width, strip.height)
  return context.getImageData(0, 0, strip.width, strip.height).data
}

export default function OpticalPreview({ active, raster, settings, size }) {
  const [angleDeg, setAngle] = useState(0)
  const [depth, setDepth] = useState('0.50')
  const [index, setIndex] = useState('1.50')
  const [error, setError] = useState('')
  const output = useRef(null)
  const source = useRef(null)
  const previewWidth = Math.min(PREVIEW_WIDTH, size.width)
  const previewHeight = Math.round(previewWidth * size.height / size.width)
  const depthMm = Number(depth)
  const refractiveIndex = Number(index)
  const valid = depthMm >= 0.01 && depthMm <= 5 && refractiveIndex >= 1 && refractiveIndex <= 3

  useEffect(() => {
    if (!active || !valid) return
    try {
      source.current ??= sampleRows(raster.current, previewHeight)
      const columns = projectAngularColumns({
        rasterWidth: size.width, previewWidth, settings, angleDeg, depthMm, refractiveIndex,
      })
      const pixels = renderAngularFrame(source.current, size.width, columns)
      const context = output.current.getContext('2d')
      if (!context || context.isContextLost?.()) throw new Error('Canvas 2D is unavailable for the angular preview.')
      context.putImageData(new ImageData(pixels, previewWidth, previewHeight), 0, 0)
      setError('')
    } catch (cause) {
      setError(cause.message)
    }
  }, [active, valid, raster, settings, size.width, previewWidth, previewHeight, angleDeg, depthMm, refractiveIndex])

  return (
    <section className="angular-preview" aria-label="Angular preview" hidden={!active}>
      <p className="muted"><strong>Uncalibrated simulation.</strong> Illustrative parameters; no physical ghosting estimate.</p>
      <label className="angle-control">
        <span>Viewing angle <output>{angleDeg}°</output></span>
        <input type="range" min="-40" max="40" step="1" value={angleDeg} aria-label="Viewing angle"
          aria-valuetext={`${angleDeg} degrees`} onChange={(event) => setAngle(Number(event.target.value))} />
      </label>
      <div className="fields">
        <label>Print plane depth (mm)
          <input type="number" min="0.01" max="5" step="any" value={depth} onChange={(event) => setDepth(event.target.value)} />
        </label>
        <label>Refractive index
          <input type="number" min="1" max="3" step="any" value={index} onChange={(event) => setIndex(event.target.value)} />
        </label>
      </div>
      {!valid && <p className="error" role="status">Use a depth of 0.01–5 mm and an index of 1–3.</p>}
      {valid && error && <p className="error" role="alert">{error}</p>}
      <div className="canvas-stage" hidden={!valid || !!error}>
        <canvas ref={output} width={previewWidth} height={previewHeight} aria-label="Uncalibrated angular raster" />
      </div>
    </section>
  )
}
