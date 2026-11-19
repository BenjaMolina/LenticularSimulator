import { useState } from 'react'
import { encodePrintPng } from '../utils/pngExport.js'

export default function PrintPngDownload({ raster, ppi }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setPending(true)
    setError('')
    try {
      const png = await encodePrintPng(raster.current, ppi)
      const url = URL.createObjectURL(png)
      try {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `lenticular-a4-${ppi}ppi.png`
        anchor.click()
      } finally {
        // Give the browser time to start reading the download before revoking its URL.
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch (cause) {
      setError(cause.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="export-actions">
      <button type="button" disabled={pending} onClick={download}>{pending ? 'Encoding PNG…' : 'Download print PNG'}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
