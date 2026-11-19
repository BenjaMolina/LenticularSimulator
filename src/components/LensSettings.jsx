export const DEFAULTS = { nominalLpi: '50', effectiveLpi: '50', ppi: '600', offsetPx: '0' }

const FIELDS = [
  ['nominalLpi', 'Nominal LPI', 1, 300, 'any'],
  ['effectiveLpi', 'Effective LPI', 1, 300, 0.05],
  ['ppi', 'Raster PPI', 72, 900, 1],
  ['offsetPx', 'Horizontal offset (px)', -10000, 10000, 'any'],
]

export function readSettings(values) {
  const settings = {}
  for (const [key, label, min, max, step] of FIELDS) {
    const value = Number(values[key])
    if (!values[key].trim() || !Number.isFinite(value) || value < min || value > max) {
      return { error: `${label} must be between ${min} and ${max}.` }
    }
    if (step !== 'any' && Math.abs(value / step - Math.round(value / step)) > 1e-9) {
      return { error: `${label} must use increments of ${step}.` }
    }
    settings[key] = value
  }
  return { settings }
}

export default function LensSettings({ values, onChange, lens, size }) {
  return (
    <section className="panel" aria-labelledby="lens-heading">
      <header className="panel-header">
        <div><p className="eyebrow">02 / Calibration</p><h2 id="lens-heading">Lens settings</h2></div>
        <span className="tag">A4 · Vertical</span>
      </header>
      <div className="fields">
        {FIELDS.map(([key, label, min, max, step]) => (
          <label key={key}>
            {label}
            <input type="number" required min={min} max={max} step={step} value={values[key]}
              onChange={(event) => onChange(key, event.target.value)} />
          </label>
        ))}
      </div>
      <p className="muted">Effective LPI sets the raster pitch. Positive offset shifts stripes right.</p>
      {lens && (
        <dl className="metrics">
          <div><dt>Effective pitch</dt><dd>{lens.effectivePitchMm.toFixed(4)} mm</dd></div>
          <div><dt>Raster pitch</dt><dd>{lens.pixelsPerLens.toFixed(3)} px</dd></div>
          <div><dt>A4 raster</dt><dd>{size.width} × {size.height} px</dd></div>
        </dl>
      )}
    </section>
  )
}
