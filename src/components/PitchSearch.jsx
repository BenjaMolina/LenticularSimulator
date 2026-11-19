import { useState } from 'react'
import { MIN_PREVIEW_ANGLE, MAX_PREVIEW_ANGLE } from '../engine/AngularResponse.js'
import { defaultTargetAngles, findPitchCandidates, PITCH_SEARCH_LIMITS } from '../engine/PitchOptimizer.js'

const percent = (share) => `${(share * 100).toFixed(1)}%`
const number = (value) => value.trim() ? Number(value) : NaN

export default function PitchSearch({ rasterWidth, settings, viewCount, project, onSelect }) {
  const [angles, setAngles] = useState(() => defaultTargetAngles(viewCount).map(String))
  const [lpiRadius, setLpiRadius] = useState('0.25')
  const [offsetRadius, setOffsetRadius] = useState('2')
  const [run, setRun] = useState(null)
  const current = run?.project === project ? run : null

  function runSearch() {
    try {
      const result = findPitchCandidates({
        rasterWidth, settings, viewCount, project,
        targetAngles: angles.map(number), lpiRadius: number(lpiRadius), offsetRadius: number(offsetRadius),
      })
      setRun({ project, result })
    } catch (cause) {
      setRun({ project, error: cause.message })
    }
  }

  return (
    <details className="pitch-search">
      <summary>Search print settings</summary>
      <p className="muted">Search around A with the same virtual sheet. Results favor the weakest intended view, then the average across views.</p>
      <div className="fields">
        {angles.map((angle, index) => (
          <label key={index}>Target angle for view {index + 1} (°)
            <input type="number" min={MIN_PREVIEW_ANGLE} max={MAX_PREVIEW_ANGLE} step="1" value={angle}
              onChange={(event) => {
                setAngles(angles.map((value, i) => i === index ? event.target.value : value))
                setRun(null)
              }} />
          </label>
        ))}
        {[
          ['LPI search radius', lpiRadius, setLpiRadius, PITCH_SEARCH_LIMITS.lpi],
          ['Offset search radius (px)', offsetRadius, setOffsetRadius, PITCH_SEARCH_LIMITS.offset],
        ].map(([label, value, update, limits]) => (
          <label key={label}>{label}
            <input type="number" min="0" max={limits.maxRadius} step={limits.step} value={value}
              onChange={(event) => { update(event.target.value); setRun(null) }} />
          </label>
        ))}
      </div>
      <button type="button" onClick={runSearch}>Run theoretical search</button>
      {current?.error && <p className="error" role="status">{current.error}</p>}
      {current?.result && (
        <>
          <p role="status" className="muted">
            Evaluated {current.result.tested} settings. A's weakest target share: {percent(current.result.baseline.worstShare)}.
          </p>
          <ol className="pitch-results" aria-label="Theoretical suggestions">
            {current.result.best.map((candidate) => (
              <li key={`${candidate.effectiveLpi}/${candidate.offsetPx}`}>
                <div>
                  <strong>{candidate.effectiveLpi} LPI · {candidate.offsetPx} px</strong>
                  <p className="muted">Weakest {percent(candidate.worstShare)} · Average {percent(candidate.meanShare)}</p>
                </div>
                <button type="button" onClick={() => onSelect(candidate)}>Use in B</button>
              </li>
            ))}
          </ol>
        </>
      )}
      <p className="muted">This ranks only the tested settings and angles. It does not measure physical ghosting.</p>
    </details>
  )
}
