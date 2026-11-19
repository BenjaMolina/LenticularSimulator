export const PRINTER_PROFILE_SCHEMA = 'lenticular.printer-profile/v1'

function checkedText(value, label, maxLength, required = false) {
  const text = typeof value === 'string' ? value.trim() : ''
  if ((!text && required) || text.length > maxLength || /[\p{Cc}]/u.test(text)) {
    throw new RangeError(`${label} must be ${required ? 'nonempty and ' : ''}at most ${maxLength} characters, without control characters.`)
  }
  return text
}

export function createPrinterProfile({ name, printer, media, notes, rasterPpi }) {
  if (!Number.isInteger(rasterPpi) || rasterPpi < 72 || rasterPpi > 900) {
    throw new RangeError('Use a whole-number raster PPI between 72 and 900.')
  }
  return {
    schema: PRINTER_PROFILE_SCHEMA,
    name: checkedText(name, 'Preset name', 80, true),
    printer: checkedText(printer, 'Printer or print service', 120, true),
    media: checkedText(media, 'Media', 120),
    notes: checkedText(notes, 'Driver notes', 240),
    rasterPpi,
  }
}

export function parsePrinterProfile(json) {
  const draft = JSON.parse(json)
  if (draft?.schema !== PRINTER_PROFILE_SCHEMA) throw new RangeError('Unsupported printer preset schema.')
  return createPrinterProfile(draft)
}
