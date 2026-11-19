import { createPrinterProfile, parsePrinterProfile } from '../models/PrinterProfile.js'

export const PRINTER_PROFILE_PREFIX = 'lenticular.printer-profile.v1:'

export function listPrinterProfiles(storage) {
  const entries = []
  let skipped = 0
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key?.startsWith(PRINTER_PROFILE_PREFIX)) continue
    const json = storage.getItem(key)
    try {
      entries.push({ id: key.slice(PRINTER_PROFILE_PREFIX.length), profile: parsePrinterProfile(json) })
    } catch {
      skipped += 1
    }
  }
  entries.sort((a, b) => a.profile.name.localeCompare(b.profile.name) || a.id.localeCompare(b.id))
  return { entries, skipped }
}

export function savePrinterProfile(storage, draft, id = globalThis.crypto.randomUUID()) {
  const profile = createPrinterProfile(draft)
  const key = PRINTER_PROFILE_PREFIX + id
  if (storage.getItem(key) !== null) throw new Error('A printer preset already uses that storage ID.')
  storage.setItem(key, JSON.stringify(profile))
  return { id, profile }
}
