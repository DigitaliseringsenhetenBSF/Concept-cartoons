import { useEffect, useMemo, useRef, useState } from 'react'
import { ARSKURSER, arskursEtikett, arskursTillStadium, type Arskurs } from '../domain/arskurs'
import { figurerForStadium, tolkaManifest, figurUrl, type Figur } from '../domain/figurer'
import { KATEGORI_ETIKETT, type AiKategori } from '../domain/kategorier'
import {
  MAX_BAKGRUND_BYTES,
  MAXLANGD_PER_STADIUM,
  TILLATNA_BILDTYPER,
  VET_INTE_TEXT,
} from '../domain/konstanter'
import {
  bytUtsagaPlats,
  ersattUtsagor,
  skapaScen,
  uppdateraBubbeltext,
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

const SPRAK = ['svenska', 'engelska', 'arabiska', 'somaliska', 'ukrainska', 'annat'] as const

export function App() {
  const [figurer, settFigurer] = useState<Figur[] | null>(null)
  const [manifestFel, settManifestFel] = useState<string | null>(null)

  const [begrepp, settBegrepp] = useState('')
  const [arskurs, settArskurs] = useState<Arskurs>('4')
  const [sprakVal, settSprakVal] = useState<(typeof SPRAK)[number]>('svenska')
  const [annatSprak, settAnnatSprak] = useState('')
  const [bakgrundUrl, settBakgrundUrl] = useState<string | undefined>()
  const [bakgrundFel, settBakgrundFel] = useState<string | null>(null)

  const [scen, settScen] = useState<ScenModell | null>(null)
  const [laddar, settLaddar] = useState(false)
  const [fel, settFel] = useState<string | null>(null)
  const [visaKategorier, settVisaKategorier] = useState(true)
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

  function stadiumFigurer(): Figur[] {
    return figurerForStadium(figurer ?? [], arskursTillStadium(arskurs))
  }

  async function generera(generator: UtsageGenerator) {
    if (begrepp.trim().length < 2) {
      settFel('Skriv först ett begrepp eller en fråga.')
      return
    }
    settLaddar(true)
    settFel(null)
    try {
      const utsagor = await generator.generera({ begrepp: begrepp.trim(), arskurs, sprak })
      settScen(byggScen(utsagor))
    } catch (f) {
      settFel(f instanceof AiFel ? f.message : 'Något gick fel vid genereringen.')
    } finally {
      settLaddar(false)
    }
  }

  function byggScen(utsagor: Utsaga[]): ScenModell {
    return skapaScen({
      begrepp: begrepp.trim(),
      arskurs,
      sprak,
      utsagor,
      figurer: stadiumFigurer(),
      fro: slumpFro(),
      bakgrundUrl,
    })
  }

  function skapaTom() {
    if (begrepp.trim().length < 2) {
      settFel('Skriv först ett begrepp eller en fråga.')
      return
    }
    settFel(null)
    settScen(
      byggScen([
        { kategori: 'korrekt', text: '' },
        { kategori: 'fel', text: '' },
        { kategori: 'igangsattande', text: '' },
        { kategori: 'fakta', text: '' },
      ]),
    )
  }

  function slumpaOmFigurer() {
    if (!scen || !figurer) return
    const utsagor = scen.bubblor
      .filter((b) => b.kategori !== 'vetinte')
      .map((b) => ({ kategori: b.kategori as AiKategori, text: b.text }))
    const vetInteText =
      scen.bubblor.find((b) => b.kategori === 'vetinte')?.text ?? VET_INTE_TEXT
    const ny = skapaScen({
      begrepp: scen.begrepp,
      arskurs: scen.arskurs,
      sprak: scen.sprak,
      utsagor,
      figurer: figurerForStadium(figurer, scen.stadium),
      fro: slumpFro(),
      bakgrundUrl: scen.bakgrundUrl,
    })
    settScen({
      ...ny,
      visaVetInte: scen.visaVetInte,
      bubblor: ny.bubblor.map((b) => (b.kategori === 'vetinte' ? { ...b, text: vetInteText } : b)),
    })
  }

  async function genereraOmAlla(generator: UtsageGenerator) {
    if (!scen) return
    settLaddar(true)
    settFel(null)
    try {
      const utsagor = await generator.generera({
        begrepp: scen.begrepp,
        arskurs: scen.arskurs,
        sprak: scen.sprak,
      })
      settScen(ersattUtsagor(scen, utsagor))
    } catch (f) {
      settFel(f instanceof AiFel ? f.message : 'Något gick fel vid genereringen.')
    } finally {
      settLaddar(false)
    }
  }

  function valjBakgrund(fil: File | undefined) {
    settBakgrundFel(null)
    if (!fil) return
    if (!(TILLATNA_BILDTYPER as readonly string[]).includes(fil.type)) {
      settBakgrundFel('Endast PNG-, JPEG- eller WebP-bilder kan användas.')
      return
    }
    if (fil.size > MAX_BAKGRUND_BYTES) {
      settBakgrundFel('Bilden är för stor (max 10 MB).')
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

  const maxlangd = scen ? MAXLANGD_PER_STADIUM[scen.stadium] : undefined

  return (
    <div className="app">
      <aside className="sidopanel">
        <header>
          <h1>Diskussionsunderlag</h1>
          <p className="underrubrik">Concept cartoons för klassrummet · Lunds kommun</p>
        </header>

        <section>
          <label htmlFor="begrepp">Begrepp eller fråga</label>
          <textarea
            id="begrepp"
            rows={2}
            maxLength={300}
            placeholder="T.ex. Varför har regnbågen sina färger?"
            value={begrepp}
            onChange={(h) => settBegrepp(h.target.value)}
          />

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

          <label htmlFor="sprak">Språk för utsagorna</label>
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
          {sprakVal === 'annat' && (
            <input
              type="text"
              placeholder="Skriv språk, t.ex. finska"
              value={annatSprak}
              onChange={(h) => settAnnatSprak(h.target.value)}
            />
          )}

          <label htmlFor="bakgrund">Bakgrundsbild (valfri – lämnar aldrig din dator)</label>
          <input
            id="bakgrund"
            ref={filRef}
            type="file"
            accept={TILLATNA_BILDTYPER.join(',')}
            onChange={(h) => valjBakgrund(h.target.files?.[0])}
          />
          {bakgrundUrl && (
            <button className="lank" onClick={taBortBakgrund}>
              Ta bort bakgrundsbilden
            </button>
          )}
          {bakgrundFel && <p className="fel">{bakgrundFel}</p>}

          <div className="knapprad">
            <button
              className="primar"
              disabled={laddar || !figurer}
              onClick={() => generera(new ServerGenerator())}
            >
              {laddar ? 'Genererar …' : 'Generera med AI'}
            </button>
            <button className="sekundar" disabled={laddar || !figurer} onClick={skapaTom}>
              Skapa tom (skriv själv)
            </button>
          </div>
          {fel && (
            <div className="fel">
              <p>{fel}</p>
              <button className="lank" onClick={() => generera(new ExempelGenerator())}>
                Använd exempelutsagor istället
              </button>
            </div>
          )}
          {manifestFel && <p className="fel">{manifestFel}</p>}
        </section>

        {scen && (
          <>
            <section>
              <h2>Utsagor</h2>
              <p className="tips">
                Klicka på en bubbla i bilden för att redigera texten.
                {maxlangd && ` Riktmärke: max ${maxlangd} tecken.`}
              </p>
              <ul className="bubbellista">
                {scen.bubblor.map((bubbla, i) => (
                  <li key={bubbla.kategori}>
                    <span className={`chip chip-${bubbla.kategori}`}>
                      {KATEGORI_ETIKETT[bubbla.kategori]}
                    </span>
                    <span className="bubbeltext">{bubbla.text || '(tom)'}</span>
                    <span className="bubbelknappar">
                      <button
                        title="Flytta till figuren till vänster"
                        disabled={i === 0}
                        onClick={() => settScen(bytUtsagaPlats(scen, i, i - 1))}
                      >
                        ←
                      </button>
                      <button
                        title="Flytta till figuren till höger"
                        disabled={i === scen.bubblor.length - 1}
                        onClick={() => settScen(bytUtsagaPlats(scen, i, i + 1))}
                      >
                        →
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="knapprad">
                <button className="sekundar" disabled={laddar} onClick={slumpaOmFigurer}>
                  Slumpa om figurerna
                </button>
                <button
                  className="sekundar"
                  disabled={laddar}
                  onClick={() => genereraOmAlla(new ServerGenerator())}
                >
                  Generera om utsagorna
                </button>
              </div>
              <label className="kryssrad">
                <input
                  type="checkbox"
                  checked={scen.visaVetInte}
                  onChange={(h) => settScen({ ...scen, visaVetInte: h.target.checked })}
                />
                Visa "vet inte / ?"-bubblan
              </label>
              <label className="kryssrad">
                <input
                  type="checkbox"
                  checked={visaKategorier}
                  onChange={(h) => settVisaKategorier(h.target.checked)}
                />
                Visa kategorietiketter (endast här – aldrig i exporten)
              </label>
            </section>

            <section>
              <h2>Exportera</h2>
              <div className="knapprad">
                <button className="primar" disabled={exporterar} onClick={() => exportera('pdf')}>
                  PDF (utskrift)
                </button>
                <button className="primar" disabled={exporterar} onClick={() => exportera('pptx')}>
                  PowerPoint
                </button>
                <button className="sekundar" disabled={exporterar} onClick={() => exportera('png')}>
                  PNG-bild
                </button>
              </div>
              {exporterar && <p className="tips">Skapar fil …</p>}
            </section>
          </>
        )}

        <footer>
          <p>
            AI-anropet skickar endast begrepp, årskurs och språk – aldrig bilder eller
            personuppgifter. Du granskar och redigerar alltid utsagorna innan de visas för elever.
          </p>
        </footer>
      </aside>

      <main className="huvudyta">
        {scen ? (
          <div className="scenkort">
            <Scen
              scen={scen}
              mat={mat}
              visaKategorier={visaKategorier}
              vidTextandring={(index, text) => settScen(uppdateraBubbeltext(scen, index, text))}
            />
          </div>
        ) : (
          <div className="valkommen">
            <h2>Skapa ett diskussionsunderlag</h2>
            <p>
              Skriv ett begrepp eller en fråga, välj årskurs och låt AI föreslå elevutsagor – en
              korrekt, en vanlig missuppfattning, en igångsättande och en faktautsaga, plus den
              klassiska "vet inte / ?"-bubblan. Du redigerar allt innan export.
            </p>
            <p className="tips">
              Metoden bygger på Concept Cartoons (Keogh &amp; Naylor, Skolverket): eleverna
              diskuterar figurernas påståenden – målet är resonemang, inte rätt svar.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
