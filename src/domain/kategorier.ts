/** De fem kategorierna i Concept Cartoons-metoden (Skolverkets anpassning). */
export const AI_KATEGORIER = ['korrekt', 'fel', 'igangsattande', 'fakta'] as const
export type AiKategori = (typeof AI_KATEGORIER)[number]

export type Kategori = AiKategori | 'vetinte'
export const ALLA_KATEGORIER: readonly Kategori[] = [...AI_KATEGORIER, 'vetinte']

export const KATEGORI_ETIKETT: Record<Kategori, string> = {
  korrekt: 'Korrekt',
  fel: 'Missuppfattning',
  igangsattande: 'Igångsättande',
  fakta: 'Fakta',
  vetinte: 'Vet inte / ?',
}

export const KATEGORI_BESKRIVNING: Record<Kategori, string> = {
  korrekt: 'Vetenskapligt/ämnesmässigt korrekt utsaga',
  fel: 'Plausibel, vanlig missuppfattning – aldrig hånfull',
  igangsattande: 'Tankeväckande, öppen resonemangsstartare',
  fakta: 'Relaterad faktautsaga',
  vetinte: 'Öppnar för andra sätt att tänka (fast "?"-bubbla)',
}
