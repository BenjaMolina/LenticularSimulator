import { describe, expect, it } from 'vitest'
import { createPrinterProfile, parsePrinterProfile } from '../models/PrinterProfile.js'
import { listPrinterProfiles, savePrinterProfile, PRINTER_PROFILE_PREFIX } from '../utils/printerProfileStorage.js'
import { createPrintReport } from '../rendering/ImageExporter.js'

const draft = { name: ' Trial run ', printer: ' Local print shop ', media: ' Matte A4 ', notes: ' Actual size ', rasterPpi: 600 }
const profile = {
  schema: 'lenticular.printer-profile/v1', name: 'Trial run', printer: 'Local print shop',
  media: 'Matte A4', notes: 'Actual size', rasterPpi: 600,
}

function memoryStorage() {
  const records = new Map()
  return {
    get length() { return records.size },
    key: (index) => [...records.keys()][index] ?? null,
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
  }
}

describe('printer settings presets', () => {
  it('normalizes names and print notes while accepting only an allowed raster PPI', () => {
    expect(createPrinterProfile({ ...draft, deviceDpi: 4800 })).toEqual(profile)
    expect(parsePrinterProfile(JSON.stringify(profile))).toEqual(profile)
    for (const rasterPpi of [71, 901, 600.5, '600']) {
      expect(() => createPrinterProfile({ ...draft, rasterPpi })).toThrow(RangeError)
    }
    expect(() => parsePrinterProfile(JSON.stringify({ ...profile, schema: 'other/v1' }))).toThrow()
    expect(() => createPrinterProfile({ ...draft, printer: ' ' })).toThrow()
  })

  it('adds separate records without replacing an existing preset or sheet data', () => {
    const storage = memoryStorage()
    storage.setItem('lenticular.sheet-profile.v1:existing', 'untouched')
    storage.setItem(PRINTER_PROFILE_PREFIX + 'corrupt', '{')
    expect(savePrinterProfile(storage, draft, 'first')).toEqual({ id: 'first', profile })
    expect(() => savePrinterProfile(storage, { ...draft, rasterPpi: 720 }, 'first')).toThrow()
    savePrinterProfile(storage, { ...draft, rasterPpi: 720 }, 'second')
    expect(listPrinterProfiles(storage)).toEqual({
      entries: [{ id: 'first', profile }, { id: 'second', profile: { ...profile, rasterPpi: 720 } }], skipped: 1,
    })
    expect(storage.getItem('lenticular.sheet-profile.v1:existing')).toBe('untouched')
  })

  it('includes a preset in a job report only if it matches the actual raster density', () => {
    const job = {
      size: { width: 4961, height: 7016 }, settings: { ppi: 600, nominalLpi: 50, effectiveLpi: 50, offsetPx: 1 },
      files: [{ name: 'first.png' }, { name: 'second.png' }], printerProfile: profile,
    }
    const report = createPrintReport(job)
    expect(report.printerPreset).toEqual({
      name: 'Trial run', printer: 'Local print shop', media: 'Matte A4', notes: 'Actual size',
    })
    expect(report.calibration).toBe('uncalibrated')
    expect(createPrintReport({ ...job, settings: { ...job.settings, ppi: 720 } })).not.toHaveProperty('printerPreset')
  })
})
