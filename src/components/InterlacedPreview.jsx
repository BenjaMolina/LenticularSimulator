import { useEffect, useRef, useState } from 'react'
import OpticalPreview from './OpticalPreview.jsx'
import PrintPngDownload from './PrintPngDownload.jsx'
import ProductionExports from './ProductionExports.jsx'
import { MIN_VIEWS, MAX_VIEWS } from '../engine/ViewCount.js'

const DETAIL_WIDTH = 144
const DETAIL_HEIGHT = 80

function PreviewCanvas({ job }) {
  const raster = useRef(null)
  const detail = useRef(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('overview')
  const { width, height } = job.size

  useEffect(() => {
    let worker
    const fail = (message) => {
      worker?.terminate()
      setError(message)
    }
    try {
      const context = raster.current.getContext('2d')
      const detailContext = detail.current.getContext('2d')
      if (!context || !detailContext || typeof OffscreenCanvas === 'undefined') {
        throw new Error('Use a browser with Canvas 2D and OffscreenCanvas support.')
      }

      worker = new Worker(new URL('../workers/interlace.worker.js', import.meta.url), { type: 'module' })
      worker.onerror = () => fail('The image worker could not complete the raster.')
      worker.onmessageerror = () => fail('The browser could not read the raster data.')
      worker.onmessage = ({ data }) => {
        if (data.type === 'error') return fail(data.message)
        try {
          const { pixels, top, rows } = data
          if (context.isContextLost?.()) throw new Error('The raster exceeds available Canvas memory. Try a lower PPI.')
          context.putImageData(new ImageData(pixels, width, rows), 0, top)
          const renderedRows = top + rows
          if (renderedRows === height) {
            const x = Math.floor((width - DETAIL_WIDTH) / 2)
            const y = Math.floor((height - DETAIL_HEIGHT) / 2)
            detailContext.drawImage(raster.current, x, y, DETAIL_WIDTH, DETAIL_HEIGHT, 0, 0, DETAIL_WIDTH, DETAIL_HEIGHT)
            worker.terminate()
          } else {
            // Request the next band only after consuming this one.
            worker.postMessage({ type: 'next' })
          }
          setProgress(renderedRows)
        } catch (cause) {
          fail(cause.message)
        }
      }
      worker.postMessage({ type: 'start', ...job })
    } catch (cause) {
      fail(cause.message)
    }
    return () => worker?.terminate()
  }, [job, width, height])

  const ready = !error && progress === height
  return (
    <>
      {ready && (
        <div className="view-toggle" role="group" aria-label="Raster display">
          <button type="button" aria-pressed={mode === 'overview'} onClick={() => setMode('overview')}>Overview</button>
          <button type="button" aria-pressed={mode === 'detail'} onClick={() => setMode('detail')}>Stripe detail</button>
          <button type="button" aria-pressed={mode === 'angle'} onClick={() => setMode('angle')}>Angular preview</button>
        </div>
      )}
      {!ready && (
        <div className="placeholder">
          {error ? <p className="error" role="alert">{error}</p> : (
            <>
              <p role="status">Generating interlaced raster…</p>
              <progress aria-label="Rows rendered" value={progress} max={height} />
            </>
          )}
        </div>
      )}
      <div className="canvas-stage" hidden={!ready || mode === 'angle'}>
        <canvas ref={raster} width={width} height={height} aria-label="Interlaced A4 raster" hidden={mode !== 'overview'} />
        <canvas ref={detail} className="detail" width={DETAIL_WIDTH} height={DETAIL_HEIGHT}
          aria-label="Magnified interlaced stripe crop" hidden={mode !== 'detail'} />
      </div>
      {ready && mode !== 'angle' && <p className="muted preview-note" role="status">
        {mode === 'overview' ? 'Overview is scaled to fit. Switch to Stripe detail to inspect actual raster pixels.' :
          'Center crop of actual raster pixels, magnified without smoothing.'}
      </p>}
      {ready && (
        <>
          <OpticalPreview active={mode === 'angle'} raster={raster} settings={job.settings} size={job.size}
            viewCount={job.files.length} />
          <PrintPngDownload raster={raster} ppi={job.settings.ppi} />
          <ProductionExports raster={raster} job={job} />
        </>
      )}
    </>
  )
}

export default function InterlacedPreview({ job }) {
  return (
    <section className="panel preview" aria-labelledby="output-heading">
      <header className="panel-header">
        <div><p className="eyebrow">03 / Raster</p><h2 id="output-heading">Interlaced output</h2></div>
        <span className="tag">Canvas</span>
      </header>
      {job ? <PreviewCanvas key={job.id} job={job} /> : (
        <div className="placeholder">
          <div className="plate" aria-hidden="true" />
          <p>No raster generated</p>
          <p className="muted">Add {MIN_VIEWS} to {MAX_VIEWS} sources, then generate the interlace.</p>
        </div>
      )}
    </section>
  )
}
