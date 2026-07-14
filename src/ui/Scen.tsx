import { useMemo, useRef, useState } from 'react'
import { passaText, passaTitel, type Textmatare } from '../domain/layout'
import { scenPlatser } from '../domain/scenlayout'
import { svansGeometri } from '../domain/svans'
import { figurUrl } from '../domain/figurer'
import type { Forskjutning, Scen as ScenModell } from '../domain/scen'
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
import { KATEGORI_ETIKETT } from '../domain/kategorier'

interface Props {
  scen: ScenModell
  mat: Textmatare
  visaKategorier: boolean
  vidTextandring: (bubbelIndex: number, text: string) => void
  vidFlytt: (bubbelIndex: number, forskjutning: Forskjutning) => void
}

interface Dragning {
  modellIndex: number
  startX: number
  startY: number
  start: Forskjutning
  aktuell: Forskjutning
  harFlyttat: boolean
}

/** Rörelse (i scenenheter) innan ett pekartryck räknas som drag och inte som klick. */
const DRAGTROSKEL = 8

/** Scenen renderas som SVG i logiska enheter (1600×900) – exakt samma layoutmatte som exporten. */
export function Scen({ scen, mat, visaKategorier, vidTextandring, vidFlytt }: Props) {
  const [redigeras, settRedigeras] = useState<number | null>(null)
  const [dragning, settDragning] = useState<Dragning | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const basStorlek = FONTSTORLEK_PER_STADIUM[scen.stadium]

  // Under pågående drag ritas scenen med den preliminära förskjutningen.
  const forhandsScen = useMemo(() => {
    if (!dragning) return scen
    return {
      ...scen,
      bubblor: scen.bubblor.map((b, i) =>
        i === dragning.modellIndex ? { ...b, forskjutning: dragning.aktuell } : b,
      ),
    }
  }, [scen, dragning])

  const { bubblor, platser } = useMemo(() => scenPlatser(forhandsScen), [forhandsScen])
  const titel = useMemo(() => passaTitel(scen.begrepp, mat), [scen.begrepp, mat])

  /** Skärmkoordinat → logisk scenkoordinat (scenen skalas responsivt). */
  function tillScenKoordinat(klientX: number, klientY: number): { x: number; y: number } {
    const svg = svgRef.current
    if (!svg) return { x: klientX, y: klientY }
    const ruta = svg.getBoundingClientRect()
    return {
      x: ((klientX - ruta.left) / ruta.width) * SCEN_BREDD,
      y: ((klientY - ruta.top) / ruta.height) * SCEN_HOJD,
    }
  }

  function borjaDrag(handelse: React.PointerEvent, modellIndex: number) {
    if (redigeras !== null) return
    const punkt = tillScenKoordinat(handelse.clientX, handelse.clientY)
    const start = scen.bubblor[modellIndex].forskjutning
    // Pekarfångst gör att draget följer med utanför figuren; saknas stödet
    // fungerar draget ändå så länge pekaren stannar inom gruppen.
    try {
      ;(handelse.currentTarget as Element).setPointerCapture?.(handelse.pointerId)
    } catch {
      /* ignorera – draget fungerar utan fångst */
    }
    settDragning({
      modellIndex,
      startX: punkt.x,
      startY: punkt.y,
      start,
      aktuell: start,
      harFlyttat: false,
    })
  }

  function underDrag(handelse: React.PointerEvent) {
    if (!dragning) return
    const punkt = tillScenKoordinat(handelse.clientX, handelse.clientY)
    const dx = punkt.x - dragning.startX
    const dy = punkt.y - dragning.startY
    const harFlyttat = dragning.harFlyttat || Math.hypot(dx, dy) > DRAGTROSKEL
    settDragning({
      ...dragning,
      harFlyttat,
      aktuell: { x: dragning.start.x + dx, y: dragning.start.y + dy },
    })
  }

  function avslutaDrag(handelse: React.PointerEvent, modellIndex: number) {
    if (!dragning) return
    try {
      ;(handelse.currentTarget as Element).releasePointerCapture?.(handelse.pointerId)
    } catch {
      /* fångst kan redan ha släppts */
    }
    if (dragning.harFlyttat) vidFlytt(modellIndex, dragning.aktuell)
    else settRedigeras(modellIndex) // Ett tryck utan rörelse = redigera texten.
    settDragning(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SCEN_BREDD} ${SCEN_HOJD}`}
      className="scen"
      role="img"
      aria-label={`Diskussionsunderlag: ${scen.begrepp}`}
    >
      {scen.bakgrundUrl ? (
        <image
          href={scen.bakgrundUrl}
          x={0}
          y={0}
          width={SCEN_BREDD}
          height={SCEN_HOJD}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <rect width={SCEN_BREDD} height={SCEN_HOJD} fill={PALETT.ljusgul} />
      )}

      {/* Rubrik: lärarens begrepp/fråga, alltid i sin helhet. */}
      <g pointerEvents="none">
        {scen.bakgrundUrl && (
          <rect
            x={titel.rekt.x - 24}
            y={titel.rekt.y - 12}
            width={titel.rekt.bredd + 48}
            height={titel.rekt.hojd + 24}
            rx={16}
            fill={PALETT.vit}
            opacity={0.88}
          />
        )}
        <text
          fontFamily={FONT_FAMILJ}
          fontSize={titel.fontstorlek}
          fontWeight={700}
          fill={PALETT.lila}
        >
          {titel.rader.map((rad, r) => (
            <tspan
              key={r}
              x={SCEN_BREDD / 2}
              y={titel.forstaBaslinje + r * titel.radhojd}
              textAnchor="middle"
            >
              {rad}
            </tspan>
          ))}
        </text>
      </g>

      {platser.map((plats, i) => {
        const bubbla = bubblor[i]
        // Bubblans index i den fulla listan (kan skilja när ?-bubblan är dold).
        const modellIndex = forhandsScen.bubblor.indexOf(bubbla)
        const svans = svansGeometri(plats.bubbla, plats.svansMal)
        const inreBredd = plats.bubbla.bredd - 2 * BUBBLA_PADDING
        const inreHojd = plats.bubbla.hojd - 2 * BUBBLA_PADDING
        const passad = passaText(bubbla.text || ' ', inreBredd, inreHojd, basStorlek, mat)
        const textStartY =
          plats.bubbla.y +
          BUBBLA_PADDING +
          (inreHojd - passad.rader.length * passad.radhojd) / 2 +
          passad.fontstorlek * 0.85
        const dras = dragning?.modellIndex === modellIndex && dragning.harFlyttat

        return (
          <g
            key={bubbla.kategori}
            className={`bubbelgrupp${dras ? ' dras' : ''}`}
            onPointerDown={(h) => borjaDrag(h, modellIndex)}
            onPointerMove={underDrag}
            onPointerUp={(h) => avslutaDrag(h, modellIndex)}
            onPointerCancel={() => settDragning(null)}
          >
            <image
              href={figurUrl(bubbla.figur.fil)}
              x={plats.figur.x}
              y={plats.figur.y}
              width={plats.figur.bredd}
              height={plats.figur.hojd}
            />

            <polygon
              points={`${svans.basVanster.x},${svans.basVanster.y} ${svans.spets.x},${svans.spets.y} ${svans.basHoger.x},${svans.basHoger.y}`}
              fill={bubbla.fill}
              stroke={PALETT.lila}
              strokeWidth={BUBBLA_KANTBREDD}
              strokeLinejoin="round"
            />
            <rect
              x={plats.bubbla.x}
              y={plats.bubbla.y}
              width={plats.bubbla.bredd}
              height={plats.bubbla.hojd}
              rx={BUBBLA_RADIE}
              fill={bubbla.fill}
              stroke={PALETT.lila}
              strokeWidth={BUBBLA_KANTBREDD}
            />
            {/* Döljer bubbelkantens linje där svansen ansluter. */}
            <polygon
              points={`${svans.basVanster.x + 3},${svans.basVanster.y - 3} ${svans.basVanster.x + 3},${svans.basVanster.y + 3} ${svans.basHoger.x - 3},${svans.basHoger.y + 3} ${svans.basHoger.x - 3},${svans.basHoger.y - 3}`}
              fill={bubbla.fill}
            />

            {redigeras === modellIndex ? (
              <foreignObject
                x={plats.bubbla.x + 8}
                y={plats.bubbla.y + 8}
                width={plats.bubbla.bredd - 16}
                height={plats.bubbla.hojd - 16}
              >
                <textarea
                  className="bubbelredigerare"
                  defaultValue={bubbla.text}
                  autoFocus
                  onPointerDown={(h) => h.stopPropagation()}
                  onFocus={(h) => h.currentTarget.select()}
                  onBlur={(h) => {
                    vidTextandring(modellIndex, h.currentTarget.value.trim())
                    settRedigeras(null)
                  }}
                  onKeyDown={(h) => {
                    if (h.key === 'Escape') settRedigeras(null)
                    if (h.key === 'Enter' && !h.shiftKey) {
                      h.preventDefault()
                      h.currentTarget.blur()
                    }
                  }}
                />
              </foreignObject>
            ) : (
              <text
                fontFamily={FONT_FAMILJ}
                fontSize={passad.fontstorlek}
                fontWeight={600}
                fill={PALETT.gron}
                pointerEvents="none"
              >
                {passad.rader.map((rad, r) => (
                  <tspan
                    key={r}
                    x={plats.bubbla.x + plats.bubbla.bredd / 2}
                    y={textStartY + r * passad.radhojd}
                    textAnchor="middle"
                  >
                    {rad || ' '}
                  </tspan>
                ))}
              </text>
            )}

            {visaKategorier && (
              <g pointerEvents="none">
                <rect
                  x={plats.bubbla.x}
                  y={plats.bubbla.y - 26}
                  width={KATEGORI_ETIKETT[bubbla.kategori].length * 10.5 + 20}
                  height={24}
                  rx={12}
                  fill={PALETT.lila}
                />
                <text
                  x={plats.bubbla.x + 10}
                  y={plats.bubbla.y - 9}
                  fontFamily={FONT_FAMILJ}
                  fontSize={14}
                  fontWeight={600}
                  fill={PALETT.vit}
                >
                  {KATEGORI_ETIKETT[bubbla.kategori]}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
