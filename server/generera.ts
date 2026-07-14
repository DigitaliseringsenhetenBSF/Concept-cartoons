import { aiSvarSchema, type AiSvar, type GenereraBegaran } from '../src/domain/validering'
import { byggPrompt } from './prompt'

/** Modellanrop injiceras så att logiken kan testas utan nätverk. */
export type ModellAnrop = (system: string, anvandare: string) => Promise<string>

export class GenereringsFel extends Error {}

const MAX_FORSOK = 2

/**
 * Kör prompt → modell → strikt schemavalidering. Vid kontraktsbrott görs ETT
 * omförsök med felbeskrivning; därefter kastas ett tydligt svenskt fel.
 */
export async function genereraUtsagor(
  begaran: GenereraBegaran,
  anropaModell: ModellAnrop,
): Promise<AiSvar> {
  const { system, anvandare } = byggPrompt(begaran.begrepp, begaran.arskurs, begaran.sprak)

  let senasteFel = ''
  for (let forsok = 1; forsok <= MAX_FORSOK; forsok++) {
    const fraga =
      forsok === 1
        ? anvandare
        : `${anvandare}\n\nDitt förra svar var ogiltigt (${senasteFel}). Svara igen med ENDAST giltig JSON enligt formatet.`

    const ratext = await anropaModell(system, fraga)
    const tolkat = tolkaJson(ratext)
    if (!tolkat.ok) {
      senasteFel = tolkat.fel
      console.warn(`AI-svar avvisat (${tolkat.fel}):`, ratext.slice(0, 300))
      continue
    }

    const validerat = aiSvarSchema.safeParse(normaliseraKategorier(tolkat.varde))
    if (validerat.success) return validerat.data
    senasteFel = validerat.error.issues.map((i) => i.message).join('; ')
    console.warn(`AI-svar avvisat (${senasteFel}):`, JSON.stringify(tolkat.varde).slice(0, 300))
  }

  throw new GenereringsFel(
    'AI-svaret följde inte det förväntade formatet. Försök igen – eller skriv utsagorna manuellt.',
  )
}

/**
 * Modellen skriver ibland kategorinycklarna med svensk stavning
 * ("Övergeneralisering", "falsk logik") trots mallen. Normalisera till
 * kontraktets nycklar innan validering: gemener, inga diakriter, inga
 * mellanslag/bindestreck.
 */
export function normaliseraKategorier(varde: unknown): unknown {
  if (typeof varde !== 'object' || varde === null || !('utsagor' in varde)) return varde
  const utsagor = (varde as { utsagor: unknown }).utsagor
  if (!Array.isArray(utsagor)) return varde
  return {
    ...varde,
    utsagor: utsagor.map((u) =>
      typeof u === 'object' && u !== null && typeof (u as { kategori?: unknown }).kategori === 'string'
        ? { ...u, kategori: normaliseraNyckel((u as { kategori: string }).kategori) }
        : u,
    ),
  }
}

function normaliseraNyckel(kategori: string): string {
  return kategori
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function tolkaJson(ratext: string): { ok: true; varde: unknown } | { ok: false; fel: string } {
  // Tåla kodstaket och omgivande text – plocka ut första JSON-objektet.
  const match = ratext.match(/\{[\s\S]*\}/)
  if (!match) return { ok: false, fel: 'ingen JSON hittades i svaret' }
  try {
    return { ok: true, varde: JSON.parse(match[0]) }
  } catch {
    return { ok: false, fel: 'JSON gick inte att tolka' }
  }
}
