import { describe, expect, it } from 'vitest'
import type { Figur } from './figurer'
import { bytUtsagaPlats, ersattUtsagor, skapaScen, synligaBubblor, type Utsaga } from './scen'
import { ALLA_KATEGORIER } from './kategorier'
import { VET_INTE_TEXT } from './konstanter'

const FIGURER: Figur[] = ['mellan1', 'mellan2', 'mellan3', 'mellan4', 'mellan5'].map((fil) => ({
  fil: `${fil}.png`,
  stadium: 'mellan',
  bredd: 800,
  hojd: 1400,
}))

const UTSAGOR: Utsaga[] = [
  { kategori: 'korrekt', text: 'En halv är en av två lika delar.' },
  { kategori: 'fel', text: 'En halv är alltid mindre än en fjärdedel.' },
  { kategori: 'igangsattande', text: 'Kan en halv vara olika stor?' },
  { kategori: 'fakta', text: 'En halv skrivs 1/2.' },
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

describe('bytUtsagaPlats', () => {
  it('byter kategori och text men figurerna står kvar', () => {
    const scen = scenMedFro(7)
    const ny = bytUtsagaPlats(scen, 0, 1)
    expect(ny.bubblor[0].kategori).toBe(scen.bubblor[1].kategori)
    expect(ny.bubblor[0].text).toBe(scen.bubblor[1].text)
    expect(ny.bubblor[1].kategori).toBe(scen.bubblor[0].kategori)
    expect(ny.bubblor[0].figur).toEqual(scen.bubblor[0].figur)
    expect(ny.bubblor[1].figur).toEqual(scen.bubblor[1].figur)
  })

  it('ignorerar ogiltiga index', () => {
    const scen = scenMedFro(7)
    expect(bytUtsagaPlats(scen, 0, 9)).toBe(scen)
  })
})

describe('ersattUtsagor', () => {
  it('byter texter men behåller tilldelningen och ?-bubblan', () => {
    const scen = scenMedFro(3)
    const nya: Utsaga[] = UTSAGOR.map((u) => ({ ...u, text: `NY: ${u.text}` }))
    const ny = ersattUtsagor(scen, nya)
    for (const bubbla of ny.bubblor) {
      if (bubbla.kategori === 'vetinte') expect(bubbla.text).toBe(VET_INTE_TEXT)
      else expect(bubbla.text.startsWith('NY: ')).toBe(true)
    }
    expect(ny.bubblor.map((b) => b.figur.fil)).toEqual(scen.bubblor.map((b) => b.figur.fil))
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
