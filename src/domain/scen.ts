import type { Arskurs, Stadium } from './arskurs'
import { arskursTillStadium } from './arskurs'
import { AI_KATEGORIER, type AiKategori, type Kategori } from './kategorier'
import { BUBBLA_VARIANTER, VET_INTE_TEXT } from './konstanter'
import type { Figur } from './figurer'
import { mulberry32, seedadBlandning, type Slumpkalla } from './slump'

export interface Utsaga {
  kategori: AiKategori
  text: string
}

/** Lärarens fria förflyttning av figur + bubbla, i logiska scenenheter. */
export interface Forskjutning {
  x: number
  y: number
}

export interface Pratbubbla {
  kategori: Kategori
  text: string
  figur: Figur
  /** Fyllnadsfärg ur BUBBLA_VARIANTER. */
  fill: string
  /** Nollställd vid generering; ändras när läraren drar figuren i scenen. */
  forskjutning: Forskjutning
}

export interface Scen {
  begrepp: string
  arskurs: Arskurs
  stadium: Stadium
  sprak: string
  /** Objekt-URL till lärarens uppladdade bild – lämnar aldrig webbläsaren. */
  bakgrundUrl?: string
  /** En bubbla per figurplats, i vänster→höger-ordning. */
  bubblor: Pratbubbla[]
  visaVetInte: boolean
}

/**
 * Skapar en scen med SLUMPAD kategori→figur-tilldelning (kravet: ingen figur är
 * konsekvent "den som har rätt"). Både figurordning och kategoriordning blandas.
 */
export function skapaScen(parametrar: {
  begrepp: string
  arskurs: Arskurs
  sprak?: string
  utsagor: Utsaga[]
  /** Öppna "?"-bubblan på valt språk; utan värde används svensk standardtext. */
  oppenFraga?: string
  figurer: Figur[]
  fro: number
  bakgrundUrl?: string
}): Scen {
  const { begrepp, arskurs, utsagor, figurer, fro } = parametrar
  const slump = mulberry32(fro)
  const stadium = arskursTillStadium(arskurs)

  const valdaFigurer = seedadBlandning(figurer, slump).slice(0, 5)
  if (valdaFigurer.length < 5) {
    throw new Error(`Behöver 5 figurer för stadium ${stadium}, fick ${valdaFigurer.length}`)
  }

  const kategoriOrdning = blandaKategorier(slump)
  const textPerKategori = new Map<Kategori, string>(
    utsagor.map((u) => [u.kategori as Kategori, u.text]),
  )
  textPerKategori.set('vetinte', parametrar.oppenFraga?.trim() || VET_INTE_TEXT)

  const bubblor: Pratbubbla[] = kategoriOrdning.map((kategori, i) => ({
    kategori,
    text: textPerKategori.get(kategori) ?? '',
    figur: valdaFigurer[i],
    fill: BUBBLA_VARIANTER[i % BUBBLA_VARIANTER.length],
    forskjutning: { x: 0, y: 0 },
  }))

  return {
    begrepp,
    arskurs,
    stadium,
    sprak: parametrar.sprak ?? 'svenska',
    bakgrundUrl: parametrar.bakgrundUrl,
    bubblor,
    visaVetInte: true,
  }
}

export function blandaKategorier(slump: Slumpkalla): Kategori[] {
  return seedadBlandning<Kategori>([...AI_KATEGORIER, 'vetinte'], slump)
}

/** Flyttar figur + pratbubbla till ny plats i scenen (drag-och-släpp). */
export function flyttaBubbla(scen: Scen, index: number, forskjutning: Forskjutning): Scen {
  if (index < 0 || index >= scen.bubblor.length) return scen
  const bubblor = scen.bubblor.map((b, i) => (i === index ? { ...b, forskjutning } : b))
  return { ...scen, bubblor }
}

export function uppdateraBubbeltext(scen: Scen, index: number, text: string): Scen {
  const bubblor = scen.bubblor.map((b, i) => (i === index ? { ...b, text } : b))
  return { ...scen, bubblor }
}

/** Ersätter texterna för AI-kategorierna men behåller figurtilldelning och placering. */
export function ersattUtsagor(scen: Scen, utsagor: Utsaga[], oppenFraga?: string): Scen {
  const textPerKategori = new Map(utsagor.map((u) => [u.kategori, u.text]))
  const bubblor = scen.bubblor.map((b) => {
    if (b.kategori === 'vetinte') {
      return oppenFraga?.trim() ? { ...b, text: oppenFraga.trim() } : b
    }
    const ny = textPerKategori.get(b.kategori as AiKategori)
    return ny !== undefined ? { ...b, text: ny } : b
  })
  return { ...scen, bubblor }
}

/** Bubblor som faktiskt ska visas/exporteras (respekterar ?-bubblans toggle). */
export function synligaBubblor(scen: Scen): Pratbubbla[] {
  return scen.visaVetInte ? scen.bubblor : scen.bubblor.filter((b) => b.kategori !== 'vetinte')
}
