/**
 * Röktest (briefens 6.1): "generera ett underlag för 'bråk' åk 4 end-to-end mot
 * mockad AI" – hela kedjan utsagor → scen → .pptx, där pptx:en packas upp och
 * XML:en verifieras: texter som redigerbara textformer, figurer som separata bilder.
 */
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { exempelUtsagor } from './ai/mock'
import { skapaScen } from './domain/scen'
import type { Figur } from './domain/figurer'
import { byggPptx } from './export/pptx'

const FIGURER: Figur[] = ['mellan1', 'mellan2', 'mellan3', 'mellan4', 'mellan5'].map((fil) => ({
  fil: `${fil}.png`,
  stadium: 'mellan',
  bredd: 800,
  hojd: 1400,
}))

// 1×1 transparent PNG – bilddatans innehåll är irrelevant för XML-strukturen.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

describe('röktest: bråk åk 4 → scen → pptx', () => {
  it('bygger en giltig .pptx med bubblor som textformer och figurer som bilder', async () => {
    const utsagor = await exempelUtsagor('Hur stor är en halv?')
    const scen = skapaScen({
      begrepp: 'Hur stor är en halv?',
      arskurs: '4',
      utsagor,
      figurer: FIGURER,
      fro: 42,
    })

    const pptx = byggPptx(scen, {
      figurer: Object.fromEntries(FIGURER.map((f) => [f.fil, PIXEL])),
    })
    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer

    const zip = await JSZip.loadAsync(buffer)
    const slideXml = await zip.file('ppt/slides/slide1.xml')!.async('string')

    // Alla fem bubbeltexter finns som text i sliden (fyra utsagor + ?-bubblan).
    for (const utsaga of utsagor) {
      const framstaOrd = utsaga.text.split(' ').slice(0, 3).join(' ')
      expect(slideXml).toContain(framstaOrd)
    }
    expect(slideXml).toContain('Jag vet inte')

    // Fem figurer som separata bildelement – inte en tillplattad skärmdump.
    expect(slideXml.match(/<p:pic>/g)?.length).toBe(5)

    // Minst fem formobjekt (bubblor) med text.
    expect((slideXml.match(/<p:sp>/g)?.length ?? 0)).toBeGreaterThanOrEqual(5)

    // Titeln finns med.
    expect(slideXml).toContain('Årskurs 4')

    // Presentationen refererar sliden korrekt.
    expect(zip.file('ppt/presentation.xml')).toBeTruthy()
  })
})
