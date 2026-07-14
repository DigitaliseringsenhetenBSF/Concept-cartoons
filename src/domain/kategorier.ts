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
