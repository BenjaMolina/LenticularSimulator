import { useMemo, useState } from 'react'
import { MIN_PREVIEW_ANGLE, MAX_PREVIEW_ANGLE } from '../engine/AngularResponse.js'
import { comparePrintSweep } from '../engine/PrintComparison.js'

const span = MAX_PREVIEW_ANGLE - MIN_PREVIEW_ANGLE
const angles = Array.from({ length: span + 1 }, (_, index) => MIN_PREVIEW_ANGLE + index)
const xAt = (angle) => 39 + 300 * (angle - MIN_PREVIEW_ANGLE) / span
const yAt = (share) => 114 - 100 * Math.max(0, Math.min(1, share))

export default function PrintComparisonChart({ rasterWidth, settings, viewCount, angleDeg, project, candidate }) {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState(0)
  const effectiveLpi = candidate?.effectiveLpi
  const offsetPx = candidate?.offsetPx

  const sweep = useMemo(() => {
    if (!open || effectiveLpi === undefined || offsetPx === undefined) return null
    return comparePrintSweep({
      rasterWidth, settings, viewCount, project, angles, candidate: { effectiveLpi, offsetPx },
    })
  }, [open, effectiveLpi, offsetPx, rasterWidth, settings, viewCount, project])

  const channelName = channel === viewCount ? 'Unassigned' : `View ${channel + 1}`
  const points = (series) => series.map(({ angleDeg: angle, shares }) =>
    `${xAt(angle)},${yAt(shares[channel])}`).join(' ')

  return (
    <details className="comparison-curves" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Compare across angles</summary>
      <p className="muted">Compare A and B for the same view on the same virtual sheet. The cursor follows the viewing-angle slider.</p>
      <div className="fields">
        <label>Track curve for
          <select value={channel} onChange={(event) => setChannel(Number(event.target.value))}>
            {Array.from({ length: viewCount }, (_, index) =>
              <option key={index} value={index}>View {index + 1}</option>)}
            <option value={viewCount}>Unassigned</option>
          </select>
        </label>
      </div>
      {sweep ? (
        <>
          <svg viewBox="0 0 362 140" className="angular-chart" role="img" aria-label={`A/B angular curves for ${channelName}`}>
            {[0, 0.5, 1].map((share) => (
              <g key={share}>
                <line x1="39" x2="339" y1={yAt(share)} y2={yAt(share)} className="chart-guide" />
                <text x="34" y={yAt(share) + 3} textAnchor="end">{share * 100}%</text>
              </g>
            ))}
            {[MIN_PREVIEW_ANGLE, 0, MAX_PREVIEW_ANGLE].map((angle) =>
              <text key={angle} x={xAt(angle)} y="132" textAnchor="middle">{angle}°</text>)}
            <polyline points={points(sweep.current)} fill="none" stroke="#91ebc7" strokeWidth="2" />
            <polyline points={points(sweep.candidate)} fill="none" stroke="#ffbc91" strokeWidth="2" strokeDasharray="7 3" />
            <line x1={xAt(angleDeg)} x2={xAt(angleDeg)} y1="14" y2="114" className="chart-cursor" />
          </svg>
          <p className="muted">A: solid line. B: dashed line. Curves show modeled weights, not measured ghosting.</p>
        </>
      ) : <p className="muted">Enter valid B settings to compare curves.</p>}
    </details>
  )
}
