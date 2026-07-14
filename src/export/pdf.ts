import { jsPDF } from 'jspdf'
import type { Scen } from '../domain/scen'
import { arskursEtikett } from '../domain/arskurs'
import {
  FONT_FAMILJ,
  PALETT,
  PDF_BREDD_PX,
  PDF_HOJD_PX,
  SCEN_BREDD,
  SCEN_HOJD,
} from '../domain/konstanter'
import type { Textmatare } from '../domain/layout'
import { ritaScen } from './canvasrit'

const MARGINAL = 100
/** Utrymme överst för kolofonraden; själva rubriken bor i scenen. */
const TOPPYTA = 150

/** Komponerar hela utskriftssidan (A4 liggande, 300 DPI) på en canvas. */
export async function komponeraExportCanvas(scen: Scen, mat: Textmatare): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = PDF_BREDD_PX
  canvas.height = PDF_HOJD_PX
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = PALETT.vit
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = PALETT.lila
  ctx.font = `700 40px ${FONT_FAMILJ}`
  ctx.fillText(`DISKUSSIONSUNDERLAG · ${arskursEtikett(scen.arskurs)}`, MARGINAL, 100)

  // Scenen bär rubriken (lärarens begrepp/fråga) i sin helhet.
  const scenBredd = canvas.width - 2 * MARGINAL
  const skala = scenBredd / SCEN_BREDD
  ctx.save()
  ctx.translate(MARGINAL, TOPPYTA)
  ctx.scale(skala, skala)
  await ritaScen(ctx, scen, mat)
  ctx.restore()

  ctx.fillStyle = PALETT.gron
  ctx.font = `400 36px ${FONT_FAMILJ}`
  ctx.fillText(
    'Skapad med Diskussionsunderlag · Barn- och skolförvaltningen, Lunds kommun',
    MARGINAL,
    TOPPYTA + SCEN_HOJD * skala + 90,
  )

  return canvas
}

export async function exporteraPdf(scen: Scen, mat: Textmatare): Promise<void> {
  const canvas = await komponeraExportCanvas(scen, mat)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210)
  pdf.save(`${filnamn(scen.begrepp)}.pdf`)
}

export async function exporteraPng(scen: Scen, mat: Textmatare): Promise<void> {
  const canvas = await komponeraExportCanvas(scen, mat)
  const blob = await new Promise<Blob>((losa) => canvas.toBlob((b) => losa(b!), 'image/png'))
  laddaNer(blob, `${filnamn(scen.begrepp)}.png`)
}

export function laddaNer(blob: Blob, namn: string): void {
  const url = URL.createObjectURL(blob)
  const lank = document.createElement('a')
  lank.href = url
  lank.download = namn
  lank.click()
  URL.revokeObjectURL(url)
}

export function filnamn(begrepp: string): string {
  const slug = begrepp
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `diskussionsunderlag-${slug || 'utan-titel'}`
}

