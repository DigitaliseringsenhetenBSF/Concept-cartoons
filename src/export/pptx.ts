import PptxGenJS from 'pptxgenjs'
import { arskursEtikett } from '../domain/arskurs'
import { scenPlatser } from '../domain/scenlayout'
import { svansGeometri } from '../domain/svans'
import type { Scen } from '../domain/scen'
import {
  BUBBLA_KANTBREDD,
  FONTSTORLEK_PER_STADIUM,
  PALETT,
  PPTX_BREDD_TUM,
  PPTX_HOJD_TUM,
  PPTX_TITELHOJD_TUM,
  SCEN_BREDD,
  SCEN_HOJD,
} from '../domain/konstanter'

/** Bilddata som exporten behöver: figurfil → data-URL, samt ev. bakgrund. */
export interface PptxBilder {
  figurer: Record<string, string>
  bakgrund?: string
}

/**
 * Bygger en .pptx där bakgrund, varje figur och varje pratbubbla är SEPARATA,
 * redigerbara PowerPoint-objekt (krav i briefen – ingen tillplattad skärmdump).
 */
export function byggPptx(scen: Scen, bilder: PptxBilder): PptxGenJS {
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'BRED', width: PPTX_BREDD_TUM, height: PPTX_HOJD_TUM })
  pptx.layout = 'BRED'
  pptx.title = `Diskussionsunderlag: ${scen.begrepp}`

  const slide = pptx.addSlide()
  slide.background = { color: PALETT.ljusgul.replace('#', '') }

  if (bilder.bakgrund) {
    slide.addImage({
      data: bilder.bakgrund,
      x: 0,
      y: 0,
      w: PPTX_BREDD_TUM,
      h: PPTX_HOJD_TUM,
      sizing: { type: 'cover', w: PPTX_BREDD_TUM, h: PPTX_HOJD_TUM },
    })
  }

  // Logiska scenenheter → tum. Titelraden får en egen remsa överst.
  const skala = (PPTX_HOJD_TUM - PPTX_TITELHOJD_TUM) / SCEN_HOJD
  const offsetX = (PPTX_BREDD_TUM - SCEN_BREDD * skala) / 2
  const tum = (v: number) => v * skala
  const punkter = (px: number) => Math.round(px * skala * 72)

  slide.addText(`${scen.begrepp}  ·  ${arskursEtikett(scen.arskurs)}`, {
    x: 0.25,
    y: 0.05,
    w: PPTX_BREDD_TUM - 0.5,
    h: PPTX_TITELHOJD_TUM - 0.1,
    fontFace: 'Calibri',
    fontSize: 16,
    bold: true,
    color: PALETT.lila.replace('#', ''),
  })

  const { bubblor, platser } = scenPlatser(scen)
  const basStorlek = FONTSTORLEK_PER_STADIUM[scen.stadium]

  platser.forEach((plats, i) => {
    const data = bilder.figurer[bubblor[i].figur.fil]
    if (!data) throw new Error(`Bilddata saknas för figur ${bubblor[i].figur.fil}`)
    slide.addImage({
      data,
      x: offsetX + tum(plats.figur.x),
      y: PPTX_TITELHOJD_TUM + tum(plats.figur.y),
      w: tum(plats.figur.bredd),
      h: tum(plats.figur.hojd),
    })
  })

  platser.forEach((plats, i) => {
    const bubbla = bubblor[i]
    const svans = svansGeometri(plats.bubbla, plats.svansMal)
    const linje = {
      color: PALETT.lila.replace('#', ''),
      width: BUBBLA_KANTBREDD * skala * 72,
    }

    // Svans först, bubblan ovanpå → sömlös ansättning även i PowerPoint.
    const svansBredd = svans.basHoger.x - svans.basVanster.x
    slide.addShape('triangle', {
      x: offsetX + tum(svans.basVanster.x),
      y: PPTX_TITELHOJD_TUM + tum(svans.basVanster.y),
      w: tum(svansBredd),
      h: tum(svans.spets.y - svans.basVanster.y),
      fill: { color: bubbla.fill.replace('#', '') },
      line: linje,
      flipV: true,
    })

    slide.addText(bubbla.text, {
      shape: 'roundRect',
      rectRadius: 0.12,
      x: offsetX + tum(plats.bubbla.x),
      y: PPTX_TITELHOJD_TUM + tum(plats.bubbla.y),
      w: tum(plats.bubbla.bredd),
      h: tum(plats.bubbla.hojd),
      fill: { color: bubbla.fill.replace('#', '') },
      line: linje,
      fontFace: 'Calibri',
      fontSize: Math.max(punkter(basStorlek) - 2, 10),
      color: PALETT.gron.replace('#', ''),
      align: 'center',
      valign: 'middle',
      autoFit: true,
    })
  })

  return pptx
}

export async function exporteraPptxBlob(scen: Scen, bilder: PptxBilder): Promise<Blob> {
  const pptx = byggPptx(scen, bilder)
  return (await pptx.write({ outputType: 'blob' })) as Blob
}
