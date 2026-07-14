import { aiSvarSchema, type GenereraBegaran } from '../src/domain/validering'
import type { Utsaga } from '../src/domain/scen'
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
): Promise<Utsaga[]> {
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
      continue
    }

    const validerat = aiSvarSchema.safeParse(tolkat.varde)
    if (validerat.success) return validerat.data.utsagor
    senasteFel = validerat.error.issues.map((i) => i.message).join('; ')
  }

  throw new GenereringsFel(
    'AI-svaret följde inte det förväntade formatet. Försök igen – eller skriv utsagorna manuellt.',
  )
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
