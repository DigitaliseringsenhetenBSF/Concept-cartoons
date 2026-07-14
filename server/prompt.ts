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
 * Bygger prompten för utsagegenerering. Kategoridefinitionerna följer
 * produktägarens taxonomi (SPEC §3), med Skolverkets Concept Cartoons som
 * pedagogisk kvalitetsribba (metoden – aldrig deras texter).
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
reagera på barnens påståenden, och olika slags missuppfattningar ska bli synliga
och möjliga att resonera om.

Skriv exakt fyra utsagor som olika barn säger OM det som diskuteras.

RÖST – VIKTIGAST AV ALLT:
Barnen talar OM fenomenet, aldrig SOM fenomenet. Använd INGA förstapersonsord
("jag", "mig", "min", "vi", "oss" – och motsvarande på andra språk). Namnge i
stället det som diskuteras, eller använd "de"/"den"/"det".
- FEL: "Jag skriker på våren för att det är parningstid." (barnet låtsas vara katten)
- FEL: "Jag tror att katterna skriker på våren." (förstapersonsord)
- RÄTT: "Katterna skriker på våren för att det är parningstid."
- RÄTT: "De låter som bebisar för att locka till sig andra katter."
Varje utsaga ska kunna läsas som ett påstående om verkligheten, som eleverna kan
hålla med om eller invända mot.


1. "korrekt" – DET VETENSKAPLIGT KORREKTA SVARET. Den korrekta förklaringen
   enligt gällande vetenskapliga/matematiska principer, uttryckt på enkelt
   vardagsspråk anpassat för målgruppen utan att förlora sin stringens.
   (I stil med: "Vattnet avdunstar vid alla temperaturer.")

2. "intuitiv" – DEN INTUITIVA/VARDAGLIGA MISSUPPFATTNINGEN. Det som känns
   logiskt vid första anblick men är vetenskapligt fel. Bygger ofta på
   hopblandade vardagsbegrepp (vikt/volym, värme/temperatur) eller förhastade
   slutsatser utifrån det man direkt kan se.
   (I stil med att bara räkna de minsta rutorna på ett schackbräde, eller
   "ju längre vinkelben, desto större vinkel".)

3. "overgeneralisering" – ÖVERGENERALISERINGEN (regelföljande fel). Eleven har
   lärt sig en regel men tillämpar den där den inte gäller, eller hoppar över
   nödvändiga mellansteg.
   (I stil med att addera täljare för sig och nämnare för sig, eller
   "144 är delbart med 4 eftersom det slutar på 4".)

4. "falsklogik" – DET MISSUPPFATTADE ORSAKSSAMBANDET (falsk logik). En logisk
   tankekedja där utgångspunkten eller mekanismen är felaktig – en egen, ofta
   bakvänd förklaringsmodell.
   (I stil med "sätt inte jackan på snögubben, då smälter den" – som om jackan
   skapade värme i stället för att isolera.)

Regler:
- Ingen förstapersonsröst (se RÖST ovan) – varken i utsagorna eller i "oppenFraga".
- Språkregister: ${REGISTER_PER_STADIUM[stadium]}
- Skriv på ${sprak}.
- Max ${Math.round(maxlangd * 0.85)} tecken per utsaga.
- Inga namn på barn, inga stereotyper, ingen som pekas ut eller förlöjligas –
  varje felaktig utsaga ska kännas rimlig och lätt att hålla med om.
- Alla fyra utsagorna ska handla om SAMMA situation/begrepp så att de går att
  ställa mot varandra i en diskussion.
- Om någon kategori inte passar begreppet naturligt: skriv den mest närliggande
  trovärdiga elevtanken av det slaget i stället för att tvinga fram något konstlat.

Skriv dessutom fältet "oppenFraga": den femte, öppna bubblan som bjuder in den
läsande eleven att komma med en egen teori – riktad TILL eleven, t.ex. "Vad tror
du? Kan man tänka på något annat sätt?". Också den utan förstapersonsord. Den ska
vara på ${sprak}, i samma register som utsagorna.

Svara med ENDAST giltig JSON, utan kodstaket eller kommentarer, exakt i detta format:
{"utsagor":[{"kategori":"korrekt","text":"..."},{"kategori":"intuitiv","text":"..."},{"kategori":"overgeneralisering","text":"..."},{"kategori":"falsklogik","text":"..."}],"oppenFraga":"..."}`

  const anvandare = `Begrepp/fråga från läraren: "${begrepp}"
Årskurs: ${arskurs === 'F' ? 'förskoleklass' : arskurs}`

  return { system, anvandare }
}
