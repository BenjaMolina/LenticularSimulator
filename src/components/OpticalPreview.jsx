import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { MIN_PREVIEW_ANGLE, MAX_PREVIEW_ANGLE } from '../engine/AngularResponse.js'
import { projectAngularColumns, projectCylindricalColumns, renderAngularFrame, VIEWING_DISTANCE_MM, viewingDistanceError } from '../engine/OpticalSimulation.js'
import { cylindricalProfileError } from '../engine/RefractionModel.js'
import { drawRgba, sampleRasterRows } from '../rendering/CanvasRenderer.js'
import AngularDiagnostics from './AngularDiagnostics.jsx'
import PrintComparison from './PrintComparison.jsx'
import SheetComparison from './SheetComparison.jsx'
import SheetProfiles from './SheetProfiles.jsx'
import WorkspaceTabs, { WorkspaceTabPanel } from './WorkspaceTabs.jsx'

const PREVIEW_WIDTH = 360
const COMPARISON_TABS = [['sheet', 'Sheet profiles'], ['print', 'Print settings']]

function ViewingControls({ angleDeg, setAngle, distance, setDistance }) {
  const hintId = useId()
  return (
    <div className="viewing-controls">
      <label className="angle-control">
        <span>Viewing angle <output>{angleDeg}°</output></span>
        <input type="range" min={MIN_PREVIEW_ANGLE} max={MAX_PREVIEW_ANGLE} step="1" value={angleDeg} aria-label="Viewing angle"
          aria-valuetext={`${angleDeg} degrees`} onChange={(event) => setAngle(Number(event.target.value))} />
      </label>
      <div className="fields">
        <label>Viewing distance (mm)
          <input type="number" min={VIEWING_DISTANCE_MM.min} max={VIEWING_DISTANCE_MM.max} step="any"
            placeholder="Parallel rays" aria-describedby={hintId} value={distance} onChange={(event) => setDistance(event.target.value)} />
        </label>
      </div>
      <p className="muted" id={hintId}>Distance is measured perpendicular to the sheet. Leave blank for parallel rays.</p>
    </div>
  )
}

export default function OpticalPreview({ tab, tabsId, raster, settings, size, viewCount }) {
  const [angleDeg, setAngle] = useState(0)
  const [distance, setDistance] = useState('')
  const [comparison, setComparison] = useState('sheet')
  const comparisonId = useId()
  const [model, setModel] = useState('cylindrical')
  const [curvedDepth, setCurvedDepth] = useState('1.20')
  const [flatDepth, setFlatDepth] = useState('0.50')
  const [radius, setRadius] = useState('0.40')
  const [sheet, setSheet] = useState('')
  const [index, setIndex] = useState('1.50')
  const [error, setError] = useState('')
  const output = useRef(null)
  const source = useRef(null)
  const active = tab === 'angular'
  const comparing = tab === 'compare'
  const comparingPrint = comparing && comparison === 'print'
  const previewWidth = Math.min(PREVIEW_WIDTH, size.width)
  const previewHeight = Math.round(previewWidth * size.height / size.width)
  const curved = model === 'cylindrical'
  const depthMm = Number(curved ? curvedDepth : flatDepth)
  const refractiveIndex = Number(index)
  const radiusMm = Number(radius)
  const sheetLpi = sheet.trim() ? Number(sheet) : settings.effectiveLpi
  const opticsIssue = curved ? cylindricalProfileError({ depthMm, refractiveIndex, radiusMm, sheetLpi }) :
    (depthMm >= 0.01 && depthMm <= 5 && refractiveIndex >= 1 && refractiveIndex <= 3
      ? null : 'Use a depth of 0.01–5 mm and an index of 1–3.')
  const viewingDistanceMm = distance.trim() ? Number(distance) : undefined
  const distanceIssue = viewingDistanceError(viewingDistanceMm)
  const issue = distanceIssue || opticsIssue
  const viewingControls = { angleDeg, setAngle, distance, setDistance }

  const project = useCallback((angle) => {
    const projection = { rasterWidth: size.width, previewWidth, settings, angleDeg: angle, viewingDistanceMm }
    return curved
      ? projectCylindricalColumns({ ...projection, profile: { depthMm, refractiveIndex, radiusMm, sheetLpi } })
      : projectAngularColumns({ ...projection, depthMm, refractiveIndex })
  }, [size.width, previewWidth, settings, curved, depthMm, refractiveIndex, radiusMm, sheetLpi, viewingDistanceMm])

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
    <>
      <WorkspaceTabPanel id={tabsId} tab="angular" active={active} className="angular-preview">
        <p className="muted"><strong>Uncalibrated simulation.</strong> Illustrative parameters; no physical ghosting estimate.</p>
        <ViewingControls {...viewingControls} />
        {(issue || error) && <p className="error" role={issue ? 'status' : 'alert'}>{issue || error}</p>}
        <div className="canvas-stage" hidden={!!(issue || error)}>
          <canvas ref={output} width={previewWidth} height={previewHeight} aria-label="Uncalibrated angular raster" />
        </div>
        <details className="sheet-profiles">
          <summary>Optical settings</summary>
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
        </details>
        <SheetProfiles optics={{ sheetLpi, radiusMm, depthMm, refractiveIndex }} canSave={curved && !opticsIssue}
          onApply={(optics) => {
            setModel('cylindrical')
            setSheet(String(optics.sheetLpi))
            setRadius(String(optics.radiusMm))
            setCurvedDepth(String(optics.depthMm))
            setIndex(String(optics.refractiveIndex))
          }} />
        {active && !issue && !error && (
          <AngularDiagnostics rasterWidth={size.width} settings={settings} viewCount={viewCount}
            angleDeg={angleDeg} project={project} />
        )}
      </WorkspaceTabPanel>
      <WorkspaceTabPanel id={tabsId} tab="compare" active={comparing} className="comparison-workspace">
        <WorkspaceTabs id={comparisonId} label="Comparison type" tabs={COMPARISON_TABS}
          selected={comparison} onSelect={setComparison} compact />
        <ViewingControls {...viewingControls} />
        {distanceIssue && <p className="error" role="status">{distanceIssue}</p>}
        <WorkspaceTabPanel id={comparisonId} tab="sheet" active={comparison === 'sheet'}>
          <div hidden={!!distanceIssue}>
            <SheetComparison active={comparing && comparison === 'sheet' && !distanceIssue} raster={raster} settings={settings}
              size={size} viewCount={viewCount} angleDeg={angleDeg} viewingDistanceMm={viewingDistanceMm} />
          </div>
        </WorkspaceTabPanel>
        <WorkspaceTabPanel id={comparisonId} tab="print" active={comparison === 'print'}>
          {!distanceIssue && opticsIssue && <p className="error" role="status">Fix the optical settings in Angular preview: {opticsIssue}</p>}
          <div hidden={!!issue}>
            <PrintComparison active={comparingPrint && !issue} rasterWidth={size.width} settings={settings}
              viewCount={viewCount} angleDeg={angleDeg} project={project} />
          </div>
        </WorkspaceTabPanel>
      </WorkspaceTabPanel>
    </>
  )
}
