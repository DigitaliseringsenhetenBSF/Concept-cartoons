import type { Utsaga } from '../domain/scen'
import type { GenereraParametrar, Genererat, UtsageGenerator } from './typer'

/**
 * Exempelgenerator – används i tester, i smoke-flödet och som demonstrationsläge
 * när AI-servern inte är tillgänglig. Verktyget ska vara fullt användbart utan AI.
 */
export class ExempelGenerator implements UtsageGenerator {
  async generera({ begrepp }: GenereraParametrar): Promise<Genererat> {
    return { utsagor: exempelUtsagor(begrepp) }
  }
}

export function exempelUtsagor(begrepp: string): Utsaga[] {
  const amne = begrepp.replace(/[?!.]+$/, '')
  return [
    { kategori: 'korrekt', text: `Jag tror det finns en förklaring till ${sank(amne)} som vi kan undersöka.` },
    { kategori: 'intuitiv', text: `Det syns ju direkt hur det är – det behöver man inte undersöka.` },
    { kategori: 'overgeneralisering', text: `Vi lärde oss en regel för sånt här förut, så den gäller säkert här också.` },
    { kategori: 'falsklogik', text: `Det händer nog för att det ena skapar det andra – det måste vara så.` },
  ]
}

function sank(text: string): string {
  return text.length > 60 ? 'det här' : text.charAt(0).toLowerCase() + text.slice(1)
}
