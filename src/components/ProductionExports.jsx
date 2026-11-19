import { useState } from 'react'
import { createPrintReport, encodePrintTiff } from '../rendering/ImageExporter.js'

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

export default function ProductionExports({ job, raster }) {
  const [encoding, setEncoding] = useState(false)
  const [error, setError] = useState('')

  async function exportTiff() {
    const canvas = raster.current
    setEncoding(true)
    setError('')
    try {
      const tiff = await encodePrintTiff(canvas, job.settings.ppi)
      download(tiff, `lenticular-a4-${job.settings.ppi}ppi.tiff`)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setEncoding(false)
    }
  }

  function exportReport() {
    const json = JSON.stringify(createPrintReport(job), null, 2) + '\n'
    download(new Blob([json], { type: 'application/json' }), 'lenticular-print-job.json')
  }

  return (
    <div className="export-actions">
      <div className="upload-actions">
        <button type="button" disabled={encoding} onClick={exportTiff}>
          {encoding ? 'Encoding TIFF…' : 'Download print TIFF'}
        </button>
        <button type="button" onClick={exportReport}>Download job report JSON</button>
      </div>
      <p className="muted">TIFF is uncompressed and may be large. The JSON includes the ordered source filenames, not the images.</p>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  )
}
