import { useState } from 'react'
import { comparePrintSettings } from '../engine/PrintComparison.js'
import { readSettings } from './LensSettings.jsx'
import PitchSearch from './PitchSearch.jsx'
import PrintComparisonChart from './PrintComparisonChart.jsx'

const percent = (value) => `${(value * 100).toFixed(1)}%`

export default function PrintComparison({ active, rasterWidth, settings, viewCount, angleDeg, project }) {
  const [effectiveLpi, setEffectiveLpi] = useState(String(settings.effectiveLpi))
  const [offsetPx, setOffset] = useState(String(settings.offsetPx))
  const validation = readSettings({
    nominalLpi: String(settings.nominalLpi), ppi: String(settings.ppi), effectiveLpi, offsetPx,
  })

  let issue = validation.error
  let comparison
  if (active && validation.settings) {
    try {
      comparison = comparePrintSettings({
        rasterWidth, settings, viewCount, angleDeg, project, candidate: validation.settings,
      })
    } catch (cause) {
      issue = cause.message
    }
  }

  return (
    <section className="print-comparison" aria-labelledby="print-comparison-heading">
      <h3 id="print-comparison-heading">Compare print settings A/B</h3>
      <p className="muted">
        A is the generated print ({settings.effectiveLpi} effective LPI, offset {settings.offsetPx} px).
        Both use the same sheet, optical model, and observer position. B is a virtual comparison only.
      </p>
      <div className="fields">
        <label>B effective LPI
          <input type="number" min="1" max="300" step="0.05" value={effectiveLpi}
            onChange={(event) => setEffectiveLpi(event.target.value)} />
        </label>
        <label>B horizontal offset (px)
          <input type="number" min="-10000" max="10000" step="any" value={offsetPx}
            onChange={(event) => setOffset(event.target.value)} />
        </label>
      </div>
      {issue && <p className="error" role="status">{issue}</p>}
      {comparison && (
        <table>
          <caption>Modeled weights at {angleDeg}°</caption>
          <thead>
            <tr><th scope="col">Sampled stripe</th><th scope="col">A</th><th scope="col">B</th></tr>
          </thead>
          <tbody>
            {comparison.current.map((share, index) => (
              <tr key={index}>
                <th scope="row">{index === viewCount ? 'Unassigned' : `View ${index + 1}`}</th>
                <td>{percent(share)}</td>
                <td>{percent(comparison.candidate[index])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted">Use the angle slider to compare the intended views. These are model weights, not measured ghosting.</p>
      <PrintComparisonChart rasterWidth={rasterWidth} settings={settings} viewCount={viewCount}
        angleDeg={angleDeg} project={project} candidate={comparison ? validation.settings : null} />
      <PitchSearch rasterWidth={rasterWidth} settings={settings} viewCount={viewCount} project={project}
        onSelect={(candidate) => {
          setEffectiveLpi(String(candidate.effectiveLpi))
          setOffset(String(candidate.offsetPx))
        }} />
    </section>
  )
}
