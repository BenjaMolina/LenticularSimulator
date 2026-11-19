import { useState } from 'react'
import { createSheetProfile, MAX_SHEET_PROFILE_BYTES, parseSheetProfile, serializeSheetProfile } from '../models/LenticularProfile.js'
import { listSheetProfiles, saveSheetProfile } from '../utils/sheetProfileStorage.js'

function loadProfiles() {
  try {
    return listSheetProfiles(window.localStorage)
  } catch {
    return { entries: [], skipped: 0, error: 'Browser storage is unavailable in this session.' }
  }
}

export default function SheetProfiles({ optics, canSave, onApply }) {
  const [saved, setSaved] = useState(loadProfiles)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState('')
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState(null)
  const entry = saved.entries.find(({ id }) => id === selected)

  function store(profile, action) {
    const created = saveSheetProfile(window.localStorage, profile)
    setSaved((previous) => ({ ...previous, entries: [...previous.entries, created], error: undefined }))
    setSelected(created.id)
    setMessage({ text: `${action} "${created.profile.name}" as an uncalibrated profile.` })
  }

  function save() {
    try {
      store(createSheetProfile(name, optics), 'Saved')
      setName('')
    } catch (cause) {
      setMessage({ error: true, text: cause.message })
    }
  }

  async function importProfile(file) {
    if (!file) return
    setImporting(true)
    setMessage(null)
    try {
      if (file.size > MAX_SHEET_PROFILE_BYTES) throw new RangeError('Sheet profile JSON exceeds 16 KiB.')
      store(parseSheetProfile(await file.text()), 'Imported')
    } catch (cause) {
      setMessage({ error: true, text: cause.message })
    } finally {
      setImporting(false)
    }
  }

  function exportProfile() {
    const blob = new Blob([serializeSheetProfile(entry.profile)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = 'lenticular-sheet-profile.json'
      link.click()
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }

  return (
    <details className="sheet-profiles">
      <summary>Sheet profiles</summary>
      <p className="muted">Profiles are uncalibrated and stored in this browser. Applying one changes only the cylindrical preview.</p>
      <div className="fields">
        <label>New sheet profile name
          <input type="text" maxLength="80" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>Saved sheet profile
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Choose a saved profile</option>
            {saved.entries.map(({ id, profile }) => (
              <option key={id} value={id}>{profile.name} · {profile.optics.sheetLpi} LPI (uncalibrated)</option>
            ))}
          </select>
        </label>
      </div>
      {!canSave && <p className="muted">Choose the cylindrical model with valid optics to save the current settings.</p>}
      <div className="upload-actions">
        <button type="button" onClick={save} disabled={!canSave || !name.trim() || importing}>Save current profile</button>
        <button type="button" onClick={() => {
          onApply(entry.profile.optics)
          setMessage({ text: `Applied "${entry.profile.name}" to the cylindrical preview.` })
        }} disabled={!entry}>Apply profile</button>
        <button type="button" onClick={exportProfile} disabled={!entry}>Export profile JSON</button>
        <label className="file-button">
          {importing ? 'Importing…' : 'Import profile JSON'}
          <input type="file" accept=".json,application/json" disabled={importing} aria-label="Import profile JSON"
            onChange={(event) => {
              const file = event.target.files[0]
              event.target.value = ''
              void importProfile(file)
            }} />
        </label>
      </div>
      {saved.error && <p className="error" role="status">{saved.error}</p>}
      {saved.skipped > 0 && <p className="muted" role="status">{saved.skipped} unreadable saved profile(s) were left unchanged.</p>}
      {message && <p className={message.error ? 'error' : 'muted'} role="status">{message.text}</p>}
    </details>
  )
}
