import { parseSheetProfile, serializeSheetProfile } from '../models/LenticularProfile.js'

export const SHEET_PROFILE_PREFIX = 'lenticular.sheet-profile.v1:'

export function listSheetProfiles(storage) {
  const entries = []
  let skipped = 0
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key?.startsWith(SHEET_PROFILE_PREFIX)) continue
    const json = storage.getItem(key)
    try {
      entries.push({ id: key.slice(SHEET_PROFILE_PREFIX.length), profile: parseSheetProfile(json) })
    } catch {
      skipped += 1
    }
  }
  entries.sort((a, b) => a.profile.name.localeCompare(b.profile.name) || a.id.localeCompare(b.id))
  return { entries, skipped }
}

export function saveSheetProfile(storage, profile, id = globalThis.crypto.randomUUID()) {
  const json = serializeSheetProfile(profile)
  const key = SHEET_PROFILE_PREFIX + id
  // Never replace a stored profile, including when another record has the same name.
  if (storage.getItem(key) !== null) throw new Error('A profile already uses that storage ID.')
  storage.setItem(key, json)
  return { id, profile: parseSheetProfile(json) }
}
