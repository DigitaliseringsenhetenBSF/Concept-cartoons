import type { Stadium } from './arskurs'

/** En post i assets-registret (public/figurer/manifest.json är källa – inget hårdkodas). */
export interface Figur {
  fil: string
  stadium: Stadium
  bredd: number
  hojd: number
}

interface ManifestPost {
  file: string
  stadium: string
  width: number
  height: number
  alpha: boolean
}

/** Manifestets stadium-fält är fritext ("lågstadiet (F–3)") – filprefixet är den stabila nyckeln. */
function stadiumFranFilnamn(fil: string): Stadium {
  if (fil.startsWith('lag')) return 'lag'
  if (fil.startsWith('mellan')) return 'mellan'
  if (fil.startsWith('hog')) return 'hog'
  throw new Error(`Okänt figurfilnamn: ${fil}`)
}

export function tolkaManifest(poster: ManifestPost[]): Figur[] {
  return poster.map((p) => ({
    fil: p.file,
    stadium: stadiumFranFilnamn(p.file),
    bredd: p.width,
    hojd: p.height,
  }))
}

export function figurerForStadium(alla: Figur[], stadium: Stadium): Figur[] {
  return alla.filter((f) => f.stadium === stadium)
}

export function figurUrl(fil: string): string {
  return `/figurer/${fil}`
}
