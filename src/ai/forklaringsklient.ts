import type { AiKategori } from '../domain/kategorier'
import type { Arskurs } from '../domain/arskurs'
import { AiFel } from './klient'

export interface ForklaringParametrar {
  begrepp: string
  arskurs: Arskurs
  sprak: string
  utsagor: { kategori: AiKategori; text: string }[]
  oppenFraga?: string
}

export interface KategoriForklaring {
  kategori: AiKategori
  varfor: string
  samtal: string
}

/**
 * Hämtar AI-genererat lärarstöd från serverns /api/forklara. Förklaringarna
 * beskriver varje ruta utifrån begreppet och de faktiska pratbubbletexterna.
 * API-nyckeln finns bara på servern.
 */
export async function hamtaForklaringar(
  parametrar: ForklaringParametrar,
): Promise<KategoriForklaring[]> {
  let svar: Response
  try {
    svar = await fetch('/api/forklara', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parametrar),
    })
  } catch {
    throw new AiFel('Kunde inte nå AI-servern för lärarstödet.')
  }

  const data = (await svar.json().catch(() => null)) as
    | { forklaringar?: KategoriForklaring[]; fel?: string }
    | null
  if (!svar.ok || !data?.forklaringar) {
    throw new AiFel(data?.fel ?? 'Kunde inte hämta lärarstödet. Försök igen.')
  }
  return data.forklaringar
}
