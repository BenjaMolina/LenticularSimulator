import { useCallback, useEffect, useRef, useState } from 'react'
import { MIN_PREVIEW_ANGLE, MAX_PREVIEW_ANGLE } from '../engine/AngularResponse.js'
import { projectAngularColumns, projectCylindricalColumns, renderAngularFrame } from '../engine/OpticalSimulation.js'
import { cylindricalProfileError } from '../engine/RefractionModel.js'
import { drawRgba, sampleRasterRows } from '../rendering/CanvasRenderer.js'
import AngularDiagnostics from './AngularDiagnostics.jsx'
import PrintComparison from './PrintComparison.jsx'
import SheetProfiles from './SheetProfiles.jsx'

const PREVIEW_WIDTH = 360

export default function OpticalPreview({ active, raster, settings, size, viewCount }) {
  const [angleDeg, setAngle] = useState(0)
  const [model, setModel] = useState('cylindrical')
  const [curvedDepth, setCurvedDepth] = useState('1.20')
  const [flatDepth, setFlatDepth] = useState('0.50')
  const [radius, setRadius] = useState('0.40')
  const [sheet, setSheet] = useState('')
  const [index, setIndex] = useState('1.50')
  const [error, setError] = useState('')
  const output = useRef(null)
  const source = useRef(null)
  const previewWidth = Math.min(PREVIEW_WIDTH, size.width)
  const previewHeight = Math.round(previewWidth * size.height / size.width)
  const curved = model === 'cylindrical'
  const depthMm = Number(curved ? curvedDepth : flatDepth)
  const refractiveIndex = Number(index)
  const radiusMm = Number(radius)
  const sheetLpi = sheet.trim() ? Number(sheet) : settings.effectiveLpi
  const issue = curved ? cylindricalProfileError({ depthMm, refractiveIndex, radiusMm, sheetLpi }) :
    (depthMm >= 0.01 && depthMm <= 5 && refractiveIndex >= 1 && refractiveIndex <= 3
      ? null : 'Use a depth of 0.01–5 mm and an index of 1–3.')

  const project = useCallback((angle) => {
    const projection = { rasterWidth: size.width, previewWidth, settings, angleDeg: angle }
    return curved
      ? projectCylindricalColumns({ ...projection, profile: { depthMm, refractiveIndex, radiusMm, sheetLpi } })
      : projectAngularColumns({ ...projection, depthMm, refractiveIndex })
  }, [size.width, previewWidth, settings, curved, depthMm, refractiveIndex, radiusMm, sheetLpi])

  useEffect(() => {
    if (!active || issue) return
    try {
      source.current ??= sampleRasterRows(raster.current, previewHeight)
      const columns = project(angleDeg)
      const pixels = renderAngularFrame(source.current, size.width, columns)
      drawRgba(output.current, pixels)
      setError('')
    } catch (cause) {
      setError(cause.message)
    }
  }, [active, issue, raster, size.width, previewHeight, angleDeg, project])

  return (
    <section className="angular-preview" aria-label="Angular preview" hidden={!active}>
      <p className="muted"><strong>Uncalibrated simulation.</strong> Illustrative parameters; no physical ghosting estimate.</p>
      <label className="angle-control">
        <span>Viewing angle <output>{angleDeg}°</output></span>
        <input type="range" min={MIN_PREVIEW_ANGLE} max={MAX_PREVIEW_ANGLE} step="1" value={angleDeg} aria-label="Viewing angle"
          aria-valuetext={`${angleDeg} degrees`} onChange={(event) => setAngle(Number(event.target.value))} />
      </label>
      <div className="fields">
        <label>Optical model
          <select value={model} onChange={(event) => setModel(event.target.value)}>
            <option value="cylindrical">Cylindrical lens</option>
            <option value="planar">Planar reference</option>
          </select>
        </label>
        <label>Print plane depth (mm)
          <input type="number" min="0" max="5" step="any" value={curved ? curvedDepth : flatDepth}
            onChange={(event) => (curved ? setCurvedDepth : setFlatDepth)(event.target.value)} />
        </label>
        <label>Refractive index
          <input type="number" min="1" max="3" step="any" value={index} onChange={(event) => setIndex(event.target.value)} />
        </label>
        {curved && (
          <>
            <label>Curvature radius (mm)
              <input type="number" min="0" step="any" value={radius} onChange={(event) => setRadius(event.target.value)} />
            </label>
            <label>Sheet LPI (optional)
              <input type="number" min="1" max="300" step="any" value={sheet} placeholder={String(settings.effectiveLpi)}
                onChange={(event) => setSheet(event.target.value)} />
            </label>
          </>
        )}
      </div>
      {curved && <p className="muted">Blank sheet LPI uses the printed effective LPI. A different sheet LPI changes only this preview.</p>}
      {active && (
        <SheetProfiles optics={{ sheetLpi, radiusMm, depthMm, refractiveIndex }} canSave={curved && !issue}
          onApply={(optics) => {
            setModel('cylindrical')
            setSheet(String(optics.sheetLpi))
            setRadius(String(optics.radiusMm))
            setCurvedDepth(String(optics.depthMm))
            setIndex(String(optics.refractiveIndex))
          }} />
      )}
      {(issue || error) && <p className="error" role={issue ? 'status' : 'alert'}>{issue || error}</p>}
      <div className="canvas-stage" hidden={!!(issue || error)}>
        <canvas ref={output} width={previewWidth} height={previewHeight} aria-label="Uncalibrated angular raster" />
      </div>
      {active && !issue && !error && (
        <>
          <AngularDiagnostics rasterWidth={size.width} settings={settings} viewCount={viewCount}
            angleDeg={angleDeg} project={project} />
          <PrintComparison rasterWidth={size.width} settings={settings} viewCount={viewCount}
            angleDeg={angleDeg} project={project} />
        </>
      )}
    </section>
  )
}
