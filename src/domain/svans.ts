import type { Rekt } from './layout'

export interface SvansGeometri {
  basVanster: { x: number; y: number }
  basHoger: { x: number; y: number }
  spets: { x: number; y: number }
}

const SVANS_HALVBREDD = 20
const BAS_INDRAG = 44

/**
 * Svansen utgår från bubblans underkant och pekar mot figurens huvud.
 * Basen kläms in så att den aldrig hamnar i bubblans rundade hörn.
 */
export function svansGeometri(bubbla: Rekt, mal: { x: number; y: number }): SvansGeometri {
  const botten = bubbla.y + bubbla.hojd
  const basX = Math.min(
    Math.max(mal.x, bubbla.x + BAS_INDRAG),
    bubbla.x + bubbla.bredd - BAS_INDRAG,
  )
  return {
    basVanster: { x: basX - SVANS_HALVBREDD, y: botten - 2 },
    basHoger: { x: basX + SVANS_HALVBREDD, y: botten - 2 },
    spets: { x: mal.x, y: Math.max(mal.y, botten + 24) },
  }
}
