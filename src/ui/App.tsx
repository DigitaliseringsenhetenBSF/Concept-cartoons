import { useEffect, useMemo, useRef, useState } from 'react'
import { ARSKURSER, arskursEtikett, arskursTillStadium, type Arskurs } from '../domain/arskurs'
import { figurerForStadium, tolkaManifest, figurUrl, type Figur } from '../domain/figurer'
import { MAX_BAKGRUND_BYTES, TILLATNA_BILDTYPER } from '../domain/konstanter'
import {
  flyttaBubbla,
  skapaScen,
  uppdateraBubbeltext,
  type Forskjutning,
  type Scen as ScenModell,
  type Utsaga,
} from '../domain/scen'
import { slumpFro } from '../domain/slump'
import { ExempelGenerator } from '../ai/mock'
import { AiFel, ServerGenerator } from '../ai/klient'
import type { UtsageGenerator } from '../ai/typer'
import { skapaTextmatare } from '../export/matning'
import { exporteraPdf, exporteraPng, laddaNer, filnamn } from '../export/pdf'
import { bildTillDataUrl } from '../export/bild'
import { Scen } from './Scen'
import { Forklaring } from './Forklaring'

const SPRAK = ['svenska', 'engelska', 'arabiska', 'somaliska', 'ukrainska', 'annat'] as const

const TOMMA_UTSAGOR: Utsaga[] = [
  { kategori: 'korrekt', text: '' },
  { kategori: 'intuitiv', text: '' },
  { kategori: 'overgeneralisering', text: '' },
  { kategori: 'falsklogik', text: '' },
]

export function App() {
  const [figurer, settFigurer] = useState<Figur[] | null>(null)
  const [manifestFel, settManifestFel] = useState<string | null>(null)

  const [begrepp, settBegrepp] = useState('')
  const [arskurs, settArskurs] = useState<Arskurs>('4')
  const [sprakVal, settSprakVal] = useState<(typeof SPRAK)[number]>('svenska')
  const [annatSprak, settAnnatSprak] = useState('')
  const [bakgrundUrl, settBakgrundUrl] = useState<string | undefined>()

  const [scen, settScen] = useState<ScenModell | null>(null)
  const [laddar, settLaddar] = useState(false)
  const [fel, settFel] = useState<string | null>(null)
  const [visaKategorier, settVisaKategorier] = useState(true)
  const [visaForklaring, settVisaForklaring] = useState(false)
  const [exporterar, settExporterar] = useState(false)

  const filRef = useRef<HTMLInputElement>(null)
  const mat = useMemo(() => skapaTextmatare(), [])
  const sprak = sprakVal === 'annat' ? annatSprak.trim() || 'svenska' : sprakVal

  useEffect(() => {
    fetch('/figurer/manifest.json')
      .then((svar) => svar.json())
      .then((data) => settFigurer(tolkaManifest(data)))
      .catch(() => settManifestFel('Kunde inte läsa figurbiblioteket (figurer/manifest.json).'))
  }, [])

  function byggScen(utsagor: Utsaga[], oppenFraga?: string): ScenModell {
    return skapaScen({
      begrepp: begrepp.trim(),
      arskurs,
      sprak,
      utsagor,
      oppenFraga,
      figurer: figurerForStadium(figurer ?? [], arskursTillStadium(arskurs)),
      fro: slumpFro(),
      bakgrundUrl,
    })
  }

  async function generera(generator: UtsageGenerator) {
    if (begrepp.trim().length < 2) {
      settFel('Skriv först ett begrepp eller en fråga.')
      return
    }
    settLaddar(true)
    settFel(null)
    try {
      const svar = await generator.generera({ begrepp: begrepp.trim(), arskurs, sprak })
      settScen(byggScen(svar.utsagor, svar.oppenFraga))
    } catch (f) {
      settFel(f instanceof AiFel ? f.message : 'Något gick fel vid genereringen.')
    } finally {
      settLaddar(false)
    }
  }

  function skapaTom() {
    if (begrepp.trim().length < 2) {
      settFel('Skriv först ett begrepp eller en fråga.')
      return
    }
    settFel(null)
    settScen(byggScen(TOMMA_UTSAGOR))
  }

  function valjBakgrund(fil: File | undefined) {
    settFel(null)
    if (!fil) return
    if (!(TILLATNA_BILDTYPER as readonly string[]).includes(fil.type)) {
      settFel('Endast PNG-, JPEG- eller WebP-bilder kan användas som bakgrund.')
      return
    }
    if (fil.size > MAX_BAKGRUND_BYTES) {
      settFel('Bakgrundsbilden är för stor (max 10 MB).')
      return
    }
    if (bakgrundUrl) URL.revokeObjectURL(bakgrundUrl)
    const url = URL.createObjectURL(fil)
    settBakgrundUrl(url)
    if (scen) settScen({ ...scen, bakgrundUrl: url })
  }

  function taBortBakgrund() {
    if (bakgrundUrl) URL.revokeObjectURL(bakgrundUrl)
    settBakgrundUrl(undefined)
    if (filRef.current) filRef.current.value = ''
    if (scen) settScen({ ...scen, bakgrundUrl: undefined })
  }

  async function exportera(format: 'pdf' | 'png' | 'pptx') {
    if (!scen) return
    settExporterar(true)
    settFel(null)
    try {
      if (format === 'pdf') await exporteraPdf(scen, mat)
      if (format === 'png') await exporteraPng(scen, mat)
      if (format === 'pptx') {
        const { exporteraPptxBlob } = await import('../export/pptx')
        const figurData: Record<string, string> = {}
        for (const bubbla of scen.bubblor) {
          figurData[bubbla.figur.fil] = await bildTillDataUrl(figurUrl(bubbla.figur.fil))
        }
        const blob = await exporteraPptxBlob(scen, {
          figurer: figurData,
          bakgrund: scen.bakgrundUrl ? await bildTillDataUrl(scen.bakgrundUrl) : undefined,
        })
        laddaNer(blob, `${filnamn(scen.begrepp)}.pptx`)
      }
    } catch {
      settFel('Exporten misslyckades. Försök igen.')
    } finally {
      settExporterar(false)
    }
  }

  return (
    <div className="app">
      <header className="topprad">
        <div className="varumarke">
          <h1>Diskussionsunderlag</h1>
          <p>Concept cartoons för klassrummet · Lunds kommun</p>
        </div>

        <div className="faltgrupp faltgrupp-brett">
          <label htmlFor="begrepp">Begrepp eller fråga</label>
          <input
            id="begrepp"
            type="text"
            maxLength={300}
            placeholder="T.ex. Varför har regnbågen sina färger?"
            value={begrepp}
            onChange={(h) => settBegrepp(h.target.value)}
          />
        </div>

        <div className="faltgrupp">
          <label htmlFor="arskurs">Årskurs</label>
          <select
            id="arskurs"
            value={arskurs}
            onChange={(h) => settArskurs(h.target.value as Arskurs)}
          >
            {ARSKURSER.map((a) => (
              <option key={a} value={a}>
                {arskursEtikett(a)}
              </option>
            ))}
          </select>
        </div>

        <div className="faltgrupp">
          <label htmlFor="sprak">Språk</label>
          <select
            id="sprak"
            value={sprakVal}
            onChange={(h) => settSprakVal(h.target.value as (typeof SPRAK)[number])}
          >
            {SPRAK.map((s) => (
              <option key={s} value={s}>
                {s === 'annat' ? 'annat …' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {sprakVal === 'annat' && (
          <div className="faltgrupp">
            <label htmlFor="annatSprak">Skriv språk</label>
            <input
              id="annatSprak"
              type="text"
              placeholder="t.ex. finska"
              value={annatSprak}
              onChange={(h) => settAnnatSprak(h.target.value)}
            />
          </div>
        )}

        <div className="faltgrupp">
          <label htmlFor="bakgrund">Bakgrundsbild (stannar på din dator)</label>
          <div className="filrad">
            <input
              id="bakgrund"
              ref={filRef}
              type="file"
              accept={TILLATNA_BILDTYPER.join(',')}
              onChange={(h) => valjBakgrund(h.target.files?.[0])}
            />
            {bakgrundUrl && (
              <button type="button" className="lank" onClick={taBortBakgrund}>
                Ta bort
              </button>
            )}
          </div>
        </div>

        <div className="knapprad">
          <button
            className="knapp"
            disabled={laddar || !figurer}
            onClick={() => generera(new ServerGenerator())}
          >
            {laddar ? 'Genererar …' : 'Generera med AI'}
          </button>
          <button className="knapp" disabled={laddar || !figurer} onClick={skapaTom}>
            Skapa tom (skriv själv)
          </button>
        </div>
      </header>

      {fel && (
        <div className="felrad">
          <p>{fel}</p>
          <button className="lank" onClick={() => generera(new ExempelGenerator())}>
            Använd exempelutsagor istället
          </button>
        </div>
      )}
      {manifestFel && (
        <div className="felrad">
          <p>{manifestFel}</p>
        </div>
      )}

      {scen && (
        <div className="verktygsrad">
          {/* Exporten visas först när ett underlag finns. */}
          <div className="knapprad">
            <button className="knapp" disabled={exporterar} onClick={() => exportera('pdf')}>
              PDF
            </button>
            <button className="knapp" disabled={exporterar} onClick={() => exportera('pptx')}>
              PowerPoint (möjlig redigering)
            </button>
            <button className="knapp" disabled={exporterar} onClick={() => exportera('png')}>
              PNG-bild
            </button>
            <button
              className="knapp"
              aria-expanded={visaForklaring}
              onClick={() => settVisaForklaring((v) => !v)}
            >
              {visaForklaring ? 'Dölj förklaring' : 'Förklara kategorierna'}
            </button>
          </div>

          <div className="kryssgrupp">
            <label>
              <input
                type="checkbox"
                checked={scen.visaVetInte}
                onChange={(h) => settScen({ ...scen, visaVetInte: h.target.checked })}
              />
              Visa öppna "?"-bubblan
            </label>
            <label>
              <input
                type="checkbox"
                checked={visaKategorier}
                onChange={(h) => settVisaKategorier(h.target.checked)}
              />
              Visa kategorietiketter (aldrig i exporten)
            </label>
          </div>

          {exporterar && <p className="status">Skapar fil …</p>}
        </div>
      )}

      <main className="huvudyta">
        {scen ? (
          <>
            <div className="scenkort">
              <Scen
                scen={scen}
                mat={mat}
                visaKategorier={visaKategorier}
                vidTextandring={(index, text) => settScen(uppdateraBubbeltext(scen, index, text))}
                vidFlytt={(index, forskjutning: Forskjutning) =>
                  settScen(flyttaBubbla(scen, index, forskjutning))
                }
              />
            </div>
            <p className="tips">
              Dra ett barn för att flytta det och dess pratbubbla. Tryck på en bubbla för att
              redigera texten.
            </p>
            {visaForklaring && (
              <Forklaring scen={scen} vidStang={() => settVisaForklaring(false)} />
            )}
          </>
        ) : (
          <div className="valkommen">
            <h2>Skapa ett diskussionsunderlag</h2>
            <p>
              Skriv ett begrepp eller en fråga, välj årskurs och låt AI föreslå elevutsagor – det
              korrekta svaret, en intuitiv missuppfattning, en övergeneralisering och en falsk
              logikkedja, plus den klassiska öppna "?"-bubblan. Du redigerar allt innan export.
            </p>
            <p className="tips">
              Metoden bygger på Concept Cartoons (Keogh &amp; Naylor, Skolverket): eleverna
              diskuterar figurernas påståenden – målet är resonemang, inte rätt svar. AI-anropet
              skickar endast begrepp, årskurs och språk – aldrig bilder eller personuppgifter.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
