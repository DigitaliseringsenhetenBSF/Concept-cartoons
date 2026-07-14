import { passaText, type Textmatare } from '../domain/layout'
import { scenPlatser } from '../domain/scenlayout'
import { svansGeometri } from '../domain/svans'
import { figurUrl } from '../domain/figurer'
import type { Scen } from '../domain/scen'
import {
  BUBBLA_KANTBREDD,
  BUBBLA_PADDING,
  BUBBLA_RADIE,
  FONTSTORLEK_PER_STADIUM,
  FONT_FAMILJ,
  PALETT,
  SCEN_BREDD,
  SCEN_HOJD,
} from '../domain/konstanter'
import { laddaBild } from './bild'

/**
 * Ritar scenen deterministiskt på en canvas-kontext i LOGISKA enheter
 * (anroparen sätter transform/skala). Samma layoutmatte som SVG-editorn.
 */
export async function ritaScen(ctx: CanvasRenderingContext2D, scen: Scen, mat: Textmatare) {
  const { bubblor, platser } = scenPlatser(scen)
  const basStorlek = FONTSTORLEK_PER_STADIUM[scen.stadium]

  // Bakgrund (rundad yta): uppladdad bild beskärs till "cover", annars ljusgul.
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, 0, SCEN_BREDD, SCEN_HOJD, 24)
  ctx.clip()
  if (scen.bakgrundUrl) {
    const bakgrund = await laddaBild(scen.bakgrundUrl)
    const skala = Math.max(SCEN_BREDD / bakgrund.naturalWidth, SCEN_HOJD / bakgrund.naturalHeight)
    const b = bakgrund.naturalWidth * skala
    const h = bakgrund.naturalHeight * skala
    ctx.drawImage(bakgrund, (SCEN_BREDD - b) / 2, (SCEN_HOJD - h) / 2, b, h)
  } else {
    ctx.fillStyle = PALETT.ljusgul
    ctx.fillRect(0, 0, SCEN_BREDD, SCEN_HOJD)
  }
  ctx.restore()

  const figurBilder = await Promise.all(
    bubblor.map((bubbla) => laddaBild(figurUrl(bubbla.figur.fil))),
  )
  platser.forEach((plats, i) => {
    ctx.drawImage(figurBilder[i], plats.figur.x, plats.figur.y, plats.figur.bredd, plats.figur.hojd)
  })

  platser.forEach((plats, i) => {
    const bubbla = bubblor[i]
    const svans = svansGeometri(plats.bubbla, plats.svansMal)

    ctx.lineJoin = 'round'
    ctx.lineWidth = BUBBLA_KANTBREDD
    ctx.strokeStyle = PALETT.lila
    ctx.fillStyle = bubbla.fill

    ctx.beginPath()
    ctx.moveTo(svans.basVanster.x, svans.basVanster.y)
    ctx.lineTo(svans.spets.x, svans.spets.y)
    ctx.lineTo(svans.basHoger.x, svans.basHoger.y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.roundRect(plats.bubbla.x, plats.bubbla.y, plats.bubbla.bredd, plats.bubbla.hojd, BUBBLA_RADIE)
    ctx.fill()
    ctx.stroke()

    // Öppna upp kanten där svansen ansluter.
    ctx.fillRect(
      svans.basVanster.x + 3,
      svans.basVanster.y - 3,
      svans.basHoger.x - svans.basVanster.x - 6,
      6,
    )

    const inreBredd = plats.bubbla.bredd - 2 * BUBBLA_PADDING
    const inreHojd = plats.bubbla.hojd - 2 * BUBBLA_PADDING
    const passad = passaText(bubbla.text || ' ', inreBredd, inreHojd, basStorlek, mat)
    ctx.font = `600 ${passad.fontstorlek}px ${FONT_FAMILJ}`
    ctx.fillStyle = PALETT.gron
    ctx.textAlign = 'center'
    const startY =
      plats.bubbla.y +
      BUBBLA_PADDING +
      (inreHojd - passad.rader.length * passad.radhojd) / 2 +
      passad.fontstorlek * 0.85
    passad.rader.forEach((rad, r) => {
      ctx.fillText(rad, plats.bubbla.x + plats.bubbla.bredd / 2, startY + r * passad.radhojd)
    })
    ctx.textAlign = 'start'
  })
}
