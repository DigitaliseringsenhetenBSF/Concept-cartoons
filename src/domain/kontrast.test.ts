import { describe, expect, it } from 'vitest'
import { kontrastKvot, uppfyllerAA } from './kontrast'
import { PALETT } from './konstanter'

/** Låser palettens användning till WCAG AA – ändras designen måste detta test uppdateras medvetet. */
describe('WCAG AA för använda färgkombinationer', () => {
  const kombinationer: Array<[text: string, bakgrund: string, namn: string]> = [
    [PALETT.gron, PALETT.vit, 'bubbeltext på vit bubbla'],
    [PALETT.gron, PALETT.ljusbla, 'bubbeltext på ljusblå bubbla'],
    [PALETT.gron, PALETT.ljusrosa, 'bubbeltext på ljusrosa bubbla'],
    [PALETT.gron, PALETT.ljusgul, 'brödtext på ljusgul yta'],
    [PALETT.lila, PALETT.vit, 'rubriker på vit yta'],
    [PALETT.lila, PALETT.ljusgul, 'rubriker på ljusgul yta'],
    [PALETT.vit, PALETT.lila, 'knappar och kategorietiketter (vit text på lila)'],
    [PALETT.gron, PALETT.vit, 'förklaringspanelens brödtext'],
    [PALETT.mork, PALETT.ljusrosa, 'feltext på ljusrosa'],
  ]

  for (const [text, bakgrund, namn] of kombinationer) {
    it(`${namn} klarar AA (4.5:1)`, () => {
      expect(uppfyllerAA(text, bakgrund)).toBe(true)
    })
  }

  it('vit text på orange klarar INTE AA – därför används mörk text på primärknappar', () => {
    expect(uppfyllerAA(PALETT.vit, PALETT.orange)).toBe(false)
  })

  it('kontrastkvoten är symmetrisk', () => {
    expect(kontrastKvot(PALETT.gron, PALETT.vit)).toBeCloseTo(kontrastKvot(PALETT.vit, PALETT.gron))
  })
})
