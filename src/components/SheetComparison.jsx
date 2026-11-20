import { useEffect, useMemo, useRef, useState } from 'react'
import { compareSheetProfiles } from '../engine/SheetComparison.js'
import { renderAngularFrame } from '../engine/OpticalSimulation.js'
import { drawRgba, sampleRasterRows } from '../rendering/CanvasRenderer.js'
import { listSheetProfiles } from '../utils/sheetProfileStorage.js'

const percent = (weight) => `${(weight * 100).toFixed(1)}%`

function ProfileCard({ side, entries, choice, onChange, profile, canvas, width, height, showImage }) {
  return (
    <div className="sheet-card">
      <div className="fields">
        <label>Sheet profile {side}
          <select value={choice} onChange={(event) => onChange(event.target.value)}>
            <option value="">Choose a saved profile</option>
            {entries.map(({ id, profile }) => <option key={id} value={id}>{profile.name} · {profile.optics.sheetLpi} LPI</option>)}
          </select>
        </label>
      </div>
      {profile && <p className="muted">
        {profile.optics.sheetLpi} LPI · R {profile.optics.radiusMm} mm · Depth {profile.optics.depthMm} mm · n {profile.optics.refractiveIndex}
      </p>}
      <div className="canvas-stage sheet-frame" hidden={!showImage}>
        <canvas ref={canvas} width={width} height={height} aria-label={`Sheet profile ${side} modeled preview`} />
      </div>
    </div>
  )
}

export default function SheetComparison({ active, raster, settings, size, viewCount, angleDeg, viewingDistanceMm }) {
  const [entries, setEntries] = useState([])
  const [choices, setChoices] = useState({ a: '', b: '' })
  const [storageError, setStorageError] = useState('')
  const [canvasError, setCanvasError] = useState('')
  const input = useRef(null)
  const canvasA = useRef(null)
  const canvasB = useRef(null)
  const width = Math.min(240, size.width)
  const height = Math.round(width * size.height / size.width)

  useEffect(() => {
    if (!active) return
    try {
      const { entries: saved } = listSheetProfiles(window.localStorage)
      setEntries(saved)
      setChoices((previous) => ({
        a: saved.some(({ id }) => id === previous.a) ? previous.a : saved[0]?.id ?? '',
        b: saved.some(({ id }) => id === previous.b) ? previous.b : saved[1]?.id ?? '',
      }))
      setStorageError('')
    } catch {
      setEntries([])
      setStorageError('Saved sheet profiles are not available in this browser session.')
    }
  }, [active])

  const profileA = entries.find(({ id }) => id === choices.a)?.profile
  const profileB = entries.find(({ id }) => id === choices.b)?.profile
  const canCompare = entries.length >= 2
  const result = useMemo(() => {
    if (!active || !canCompare || !profileA || !profileB) return null
    return compareSheetProfiles({
      rasterWidth: size.width, previewWidth: width, settings, viewCount, angleDeg, viewingDistanceMm,
      opticsA: profileA.optics, opticsB: profileB.optics,
    })
  }, [active, angleDeg, canCompare, profileA, profileB, settings, size.width, viewCount, viewingDistanceMm, width])

  useEffect(() => {
    if (!result) return
    try {
      input.current ??= sampleRasterRows(raster.current, height)
      drawRgba(canvasA.current, renderAngularFrame(input.current, size.width, result.a.columns))
      drawRgba(canvasB.current, renderAngularFrame(input.current, size.width, result.b.columns))
      setCanvasError('')
    } catch (cause) {
      setCanvasError(cause.message)
    }
  }, [raster, result, size.width, height])

  return (
    <section className="print-comparison sheet-comparison" aria-labelledby="sheet-comparison-heading">
      <h3 id="sheet-comparison-heading">Compare sheet profiles A/B</h3>
      <p className="muted">Same print and observer position; different cylindrical sheet profiles. Both previews are uncalibrated.</p>
      {storageError ? <p role="status" className="error">{storageError}</p> :
        !canCompare && <p className="muted">Save or import two profiles under Angular preview → Sheet profiles to compare them here.</p>}
      {canCompare && (
        <div className="sheet-compare-grid">
          {[
            ['a', profileA, canvasA],
            ['b', profileB, canvasB],
          ].map(([key, profile, canvas]) => (
            <ProfileCard key={key} side={key.toUpperCase()} entries={entries} choice={choices[key]}
              onChange={(value) => setChoices((previous) => ({ ...previous, [key]: value }))}
              profile={profile} canvas={canvas} width={width} height={height} showImage={!!result && !canvasError} />
          ))}
        </div>
      )}
      {result && canvasError && <p className="error" role="alert">{canvasError}</p>}
      {result && (
        <table>
          <caption>Modeled sheet weights at {angleDeg}°</caption>
          <thead><tr><th scope="col">Sampled stripe</th><th scope="col">A</th><th scope="col">B</th></tr></thead>
          <tbody>
            {result.a.shares.map((share, index) => (
              <tr key={index}>
                <th scope="row">{index === viewCount ? 'Unassigned' : `View ${index + 1}`}</th>
                <td>{percent(share)}</td><td>{percent(result.b.shares[index])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted">Selections do not apply a profile or change the print export. These weights are not measured ghosting.</p>
    </section>
  )
}
