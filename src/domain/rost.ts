/**
 * Utsagorna ska handla OM det som diskuteras, i tredje person ("Katterna skriker
 * för att …"), aldrig i förstapersonsröst ("Jag skriker …"). Annars låter barnen
 * som om de VORE fenomenet, vilket bryter metoden: eleven ska ta ställning till
 * ett påstående om verkligheten, inte till en figur som spelar roll.
 *
 * Kontrolleras automatiskt för de språk vi har ordlistor för; andra språk
 * förlitar sig på promptregeln.
 */
const FORSTAPERSONSORD: Record<string, string[]> = {
  svenska: ['jag', 'mig', 'min', 'mitt', 'mina', 'vi', 'oss', 'vår', 'vårt', 'våra'],
  engelska: ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours'],
}

/** Returnerar de förstapersonsord som förekommer i texten (tomt om språket saknar ordlista). */
export function forstapersonsord(text: string, sprak: string): string[] {
  const ordlista = FORSTAPERSONSORD[sprak.trim().toLowerCase()]
  if (!ordlista) return []

  const ord = text
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean)
  return ordlista.filter((forbjudet) => ord.includes(forbjudet))
}

export function harForstapersonsrost(text: string, sprak: string): boolean {
  return forstapersonsord(text, sprak).length > 0
}
