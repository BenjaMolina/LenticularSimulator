import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ImageUploader from './components/ImageUploader.jsx'
import InterlacedPreview from './components/InterlacedPreview.jsx'
import LensSettings, { DEFAULTS, readSettings } from './components/LensSettings.jsx'
import { a4Raster, createLensModel } from './engine/LensModel.js'
import { isSupportedViewCount } from './engine/ViewCount.js'
import './styles.css'

function App() {
  const [files, setFiles] = useState([])
  const [values, setValues] = useState(DEFAULTS)
  const [job, setJob] = useState(null)
  const sequence = useRef(0)
  const { settings, error } = readSettings(values)
  const lens = settings && createLensModel(settings)
  const size = settings && a4Raster(settings.ppi)
  const enoughImages = isSupportedViewCount(files.length)
  const undersampled = enoughImages && lens && lens.pixelsPerLens < files.length

  function generate(event) {
    event.preventDefault()
    if (!enoughImages || !settings || undersampled) return
    sequence.current += 1
    setJob({ id: sequence.current, files, settings, size })
  }

  return (
    <main className="workbench">
      <header className="hero">
        <div>
          <p className="eyebrow brand"><span aria-hidden="true" /> Interlacing workbench</p>
          <h1>Lenticular Optical Simulator</h1>
          <p className="subtitle">Prepare an A4 flip raster and explore how its stripes respond to a change in angle.</p>
        </div>
        <span className="tag hero-tag">Uncalibrated optical preview</span>
      </header>
      <div className="workspace">
        <form className="controls" onSubmit={generate}>
          <ImageUploader images={files} onChange={(next) => {
            setFiles(next)
            setJob(null)
          }} />
          <LensSettings values={values} lens={lens} size={size} onChange={(key, value) => {
            setValues((previous) => ({ ...previous, [key]: value }))
            setJob(null)
          }} />
          <div className="generate">
            <button className="primary" type="submit" disabled={!enoughImages || !settings || undersampled}>
              Generate interlace <span aria-hidden="true">→</span>
            </button>
            {error && <p className="error" role="status">{error}</p>}
            {undersampled && <p className="error" role="status">Increase PPI or decrease effective LPI so each view has at least one pixel per lens.</p>}
          </div>
        </form>
        <InterlacedPreview job={job} />
      </div>
      <footer>Local image processing · Physical calibration required before estimating ghosting</footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
