import { describe, expect, it } from 'vitest'
import {
  beraknaLayout,
  passaText,
  passaTitel,
  radbrytText,
  type Rekt,
  type Textmatare,
} from './layout'
import {
  FIGUR_HOJD,
  FIGUR_MAX_BREDD,
  SCEN_BREDD,
  SCEN_HOJD,
  TITEL_HOJD,
} from './konstanter'

/** Deterministisk mätare för tester: bredd ~ 0.55 × fontstorlek per tecken. */
const mat: Textmatare = (text, fontstorlek) => text.length * fontstorlek * 0.55

const FEM_FIGURER = Array.from({ length: 5 }, (_, i) => ({ bredd: 700 + i * 100, hojd: 1400 }))

function overlappar(a: Rekt, b: Rekt): boolean {
  return (
    a.x < b.x + b.bredd && b.x < a.x + a.bredd && a.y < b.y + b.hojd && b.y < a.y + a.hojd
  )
}

describe('beraknaLayout', () => {
  it('håller alla figurer och bubblor inom scenen', () => {
    for (const plats of beraknaLayout(FEM_FIGURER)) {
      for (const rekt of [plats.figur, plats.bubbla]) {
        expect(rekt.x).toBeGreaterThanOrEqual(0)
        expect(rekt.y).toBeGreaterThanOrEqual(0)
        expect(rekt.x + rekt.bredd).toBeLessThanOrEqual(SCEN_BREDD)
        expect(rekt.y + rekt.hojd).toBeLessThanOrEqual(SCEN_HOJD)
      }
    }
  })

  it('bottenjusterar figurer och respekterar maxmått', () => {
    for (const plats of beraknaLayout(FEM_FIGURER)) {
      expect(plats.figur.hojd).toBeLessThanOrEqual(FIGUR_HOJD)
      expect(plats.figur.bredd).toBeLessThanOrEqual(FIGUR_MAX_BREDD)
    }
  })

  it('låter inga pratbubblor kollidera', () => {
    const platser = beraknaLayout(FEM_FIGURER)
    for (let i = 0; i < platser.length; i++) {
      for (let j = i + 1; j < platser.length; j++) {
        expect(overlappar(platser[i].bubbla, platser[j].bubbla)).toBe(false)
      }
    }
  })

  it('fungerar även med fyra platser (dold ?-bubbla)', () => {
    expect(beraknaLayout(FEM_FIGURER.slice(0, 4))).toHaveLength(4)
  })

  it('bevarar figurens proportioner', () => {
    const [plats] = beraknaLayout([{ bredd: 700, hojd: 1400 }])
    expect(plats.figur.bredd / plats.figur.hojd).toBeCloseTo(0.5, 5)
  })
})

describe('radbrytText', () => {
  it('bryter text i rader som ryms', () => {
    const rader = radbrytText('en två tre fyra fem sex', 100, 20, mat)
    expect(rader.length).toBeGreaterThan(1)
    for (const rad of rader) expect(mat(rad, 20)).toBeLessThanOrEqual(100)
  })

  it('hårddelar överlånga ord', () => {
    const rader = radbrytText('abcdefghijklmnopqrstuvwxyz', 60, 20, mat)
    expect(rader.length).toBeGreaterThan(1)
    for (const rad of rader) expect(mat(rad, 20)).toBeLessThanOrEqual(60)
  })

  it('hanterar tom text', () => {
    expect(radbrytText('', 100, 20, mat)).toEqual([''])
  })
})

describe('passaTitel – rubriken visas alltid i sin helhet', () => {
  const kort = 'Varför regnar det?'
  const lang =
    'Varför har regnbågen sina färger och varför ser man den bara ibland när solen skiner samtidigt som det regnar?'

  it('behåller varje ord ur begreppet – ingenting klipps bort', () => {
    for (const titel of [kort, lang]) {
      const passad = passaTitel(titel, mat)
      const utskrivet = passad.rader.join(' ').replace(/\s+/g, ' ')
      for (const ord of titel.split(/\s+/)) {
        expect(utskrivet).toContain(ord)
      }
      expect(utskrivet).not.toContain('…')
    }
  })

  it('krymper och radbryter så att lång text ryms i rubrikytan', () => {
    const passad = passaTitel(lang, mat)
    expect(passad.rader.length).toBeGreaterThan(1)
    expect(passad.rader.length * passad.radhojd).toBeLessThanOrEqual(passad.rekt.hojd)
    for (const rad of passad.rader) {
      expect(mat(rad, passad.fontstorlek)).toBeLessThanOrEqual(passad.rekt.bredd)
    }
  })

  it('håller rubriken inom scenen och ovanför bubblorna', () => {
    const passad = passaTitel(lang, mat)
    const underkant = passad.forstaBaslinje + (passad.rader.length - 1) * passad.radhojd
    expect(passad.rekt.y).toBeGreaterThanOrEqual(0)
    expect(underkant).toBeLessThanOrEqual(TITEL_HOJD)

    const oversta = Math.min(...beraknaLayout(FEM_FIGURER).map((p) => p.bubbla.y))
    expect(oversta).toBeGreaterThanOrEqual(TITEL_HOJD)
  })
})

describe('passaText', () => {
  it('behåller basstorleken för kort text', () => {
    expect(passaText('Hej!', 250, 170, 30, mat).fontstorlek).toBe(30)
  })

  it('krymper fontstorleken tills lång text ryms', () => {
    const lang = 'Det här är en väldigt lång utsaga som verkligen inte ryms på en enda rad i bubblan utan måste brytas och krympas.'
    const passad = passaText(lang, 250, 170, 30, mat)
    expect(passad.fontstorlek).toBeLessThan(30)
    expect(passad.rader.length * passad.radhojd).toBeLessThanOrEqual(170)
  })
})
