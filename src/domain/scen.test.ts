import { describe, expect, it } from 'vitest'
import type { Figur } from './figurer'
import { ersattUtsagor, flyttaBubbla, skapaScen, synligaBubblor, type Utsaga } from './scen'
import { ALLA_KATEGORIER } from './kategorier'
import { VET_INTE_TEXT } from './konstanter'

const FIGURER: Figur[] = ['mellan1', 'mellan2', 'mellan3', 'mellan4', 'mellan5'].map((fil) => ({
  fil: `${fil}.png`,
  stadium: 'mellan',
  bredd: 800,
  hojd: 1400,
}))

const UTSAGOR: Utsaga[] = [
  { kategori: 'korrekt', text: 'En halv är en av två lika delar av samma helhet.' },
  { kategori: 'intuitiv', text: 'En halv pizza är alltid mer än en halv smörgås, så en halv är olika mycket.' },
  { kategori: 'overgeneralisering', text: '1/2 + 1/4 blir 2/6, man lägger ihop uppe och nere.' },
  { kategori: 'falsklogik', text: 'Delar man något blir det mindre, så en halv väger mindre än helheten delat på två.' },
]

function scenMedFro(fro: number) {
  return skapaScen({ begrepp: 'Hur stor är en halv?', arskurs: '4', utsagor: UTSAGOR, figurer: FIGURER, fro })
}

describe('skapaScen', () => {
  it('skapar exakt fem bubblor – en per kategori', () => {
    const scen = scenMedFro(1)
    expect(scen.bubblor).toHaveLength(5)
    expect(new Set(scen.bubblor.map((b) => b.kategori))).toEqual(new Set(ALLA_KATEGORIER))
  })

  it('sätter stadium från årskurs och standardtext på ?-bubblan', () => {
    const scen = scenMedFro(1)
    expect(scen.stadium).toBe('mellan')
    expect(scen.bubblor.find((b) => b.kategori === 'vetinte')?.text).toBe(VET_INTE_TEXT)
  })

  it('är reproducerbar med samma frö', () => {
    expect(scenMedFro(42)).toEqual(scenMedFro(42))
  })

  it('slumpar kategori→figur så att ALLA figurer får ALLA kategorier över många körningar', () => {
    const sedda = new Set<string>()
    for (let fro = 0; fro < 400; fro++) {
      for (const bubbla of scenMedFro(fro).bubblor) {
        sedda.add(`${bubbla.figur.fil}:${bubbla.kategori}`)
      }
    }
    // 5 figurer × 5 kategorier = 25 kombinationer – ingen figur är "den som har rätt".
    expect(sedda.size).toBe(25)
  })

  it('kastar fel om figurer saknas', () => {
    expect(() =>
      skapaScen({ begrepp: 'x', arskurs: '4', utsagor: UTSAGOR, figurer: FIGURER.slice(0, 3), fro: 1 }),
    ).toThrow()
  })
})

describe('flyttaBubbla', () => {
  it('sparar förskjutningen för rätt bubbla och lämnar övriga orörda', () => {
    const scen = scenMedFro(7)
    const ny = flyttaBubbla(scen, 2, { x: 120, y: -40 })
    expect(ny.bubblor[2].forskjutning).toEqual({ x: 120, y: -40 })
    expect(ny.bubblor[2].figur).toEqual(scen.bubblor[2].figur)
    for (const i of [0, 1, 3, 4]) {
      expect(ny.bubblor[i].forskjutning).toEqual({ x: 0, y: 0 })
    }
  })

  it('nya scener har nollställd förskjutning', () => {
    for (const bubbla of scenMedFro(7).bubblor) {
      expect(bubbla.forskjutning).toEqual({ x: 0, y: 0 })
    }
  })

  it('ignorerar ogiltiga index', () => {
    const scen = scenMedFro(7)
    expect(flyttaBubbla(scen, 9, { x: 10, y: 10 })).toBe(scen)
  })
})

describe('öppna "?"-bubblan', () => {
  it('använder AI:ns formulering på valt språk när den finns', () => {
    const scen = skapaScen({
      begrepp: 'Why do ships float?',
      arskurs: '4',
      sprak: 'engelska',
      utsagor: UTSAGOR,
      oppenFraga: "I don't know … could it be something else?",
      figurer: FIGURER,
      fro: 11,
    })
    expect(scen.bubblor.find((b) => b.kategori === 'vetinte')?.text).toBe(
      "I don't know … could it be something else?",
    )
  })

  it('faller tillbaka på svensk standardtext utan AI-formulering', () => {
    expect(scenMedFro(11).bubblor.find((b) => b.kategori === 'vetinte')?.text).toBe(VET_INTE_TEXT)
  })
})

describe('ersattUtsagor', () => {
  it('byter texter men behåller tilldelning, placering och ?-bubblan', () => {
    const scen = flyttaBubbla(scenMedFro(3), 1, { x: 50, y: 20 })
    const nya: Utsaga[] = UTSAGOR.map((u) => ({ ...u, text: `NY: ${u.text}` }))
    const ny = ersattUtsagor(scen, nya)
    for (const bubbla of ny.bubblor) {
      if (bubbla.kategori === 'vetinte') expect(bubbla.text).toBe(VET_INTE_TEXT)
      else expect(bubbla.text.startsWith('NY: ')).toBe(true)
    }
    expect(ny.bubblor.map((b) => b.figur.fil)).toEqual(scen.bubblor.map((b) => b.figur.fil))
    expect(ny.bubblor[1].forskjutning).toEqual({ x: 50, y: 20 })
  })

  it('uppdaterar ?-bubblan när AI skickar en ny formulering', () => {
    const ny = ersattUtsagor(scenMedFro(3), UTSAGOR, 'Kan det vara på ett helt annat vis?')
    expect(ny.bubblor.find((b) => b.kategori === 'vetinte')?.text).toBe(
      'Kan det vara på ett helt annat vis?',
    )
  })
})

describe('synligaBubblor', () => {
  it('filtrerar bort ?-bubblan när den är avslagen', () => {
    const scen = { ...scenMedFro(5), visaVetInte: false }
    const synliga = synligaBubblor(scen)
    expect(synliga).toHaveLength(4)
    expect(synliga.every((b) => b.kategori !== 'vetinte')).toBe(true)
  })
})
