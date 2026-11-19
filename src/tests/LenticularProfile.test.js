import { describe, expect, it } from 'vitest'
import { createSheetProfile, parseSheetProfile, serializeSheetProfile } from '../models/LenticularProfile.js'
import { saveSheetProfile, listSheetProfiles, SHEET_PROFILE_PREFIX } from '../utils/sheetProfileStorage.js'

const optics = { sheetLpi: 50, radiusMm: 0.4, depthMm: 1.2, refractiveIndex: 1.5 }

function memoryStorage() {
  const items = new Map()
  return {
    get length() { return items.size },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  }
}

describe('sheet profile JSON', () => {
  it('round-trips only the named, uncalibrated optical parameters', () => {
    const profile = createSheetProfile('  Trial sheet  ', { ...optics, offsetPx: 7, ppi: 720 })
    const json = serializeSheetProfile(profile)
    expect(JSON.parse(json)).toEqual({
      schema: 'lenticular.sheet-profile/v1', name: 'Trial sheet', status: 'uncalibrated', optics,
    })
    expect(parseSheetProfile(json)).toEqual(profile)
  })

  it('rejects unknown versions, claimed calibration, and nonnumeric or invalid optics', () => {
    const profile = createSheetProfile('Reference', optics)
    for (const candidate of [
      { ...profile, schema: 'lenticular.sheet-profile/v2' },
      { ...profile, status: 'calibrated' },
      { ...profile, optics: { ...optics, radiusMm: 0.2 } },
      { ...profile, optics: { ...optics, refractiveIndex: '1.5' } },
    ]) expect(() => parseSheetProfile(JSON.stringify(candidate))).toThrow()
    expect(() => parseSheetProfile('{')).toThrow('Invalid sheet profile JSON.')
    expect(() => createSheetProfile('   ', optics)).toThrow()
  })
})

describe('sheet profile storage', () => {
  it('adds independently keyed profiles and rejects a duplicate ID without changing saved records', () => {
    const storage = memoryStorage()
    const original = createSheetProfile('Trial', optics)
    const updated = createSheetProfile('Trial', { ...optics, depthMm: 1.3 })
    expect(saveSheetProfile(storage, original, 'first')).toEqual({ id: 'first', profile: original })
    saveSheetProfile(storage, updated, 'second')
    expect(() => saveSheetProfile(storage, updated, 'first')).toThrow('A profile already uses that storage ID.')
    expect(listSheetProfiles(storage)).toEqual({
      entries: [{ id: 'first', profile: original }, { id: 'second', profile: updated }], skipped: 0,
    })
  })

  it('reports an unreadable profile without altering it or unrelated entries', () => {
    const storage = memoryStorage()
    const profile = createSheetProfile('Readable', optics)
    storage.setItem('unrelated', 'unchanged')
    storage.setItem(SHEET_PROFILE_PREFIX + 'broken', '{')
    saveSheetProfile(storage, profile, 'good')
    expect(listSheetProfiles(storage)).toEqual({ entries: [{ id: 'good', profile }], skipped: 1 })
    expect(storage.getItem(SHEET_PROFILE_PREFIX + 'broken')).toBe('{')
    expect(storage.getItem('unrelated')).toBe('unchanged')
  })
})
