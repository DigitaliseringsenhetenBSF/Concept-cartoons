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

/** Utsagorna talar OM ämnet i tredje person – aldrig som ämnet (se domain/rost.ts). */
export function exempelUtsagor(_begrepp: string): Utsaga[] {
  return [
    {
      kategori: 'korrekt',
      text: 'Det finns en förklaring som går att undersöka – man kan pröva den.',
    },
    {
      kategori: 'intuitiv',
      text: 'Det syns ju direkt hur det är, så det behöver man inte undersöka.',
    },
    {
      kategori: 'overgeneralisering',
      text: 'Regeln som gäller i liknande fall måste gälla här också, alltid.',
    },
    {
      kategori: 'falsklogik',
      text: 'Det ena skapar det andra – det måste vara därför det blir så.',
    },
  ]
}
