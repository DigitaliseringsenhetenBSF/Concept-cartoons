import { arskursTillStadium } from '../src/domain/arskurs'
import { AI_KATEGORIER } from '../src/domain/kategorier'
import type { ForklaraBegaran } from '../src/domain/validering'

const REGISTER_PER_STADIUM = {
  lag: 'Barn i förskoleklass–åk 3 (6–9 år). Förklara enkelt och konkret för läraren.',
  mellan: 'Elever i åk 4–6 (10–12 år). Förklara tydligt och pedagogiskt för läraren.',
  hog: 'Elever i åk 7–9 (13–15 år). Förklara med ämnesdidaktisk skärpa för läraren.',
} as const

/** Kort definition per kategori – ram för AI:n så förklaringarna hamnar rätt. */
const KATEGORI_KORT: Record<(typeof AI_KATEGORIER)[number], string> = {
  korrekt: 'det vetenskapligt/matematiskt korrekta svaret',
  intuitiv: 'den intuitiva missuppfattningen (känns rätt vid första anblick men är fel)',
  overgeneralisering: 'övergeneraliseringen (en inlärd regel tillämpas där den inte gäller)',
  falsklogik: 'den falska logiken (rimlig tankekedja men felaktig utgångspunkt/mekanism)',
}

/**
 * Bygger prompten för lärarstödet. Till skillnad från utsagegenereringen får
 * modellen här SE de konkreta utsagorna, och ska förklara varje ruta UTIFRÅN
 * begreppet och den faktiska texten – inte med generiska mallexempel.
 */
export function byggForklaringsPrompt(begaran: ForklaraBegaran): {
  system: string
  anvandare: string
} {
  const stadium = arskursTillStadium(begaran.arskurs)

  const system = `Du är ämnesdidaktisk handledare och hjälper en LÄRARE att leda ett
"concept cartoons"-samtal (Keogh & Naylors metod som Skolverket använder). Fyra
tecknade barn säger olika saker om ett begrepp. Målet är klassrumsdiskussion och
resonemang – inte att avslöja rätt svar.

Du får begreppet och de fyra faktiska utsagorna. För VARJE kategori ska du skriva
två korta fält, riktade till läraren och förankrade i den konkreta utsagan:

- "varfor": Varför just DEN HÄR texten hör till sin kategori, kopplat till
  begreppet. Peka på vad i formuleringen som avslöjar kategorin. 1–2 meningar.
- "samtal": Ett konkret samtalsdrag – en fråga eller ett grepp läraren kan använda
  för att lyfta just den här utsagan i diskussionen. 1–2 meningar.

Kategorierna:
1. "korrekt" – ${KATEGORI_KORT.korrekt}
2. "intuitiv" – ${KATEGORI_KORT.intuitiv}
3. "overgeneralisering" – ${KATEGORI_KORT.overgeneralisering}
4. "falsklogik" – ${KATEGORI_KORT.falsklogik}

Regler:
- Skriv på ${begaran.sprak}.
- ${REGISTER_PER_STADIUM[stadium]}
- Utgå ALLTID från den konkreta utsagan och begreppet – inga generiska mallexempel.
- Avslöja inte vilket svaret är på ett sätt som dödar diskussionen; hjälp läraren
  att låta eleverna resonera.
- Håll varje fält kort (max ~2 meningar).

Svara med ENDAST giltig JSON, utan kodstaket eller kommentarer, exakt i detta format:
{"forklaringar":[{"kategori":"korrekt","varfor":"...","samtal":"..."},{"kategori":"intuitiv","varfor":"...","samtal":"..."},{"kategori":"overgeneralisering","varfor":"...","samtal":"..."},{"kategori":"falsklogik","varfor":"...","samtal":"..."}]}`

  const utsagorText = begaran.utsagor
    .map((u) => `- ${u.kategori}: "${u.text}"`)
    .join('\n')

  const anvandare = `Begrepp/fråga: "${begaran.begrepp}"
Årskurs: ${begaran.arskurs === 'F' ? 'förskoleklass' : begaran.arskurs}
Barnens utsagor:
${utsagorText}${begaran.oppenFraga ? `\nÖppen "?"-bubbla: "${begaran.oppenFraga}"` : ''}`

  return { system, anvandare }
}
