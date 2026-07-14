export const ARSKURSER = ['F', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
export type Arskurs = (typeof ARSKURSER)[number]

export type Stadium = 'lag' | 'mellan' | 'hog'

export const STADIUM_ETIKETT: Record<Stadium, string> = {
  lag: 'lågstadiet (F–3)',
  mellan: 'mellanstadiet (4–6)',
  hog: 'högstadiet (7–9)',
}

export function arskursTillStadium(arskurs: Arskurs): Stadium {
  if (arskurs === 'F' || arskurs === '1' || arskurs === '2' || arskurs === '3') return 'lag'
  if (arskurs === '4' || arskurs === '5' || arskurs === '6') return 'mellan'
  return 'hog'
}

export function arskursEtikett(arskurs: Arskurs): string {
  return arskurs === 'F' ? 'Förskoleklass' : `Årskurs ${arskurs}`
}
