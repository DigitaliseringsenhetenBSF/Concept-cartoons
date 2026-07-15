import {
  forklaringSvarSchema,
  type ForklaraBegaran,
  type ForklaringSvar,
} from '../src/domain/validering'
import { byggForklaringsPrompt } from './forklaringsprompt'
import type { ModellAnrop } from './generera'
import { GenereringsFel } from './generera'

const MAX_FORSOK = 2

/**
 * Kör förklaringsprompt → modell → strikt schemavalidering. Samma mönster som
 * genereraUtsagor: ett omförsök vid kontraktsbrott, därefter ett tydligt fel.
 */
export async function genereraForklaringar(
  begaran: ForklaraBegaran,
  anropaModell: ModellAnrop,
): Promise<ForklaringSvar> {
  const { system, anvandare } = byggForklaringsPrompt(begaran)

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
      console.warn(`Förklaringssvar avvisat (${tolkat.fel}):`, ratext.slice(0, 300))
      continue
    }

    const validerat = forklaringSvarSchema.safeParse(tolkat.varde)
    if (!validerat.success) {
      senasteFel = validerat.error.issues.map((i) => i.message).join('; ')
      console.warn(`Förklaringssvar avvisat (${senasteFel}):`, JSON.stringify(tolkat.varde).slice(0, 300))
      continue
    }

    return validerat.data
  }

  throw new GenereringsFel(
    'Förklaringen följde inte det förväntade formatet. Försök igen.',
  )
}

function tolkaJson(ratext: string): { ok: true; varde: unknown } | { ok: false; fel: string } {
  const match = ratext.match(/\{[\s\S]*\}/)
  if (!match) return { ok: false, fel: 'ingen JSON hittades i svaret' }
  try {
    return { ok: true, varde: JSON.parse(match[0]) }
  } catch {
    return { ok: false, fel: 'JSON gick inte att tolka' }
  }
}
