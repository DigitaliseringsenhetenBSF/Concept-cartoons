import type { Utsaga } from '../domain/scen'
import type { GenereraParametrar, UtsageGenerator } from './typer'

/**
 * Exempelgenerator – används i tester, i smoke-flödet och som demonstrationsläge
 * när AI-servern inte är tillgänglig. Verktyget ska vara fullt användbart utan AI.
 */
export class ExempelGenerator implements UtsageGenerator {
  async generera({ begrepp }: GenereraParametrar): Promise<Utsaga[]> {
    return exempelUtsagor(begrepp)
  }
}

export function exempelUtsagor(begrepp: string): Utsaga[] {
  const amne = begrepp.replace(/[?!.]+$/, '')
  return [
    { kategori: 'korrekt', text: `Jag tror det finns en förklaring till ${sank(amne)} som vi kan undersöka.` },
    { kategori: 'fel', text: `Det är nog bara magi – ${sank(amne)} går inte att förklara.` },
    { kategori: 'igangsattande', text: `Hur skulle vi kunna ta reda på det? Kan vi testa själva?` },
    { kategori: 'fakta', text: `Jag har läst att forskare har undersökt det här länge.` },
  ]
}

function sank(text: string): string {
  return text.length > 60 ? 'det här' : text.charAt(0).toLowerCase() + text.slice(1)
}
