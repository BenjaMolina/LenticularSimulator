import { useState } from 'react'
import { listPrinterProfiles, savePrinterProfile } from '../utils/printerProfileStorage.js'

const fields = [
  ['name', 'Printer preset name', 80], ['printer', 'Printer or print service', 120],
  ['media', 'Print media', 120], ['notes', 'Driver notes', 240],
]

function loadPresets() {
  try {
    return listPrinterProfiles(window.localStorage)
  } catch {
    return { entries: [], skipped: 0, error: 'Browser storage is unavailable in this session.' }
  }
}

export default function PrinterProfiles({ rasterPpi, active, onApply }) {
  const [saved, setSaved] = useState(loadPresets)
  const [draft, setDraft] = useState({ name: '', printer: '', media: '', notes: '' })
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState(null)
  const entry = saved.entries.find(({ id }) => id === selected)

  function save() {
    try {
      const created = savePrinterProfile(window.localStorage, { ...draft, rasterPpi })
      setSaved((previous) => ({ ...previous, entries: [...previous.entries, created], error: undefined }))
      setSelected(created.id)
      setMessage({ text: `Saved "${created.profile.name}" at ${rasterPpi} raster PPI.` })
    } catch (cause) {
      setMessage({ error: true, text: cause.message })
    }
  }

  return (
    <details className="panel printer-profiles">
      <summary>Printer presets</summary>
      <p className="muted">Store raster PPI and print notes in this browser. Presets do not control a printer or calibrate a sheet.</p>
      <div className="fields">
        {fields.map(([key, label, maxLength]) => (
          <label key={key}>{label}
            <input type="text" value={draft[key]} maxLength={maxLength}
              onChange={(event) => setDraft((previous) => ({ ...previous, [key]: event.target.value }))} />
          </label>
        ))}
        <label>Saved printer preset
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Choose a preset</option>
            {saved.entries.map(({ id, profile }) => (
              <option key={id} value={id}>{profile.name} · {profile.rasterPpi} PPI</option>
            ))}
          </select>
        </label>
      </div>
      <div className="upload-actions">
        <button type="button" onClick={save} disabled={!rasterPpi || !draft.name.trim() || !draft.printer.trim()}>Save printer preset</button>
        <button type="button" disabled={!entry} onClick={() => {
          onApply(entry.profile)
          setMessage({ text: `Applied "${entry.profile.name}". Generate a new raster to use this PPI.` })
        }}>Apply printer preset</button>
      </div>
      {active && <p className="muted">Active preset: {active.name} · {active.rasterPpi} PPI.</p>}
      {saved.error && <p className="error" role="status">{saved.error}</p>}
      {saved.skipped > 0 && <p className="muted" role="status">{saved.skipped} unreadable preset(s) were left unchanged.</p>}
      {message && <p className={message.error ? 'error' : 'muted'} role="status">{message.text}</p>}
    </details>
  )
}
