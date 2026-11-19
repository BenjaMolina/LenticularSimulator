import { useEffect, useState } from 'react'
import { createTestPatterns } from '../utils/demoImages.js'

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
const MAX_VIEWS = 3

function supported(file) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    (!file.type && /\.(jpe?g|png|webp)$/i.test(file.name))
}

function Thumbnail({ file }) {
  const [url, setUrl] = useState('')
  const [failedUrl, setFailedUrl] = useState('')
  useEffect(() => {
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])

  return (
    <div className="thumbnail">
      {url && (failedUrl === url ? <span>Cannot preview</span> : <img src={url} alt="" onError={() => setFailedUrl(url)} />)}
    </div>
  )
}

export default function ImageUploader({ images, onChange }) {
  const [error, setError] = useState('')
  const [loadingDemo, setLoadingDemo] = useState(false)

  function add(files) {
    setError('')
    if (!files.length) return
    if (files.some((file) => !supported(file))) return setError('Choose JPG, PNG, or WebP images.')
    if (images.length + files.length > MAX_VIEWS) return setError('You can use at most three images.')
    onChange([...images, ...files])
  }

  function replace(index, file) {
    if (!file) return
    if (!supported(file)) return setError('Choose a JPG, PNG, or WebP replacement.')
    setError('')
    onChange(images.map((previous, position) => position === index ? file : previous))
  }

  function move(index, direction) {
    const reordered = [...images]
    const adjacent = index + direction
    reordered[index] = images[adjacent]
    reordered[adjacent] = images[index]
    onChange(reordered)
    setError('')
  }

  async function loadDemo() {
    setLoadingDemo(true)
    setError('')
    try {
      onChange(await createTestPatterns())
    } catch (cause) {
      setError(cause.message)
    } finally {
      setLoadingDemo(false)
    }
  }

  return (
    <section className="panel" aria-labelledby="source-heading">
      <header className="panel-header">
        <div><p className="eyebrow">01 / Inputs</p><h2 id="source-heading">Source images</h2></div>
        <span className="tag">{images.length} / 3</span>
      </header>
      <p className="muted">Add two or three images in stripe order. Originals stay unchanged; the raster uses a centered A4 crop.</p>
      {!!images.length && (
        <ol className="source-list">
          {images.map((file, index) => (
            <li key={index} className="source">
              <Thumbnail file={file} />
              <div className="source-meta">
                <span className="eyebrow">View {index + 1}</span>
                <span className="filename" title={file.name}>{file.name}</span>
                <div className="source-tools">
                  <button type="button" aria-label={`Move view ${index + 1} earlier`} disabled={index === 0}
                    onClick={() => move(index, -1)}>↑</button>
                  <button type="button" aria-label={`Move view ${index + 1} later`} disabled={index === images.length - 1}
                    onClick={() => move(index, 1)}>↓</button>
                  <label className="file-button">
                    Replace
                    <input type="file" accept={ACCEPT} aria-label={`Replace view ${index + 1}`} onChange={(event) => {
                      replace(index, event.currentTarget.files[0])
                      event.currentTarget.value = ''
                    }} />
                  </label>
                  <button type="button" aria-label={`Remove view ${index + 1}`} onClick={() => {
                    onChange(images.filter((_, position) => position !== index))
                    setError('')
                  }}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="upload-actions">
        {images.length < MAX_VIEWS && (
          <label className="file-button add-file">
            + Add images
            <input type="file" multiple accept={ACCEPT} disabled={loadingDemo} aria-label="Add images" onChange={(event) => {
              add([...event.currentTarget.files])
              event.currentTarget.value = ''
            }} />
          </label>
        )}
        {images.length === 0 && (
          <button type="button" disabled={loadingDemo} onClick={loadDemo}>
            {loadingDemo ? 'Creating patterns…' : 'Load test patterns'}
          </button>
        )}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
