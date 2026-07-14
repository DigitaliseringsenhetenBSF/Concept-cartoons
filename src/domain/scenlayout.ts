import { beraknaLayout, forskjutPlats, type PlatsLayout } from './layout'
import { synligaBubblor, type Pratbubbla, type Scen } from './scen'

/**
 * Enda källan för "var hamnar figurerna och bubblorna" – används av editorn
 * (SVG), PDF/PNG-exporten (canvas) och PPTX-exporten. Garanterar att det
 * läraren ser är exakt det som exporteras, även efter drag-och-släpp.
 */
export function scenPlatser(scen: Scen): { bubblor: Pratbubbla[]; platser: PlatsLayout[] } {
  const bubblor = synligaBubblor(scen)
  const platser = beraknaLayout(bubblor.map((b) => b.figur)).map((plats, i) =>
    forskjutPlats(plats, bubblor[i].forskjutning),
  )
  return { bubblor, platser }
}
