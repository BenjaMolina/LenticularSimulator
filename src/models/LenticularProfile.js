import { cylindricalProfileError } from '../engine/RefractionModel.js'

export const SHEET_PROFILE_SCHEMA = 'lenticular.sheet-profile/v1'
export const MAX_SHEET_PROFILE_BYTES = 16 * 1024

export function createSheetProfile(name, optics) {
  const label = typeof name === 'string' ? name.trim() : ''
  if (!label || label.length > 80 || /[\p{Cc}]/u.test(label)) {
    throw new RangeError('Enter a profile name between 1 and 80 characters without control characters.')
  }

  const { sheetLpi, radiusMm, depthMm, refractiveIndex } = optics ?? {}
  const parameters = { sheetLpi, radiusMm, depthMm, refractiveIndex }
  if (!Object.values(parameters).every(Number.isFinite)) {
    throw new RangeError('Sheet optics must use finite numeric values.')
  }
  const issue = cylindricalProfileError(parameters)
  if (issue) throw new RangeError(issue)

  return { schema: SHEET_PROFILE_SCHEMA, name: label, status: 'uncalibrated', optics: parameters }
}

function validateSheetProfile(value) {
  if (value?.schema !== SHEET_PROFILE_SCHEMA) throw new RangeError('Unsupported sheet profile schema.')
  if (value.status !== 'uncalibrated') throw new RangeError('Only uncalibrated sheet profiles are supported.')
  return createSheetProfile(value.name, value.optics)
}

export function parseSheetProfile(text) {
  if (typeof text !== 'string' || text.length > MAX_SHEET_PROFILE_BYTES) {
    throw new RangeError('Sheet profile JSON is missing or exceeds 16 KiB.')
  }
  let value
  try {
    value = JSON.parse(text)
  } catch {
    throw new SyntaxError('Invalid sheet profile JSON.')
  }
  return validateSheetProfile(value)
}

export function serializeSheetProfile(profile) {
  return JSON.stringify(validateSheetProfile(profile), null, 2) + '\n'
}
