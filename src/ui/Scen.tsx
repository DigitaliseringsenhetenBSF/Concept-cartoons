import { useMemo, useState } from 'react'
import { beraknaLayout, passaText, type Textmatare } from '../domain/layout'
import { svansGeometri } from '../domain/svans'
import { figurUrl } from '../domain/figurer'
import { synligaBubblor, type Scen as ScenModell } from '../domain/scen'
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
}

/** Scenen renderas som SVG i logiska enheter (1600×900) – exakt samma layoutmatte som exporten. */
export function Scen({ scen, mat, visaKategorier, vidTextandring }: Props) {
  const [redigeras, settRedigeras] = useState<number | null>(null)
  const bubblor = synligaBubblor(scen)
  const platser = useMemo(() => beraknaLayout(bubblor.map((b) => b.figur)), [bubblor])
  const basStorlek = FONTSTORLEK_PER_STADIUM[scen.stadium]

  return (
    <svg
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

      {platser.map((plats, i) => (
        <image
          key={bubblor[i].figur.fil}
          href={figurUrl(bubblor[i].figur.fil)}
          x={plats.figur.x}
          y={plats.figur.y}
          width={plats.figur.bredd}
          height={plats.figur.hojd}
        />
      ))}

      {platser.map((plats, i) => {
        const bubbla = bubblor[i]
        // Bubblans index i den fulla listan (kan skilja när ?-bubblan är dold).
        const modellIndex = scen.bubblor.indexOf(bubbla)
        const svans = svansGeometri(plats.bubbla, plats.svansMal)
        const inre = {
          bredd: plats.bubbla.bredd - 2 * BUBBLA_PADDING,
          hojd: plats.bubbla.hojd - 2 * BUBBLA_PADDING,
        }
        const passad = passaText(bubbla.text || ' ', inre.bredd, inre.hojd, basStorlek, mat)
        const textStartY =
          plats.bubbla.y +
          BUBBLA_PADDING +
          (inre.hojd - passad.rader.length * passad.radhojd) / 2 +
          passad.fontstorlek * 0.85

        return (
          <g key={bubbla.kategori} className="bubbelgrupp">
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
                style={{ cursor: 'text' }}
                onClick={() => settRedigeras(modellIndex)}
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
