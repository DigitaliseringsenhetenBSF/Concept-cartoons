import { describe, expect, it } from 'vitest'
import { scenPlatser } from './scenlayout'
import { flyttaBubbla, skapaScen, type Utsaga } from './scen'
import type { Figur } from './figurer'
import { SCEN_BREDD, SCEN_HOJD } from './konstanter'

const FIGURER: Figur[] = ['mellan1', 'mellan2', 'mellan3', 'mellan4', 'mellan5'].map((fil) => ({
  fil: `${fil}.png`,
  stadium: 'mellan',
  bredd: 800,
  hojd: 1400,
}))

const UTSAGOR: Utsaga[] = [
  { kategori: 'korrekt', text: 'a' },
  { kategori: 'intuitiv', text: 'b' },
  { kategori: 'overgeneralisering', text: 'c' },
  { kategori: 'falsklogik', text: 'd' },
]

function scen() {
  return skapaScen({ begrepp: 'test', arskurs: '4', utsagor: UTSAGOR, figurer: FIGURER, fro: 3 })
}

describe('scenPlatser (delas av editor, PDF och PPTX)', () => {
  it('flyttar figur, bubbla och svans lika mycket', () => {
    const fore = scenPlatser(scen()).platser[2]
    const efter = scenPlatser(flyttaBubbla(scen(), 2, { x: 60, y: -30 })).platser[2]

    expect(efter.figur.x - fore.figur.x).toBeCloseTo(60)
    expect(efter.figur.y - fore.figur.y).toBeCloseTo(-30)
    expect(efter.bubbla.x - fore.bubbla.x).toBeCloseTo(60)
    expect(efter.bubbla.y - fore.bubbla.y).toBeCloseTo(-30)
    expect(efter.svansMal.x - fore.svansMal.x).toBeCloseTo(60)
  })

  it('klampar förskjutningen så inget kan dras utanför scenen', () => {
    const extremt = flyttaBubbla(scen(), 0, { x: 9999, y: 9999 })
    for (const plats of scenPlatser(extremt).platser) {
      for (const rekt of [plats.figur, plats.bubbla]) {
        expect(rekt.x).toBeGreaterThanOrEqual(-0.001)
        expect(rekt.y).toBeGreaterThanOrEqual(-0.001)
        expect(rekt.x + rekt.bredd).toBeLessThanOrEqual(SCEN_BREDD + 0.001)
        expect(rekt.y + rekt.hojd).toBeLessThanOrEqual(SCEN_HOJD + 0.001)
      }
    }
  })

  it('ger fyra platser när ?-bubblan är dold', () => {
    expect(scenPlatser({ ...scen(), visaVetInte: false }).platser).toHaveLength(4)
  })
})
