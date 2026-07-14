import { arskursTillStadium, type Arskurs } from '../src/domain/arskurs'
import { MAXLANGD_PER_STADIUM } from '../src/domain/konstanter'

const REGISTER_PER_STADIUM = {
  lag: `Barn i förskoleklass–åk 3 (6–9 år): mycket enkla, konkreta meningar, vardagsord,
gärna kopplat till egna upplevelser ("när jag...", "min mormor sa..."). Inga facktermer.`,
  mellan: `Elever i åk 4–6 (10–12 år): enkla men fullständiga resonemang, enstaka enkla
facktermer är okej om de är vanliga i skolan. Nyfiken, prövande ton.`,
  hog: `Elever i åk 7–9 (13–15 år): mer utvecklade resonemang, vanliga facktermer,
men fortfarande talspråkligt och autentiskt tonårsspråk – inte läroboksspråk.`,
} as const

/**
 * Bygger prompten för utsagegenerering. Skolverkets Concept Cartoons är den
 * pedagogiska kvalitetsribban (metoden – aldrig deras texter).
 */
export function byggPrompt(begrepp: string, arskurs: Arskurs, sprak: string): {
  system: string
  anvandare: string
} {
  const stadium = arskursTillStadium(arskurs)
  const maxlangd = MAXLANGD_PER_STADIUM[stadium]

  const system = `Du skriver elevutsagor till "concept cartoons" – diskussionsbilder där
tecknade barn säger olika saker om ett begrepp, enligt Keogh & Naylors metod som
Skolverket använder. Syftet är KLASSRUMSDISKUSSION, inte rätt svar: eleverna ska
reagera på barnens påståenden, och vanliga missuppfattningar ska bli synliga och
möjliga att resonera om.

Skriv exakt fyra utsagor i första person, som om olika barn säger dem:
1. "korrekt" – vetenskapligt/ämnesmässigt korrekt, men uttryckt som ett barn skulle säga det.
2. "fel" – en PLAUSIBEL och VANLIG missuppfattning som många elever faktiskt har.
   Den ska kännas rimlig och lätt att hålla med om – aldrig dum, hånfull eller överdriven.
3. "igangsattande" – en tankeväckande, öppen utsaga eller motfråga som sätter igång resonemang.
4. "fakta" – en relaterad, korrekt faktautsaga som ger diskussionen mer att arbeta med.

Regler:
- Språkregister: ${REGISTER_PER_STADIUM[stadium]}
- Skriv på ${sprak}.
- Max ${Math.round(maxlangd * 0.85)} tecken per utsaga.
- Inga namn på barn, inga stereotyper, ingen som pekas ut.
- Utsagorna ska handla om SAMMA situation/begrepp så att de går att ställa mot varandra.

Svara med ENDAST giltig JSON, utan kodstaket eller kommentarer, exakt i detta format:
{"utsagor":[{"kategori":"korrekt","text":"..."},{"kategori":"fel","text":"..."},{"kategori":"igangsattande","text":"..."},{"kategori":"fakta","text":"..."}]}`

  const anvandare = `Begrepp/fråga från läraren: "${begrepp}"
Årskurs: ${arskurs === 'F' ? 'förskoleklass' : arskurs}`

  return { system, anvandare }
}
