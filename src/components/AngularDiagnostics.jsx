import { useMemo } from 'react'
import { buildAngularResponse, MIN_PREVIEW_ANGLE, MAX_PREVIEW_ANGLE } from '../engine/AngularResponse.js'

const ANGLES = Array.from(
  { length: MAX_PREVIEW_ANGLE - MIN_PREVIEW_ANGLE + 1 },
  (_, index) => MIN_PREVIEW_ANGLE + index,
)
const SERIES = [
  { color: '#91ebc7', dash: undefined },
  { color: '#ffbc91', dash: '7 3' },
  { color: '#b8b5ff', dash: '3 3' },
  { color: '#b0c2c0', dash: '1 4' },
]
const xAt = (angle) => 39 + (angle - MIN_PREVIEW_ANGLE) * 300 / (MAX_PREVIEW_ANGLE - MIN_PREVIEW_ANGLE)
const yAt = (share) => 114 - Math.max(0, Math.min(1, share)) * 100

export default function AngularDiagnostics({ rasterWidth, settings, viewCount, angleDeg, project }) {
  const response = useMemo(() => buildAngularResponse({
    rasterWidth, settings, viewCount, angles: ANGLES, project,
  }), [rasterWidth, settings, viewCount, project])
  const active = response[angleDeg - MIN_PREVIEW_ANGLE]
  const series = [...SERIES.slice(0, viewCount), SERIES.at(-1)]

  return (
    <section className="angular-diagnostics" aria-labelledby="angular-response-heading">
      <h3 id="angular-response-heading">Modeled angular response</h3>
      <p className="muted">Geometric weight across the preview. Not measured ghosting.</p>
      <svg viewBox="0 0 362 140" className="angular-chart" role="img"
        aria-label="Modeled weight per source view and unassigned weight from minus 40 to plus 40 degrees">
        {[0, 0.5, 1].map((share) => (
          <g key={share}>
            <line x1="39" x2="339" y1={yAt(share)} y2={yAt(share)} className="chart-guide" />
            <text x="34" y={yAt(share) + 3} textAnchor="end">{share * 100}%</text>
          </g>
        ))}
        {[MIN_PREVIEW_ANGLE, 0, MAX_PREVIEW_ANGLE].map((angle) => (
          <text key={angle} x={xAt(angle)} y="132" textAnchor="middle">{angle}°</text>
        ))}
        {series.map(({ color, dash }, index) => (
          <polyline key={color} points={response.map(({ angleDeg, shares }) =>
            `${xAt(angleDeg)},${yAt(shares[index])}`).join(' ')}
            fill="none" stroke={color} strokeWidth="2" strokeDasharray={dash} />
        ))}
        <line x1={xAt(angleDeg)} x2={xAt(angleDeg)} y1="14" y2="114" className="chart-cursor" />
      </svg>
      <dl className="angular-legend" aria-label={`Modeled weights at ${angleDeg} degrees`}>
        {series.map(({ color }, index) => (
          <div key={color}>
            <dt><span className="legend-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
              {index === viewCount ? 'Unassigned' : `View ${index + 1}`}
            </dt>
            <dd>{(active.shares[index] * 100).toFixed(1)}%</dd>
          </div>
        ))}
      </dl>
      <p className="muted">Unassigned weight did not reach a sampled print stripe. Image brightness does not affect these values.</p>
    </section>
  )
}
