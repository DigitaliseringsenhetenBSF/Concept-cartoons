/**
 * De fem kategorierna i Concept Cartoons-metoden, enligt produktägarens
 * taxonomi (2026-07-14) baserad på analys av Skolverkets material.
 * Fyra genereras av AI; "?"-bubblan är fast (SPEC §3).
 */
export const AI_KATEGORIER = ['korrekt', 'intuitiv', 'overgeneralisering', 'falsklogik'] as const
export type AiKategori = (typeof AI_KATEGORIER)[number]

export type Kategori = AiKategori | 'vetinte'
export const ALLA_KATEGORIER: readonly Kategori[] = [...AI_KATEGORIER, 'vetinte']

export const KATEGORI_ETIKETT: Record<Kategori, string> = {
  korrekt: 'Korrekt',
  intuitiv: 'Intuitiv missuppfattning',
  overgeneralisering: 'Övergeneralisering',
  falsklogik: 'Falsk logik',
  vetinte: 'Öppen fråga / ?',
}

export const KATEGORI_BESKRIVNING: Record<Kategori, string> = {
  korrekt:
    'Den vetenskapligt korrekta förklaringen, uttryckt på enkelt vardagsspråk utan att förlora stringens',
  intuitiv:
    'Det som känns logiskt vid första anblick men är fel – ofta hopblandade vardagsbegrepp eller förhastade slutsatser',
  overgeneralisering:
    'En inlärd regel som tillämpas där den inte gäller, eller med bortglömda mellansteg',
  falsklogik:
    'En logisk tankekedja med felaktig utgångspunkt – en egen (ofta bakvänd) förklaringsmodell',
  vetinte: 'Öppen fråga eller tom bubbla som bjuder in eleven med egna teorier',
}

/**
 * Lärarstöd: hur man känner igen kategorin och varför den ser ut som den gör.
 * Visas i förklaringspanelen bredvid den genererade texten, så att läraren kan
 * se *varför* en utsaga är t.ex. en övergeneralisering och inte en intuitiv
 * missuppfattning.
 */
export interface KategoriStod {
  /** Vad kategorin är – i en mening. */
  kort: string
  /** Igenkänningstecken att leta efter i den konkreta texten. */
  kannetecken: string[]
  /** Kort exempel av samma slag som Skolverkets material (parafraserat). */
  exempel: string
  /** Vad kategorin gör i klassrumssamtalet. */
  iSamtalet: string
}

export const KATEGORI_STOD: Record<Kategori, KategoriStod> = {
  korrekt: {
    kort: 'Det vetenskapligt korrekta svaret, sagt som ett barn skulle säga det.',
    kannetecken: [
      'Stämmer med gällande ämnesprinciper – även om språket är vardagligt.',
      'Nämner rätt mekanism, inte bara rätt slutsats.',
    ],
    exempel: '"Vattnet avdunstar vid alla temperaturer."',
    iSamtalet:
      'Fungerar som facit att pröva de andra utsagorna mot – men avslöja den inte i förväg. Låt eleverna själva argumentera för vilken som håller.',
  },
  intuitiv: {
    kort: 'Det som känns logiskt vid första anblick, men är fel.',
    kannetecken: [
      'Bygger på det man direkt ser eller känner ("stål är tungt, alltså sjunker det").',
      'Blandar ihop vardagsbegrepp: vikt/volym, värme/temperatur, stor/tung.',
      'Drar en förhastad slutsats utan mellansteg.',
    ],
    exempel: '"Jag kan se 64 kvadrater" – eleven räknar bara de minsta rutorna på schackbrädet.',
    iSamtalet:
      'Den mest igenkännbara felutsagan – många elever håller tyst med om den. Fråga vad man skulle behöva undersöka för att avgöra om den stämmer.',
  },
  overgeneralisering: {
    kort: 'En inlärd regel används där den inte gäller (regelföljande fel).',
    kannetecken: [
      'Eleven kan en regel – men tillämpar den utanför dess giltighetsområde.',
      'Ord som "alltid", "alla", "precis som med …" signalerar den.',
      'Nödvändiga mellansteg hoppas över.',
    ],
    exempel: '"1/2 + 1/4 = 2/8" – täljare för sig och nämnare för sig, som vid vanlig addition.',
    iSamtalet:
      'Bra ingång till frågan "när gäller regeln – och när gäller den inte?". Låt eleverna leta efter ett motexempel.',
  },
  falsklogik: {
    kort: 'Ett missuppfattat orsakssamband – rimlig tankekedja, felaktig mekanism.',
    kannetecken: [
      'Resonemanget hänger ihop, men utgångspunkten eller mekanismen är uppfunnen.',
      'Ofta bakvänd orsak-verkan ("jackan värmer" i stället för "jackan isolerar").',
      'Förklarar *varför* något sker – med en egen modell.',
    ],
    exempel: '"Sätt inte jackan på snögubben, då smälter den" – som om jackan skapade värme.',
    iSamtalet:
      'Skilj på slutsats och mekanism: kan slutsatsen vara rimlig fast förklaringen är fel? Utmärkt för att träna orsak och verkan.',
  },
  vetinte: {
    kort: 'Den öppna bubblan som bjuder in eleven med en egen teori.',
    kannetecken: [
      'Innehåller ingen påstådd förklaring – bara en öppning.',
      'Signalerar att det finns fler sätt att tänka än de som redan står i bilden.',
    ],
    exempel: '"Vad tror du? Kan man tänka på något annat sätt?"',
    iSamtalet:
      'Sänker tröskeln för elever som inte känner igen sig i någon av de andra bubblorna. Börja gärna samtalet här.',
  },
}
