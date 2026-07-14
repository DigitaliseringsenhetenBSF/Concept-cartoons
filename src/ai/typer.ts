import type { Arskurs } from '../domain/arskurs'
import type { Utsaga } from '../domain/scen'

export interface GenereraParametrar {
  begrepp: string
  arskurs: Arskurs
  sprak: string
}

export interface Genererat {
  utsagor: Utsaga[]
  /** Den öppna "?"-bubblan på valt språk. Saknas den används svensk standardtext. */
  oppenFraga?: string
}

/** AI:n är alltid isolerad bakom detta gränssnitt – UI:t vet inte vem som genererar. */
export interface UtsageGenerator {
  generera(parametrar: GenereraParametrar): Promise<Genererat>
}
