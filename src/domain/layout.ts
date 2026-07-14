import {
  BUBBLA_BREDD,
  BUBBLA_HOJD,
  BUBBLA_STAGGER,
  BUBBLA_TOPPMARGINAL,
  FIGUR_BOTTENMARGINAL,
  FIGUR_HOJD,
  FIGUR_MAX_BREDD,
  MINSTA_FONTSTORLEK,
  RADHOJD_FAKTOR,
  SCEN_BREDD,
  SCEN_HOJD,
} from './konstanter'

export interface Rekt {
  x: number
  y: number
  bredd: number
  hojd: number
}

export interface PlatsLayout {
  /** Var figuren ritas (bottenjusterad, proportioner bevarade). */
  figur: Rekt
  /** Pratbubblans yttre rektangel. */
  bubbla: Rekt
  /** Punkt som bubblans svans pekar mot (figurens huvud). */
  svansMal: { x: number; y: number }
}

/**
 * Beräknar layout för n platser (4 eller 5) i den logiska scenen.
 * Figurerna radas längs nederkanten; bubblorna växlar höjd (stagger) så att
 * scenen får ett levande serieuttryck utan att bubblorna kolliderar.
 */
export function beraknaLayout(figurMatt: { bredd: number; hojd: number }[]): PlatsLayout[] {
  const n = figurMatt.length
  const platsBredd = SCEN_BREDD / n

  return figurMatt.map((matt, i) => {
    const centrumX = platsBredd * (i + 0.5)

    // Normalisera figurhöjd; klipp bredd om figuren är ovanligt bred.
    let hojd = FIGUR_HOJD
    let bredd = (matt.bredd / matt.hojd) * hojd
    if (bredd > FIGUR_MAX_BREDD) {
      bredd = FIGUR_MAX_BREDD
      hojd = (matt.hojd / matt.bredd) * bredd
    }
    const figur: Rekt = {
      x: centrumX - bredd / 2,
      y: SCEN_HOJD - FIGUR_BOTTENMARGINAL - hojd,
      bredd,
      hojd,
    }

    const bubblaY = BUBBLA_TOPPMARGINAL + (i % 2 === 1 ? BUBBLA_STAGGER : 0)
    const bubbla: Rekt = {
      x: begransa(centrumX - BUBBLA_BREDD / 2, 8, SCEN_BREDD - BUBBLA_BREDD - 8),
      y: bubblaY,
      bredd: BUBBLA_BREDD,
      hojd: BUBBLA_HOJD,
    }

    return {
      figur,
      bubbla,
      svansMal: { x: centrumX, y: figur.y + 30 },
    }
  })
}

function begransa(varde: number, min: number, max: number): number {
  return Math.min(Math.max(varde, min), max)
}

export type Textmatare = (text: string, fontstorlek: number) => number

/** Greedy radbrytning; överlånga ord hårddelas så att inget någonsin sticker ut. */
export function radbrytText(
  text: string,
  maxBredd: number,
  fontstorlek: number,
  mat: Textmatare,
): string[] {
  const ord = text.trim().split(/\s+/).filter(Boolean)
  const rader: string[] = []
  let aktuell = ''

  const skjutIn = (del: string) => {
    const kandidat = aktuell ? `${aktuell} ${del}` : del
    if (mat(kandidat, fontstorlek) <= maxBredd) {
      aktuell = kandidat
      return
    }
    if (aktuell) rader.push(aktuell)
    if (mat(del, fontstorlek) <= maxBredd) {
      aktuell = del
      return
    }
    // Hårddela överlångt ord tecken för tecken.
    let bit = ''
    for (const tecken of del) {
      if (mat(bit + tecken, fontstorlek) > maxBredd && bit) {
        rader.push(bit)
        bit = tecken
      } else {
        bit += tecken
      }
    }
    aktuell = bit
  }

  for (const del of ord) skjutIn(del)
  if (aktuell) rader.push(aktuell)
  return rader.length ? rader : ['']
}

export interface PassadText {
  fontstorlek: number
  rader: string[]
  radhojd: number
}

/**
 * Hittar största fontstorlek (från basstorleken och nedåt) där texten ryms i
 * bubblans inneryta, både på bredden och höjden.
 */
export function passaText(
  text: string,
  innerBredd: number,
  innerHojd: number,
  basStorlek: number,
  mat: Textmatare,
): PassadText {
  for (let storlek = basStorlek; storlek >= MINSTA_FONTSTORLEK; storlek -= 1) {
    const rader = radbrytText(text, innerBredd, storlek, mat)
    const radhojd = storlek * RADHOJD_FAKTOR
    const ryms =
      rader.length * radhojd <= innerHojd && rader.every((r) => mat(r, storlek) <= innerBredd)
    if (ryms) return { fontstorlek: storlek, rader, radhojd }
  }
  const rader = radbrytText(text, innerBredd, MINSTA_FONTSTORLEK, mat)
  return { fontstorlek: MINSTA_FONTSTORLEK, rader, radhojd: MINSTA_FONTSTORLEK * RADHOJD_FAKTOR }
}
