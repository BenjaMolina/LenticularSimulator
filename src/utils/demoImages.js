const PALETTES = [
  ['#f48971', '#7a2538'],
  ['#66d9af', '#0b6a61'],
  ['#7caaff', '#3c3b91'],
]

export function createTestPatterns() {
  return Promise.all(PALETTES.map(([light, dark], index) => {
    const canvas = document.createElement('canvas')
    canvas.width = 420
    canvas.height = 594
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = light
    ctx.fillRect(0, 0, 420, 594)
    ctx.strokeStyle = dark
    ctx.lineWidth = 2
    for (let y = 56; y < 570; y += 24) {
      ctx.beginPath()
      ctx.moveTo(28, y)
      ctx.lineTo(392, y)
      ctx.stroke()
    }
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.arc(210, 297, 144, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = light
    ctx.font = 'bold 126px system-ui'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(index + 1), 210, 297)
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], `Pattern ${index + 1}.png`, { type: 'image/png' }))
        else reject(new Error('Could not create the test patterns.'))
      })
    })
  }))
}
