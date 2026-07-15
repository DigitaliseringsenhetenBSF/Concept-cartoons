import { useCallback, useEffect, useState } from 'react'
import {
  AI_KATEGORIER,
  ALLA_KATEGORIER,
  KATEGORI_ETIKETT,
  KATEGORI_STOD,
  type AiKategori,
} from '../domain/kategorier'
import type { Scen } from '../domain/scen'
import { hamtaForklaringar, type KategoriForklaring } from '../ai/forklaringsklient'
import { IkonAi } from './ikoner'

interface Props {
  scen: Scen
  vidStang: () => void
}

/**
 * Lärarstöd: förklarar varje ruta UTIFRÅN den konkreta frågan och de
 * pratbubbletexter som just skapats/redigerats. Innehållet genereras av AI
 * (serverns /api/forklara); vid fel visas ett stabilt statiskt stöd i stället.
 * Följer aldrig med till exporten.
 */
export function Forklaring({ scen, vidStang }: Props) {
  const [forklaringar, settForklaringar] = useState<KategoriForklaring[] | null>(null)
  const [laddar, settLaddar] = useState(false)
  const [fel, settFel] = useState<string | null>(null)

  // Utsagorna som stödet ska förklara – hämtade ur den aktuella scenen.
  const utsagor = AI_KATEGORIER.map((kategori) => ({
    kategori,
    text: scen.bubblor.find((b) => b.kategori === kategori)?.text.trim() ?? '',
  }))
  const allaHarText = utsagor.every((u) => u.text.length > 0)
  const oppenFraga = scen.bubblor.find((b) => b.kategori === 'vetinte')?.text.trim()

  const hamta = useCallback(async () => {
    if (!allaHarText) {
      settFel('Fyll i alla fyra bubblorna för att få AI-anpassat lärarstöd.')
      settForklaringar(null)
      return
    }
    settLaddar(true)
    settFel(null)
    try {
      const svar = await hamtaForklaringar({
        begrepp: scen.begrepp,
        arskurs: scen.arskurs,
        sprak: scen.sprak,
        utsagor,
        oppenFraga,
      })
      settForklaringar(svar)
    } catch (f) {
      settForklaringar(null)
      settFel(
        f instanceof Error
          ? `${f.message} Visar allmänt stöd i stället.`
          : 'Kunde inte hämta lärarstödet. Visar allmänt stöd i stället.',
      )
    } finally {
      settLaddar(false)
    }
    // scen.begrepp/arskurs/sprak + utsagornas text styr hämtningen.
  }, [scen.begrepp, scen.arskurs, scen.sprak, JSON.stringify(utsagor), oppenFraga])

  useEffect(() => {
    hamta()
  }, [hamta])

  const forStodet = (kategori: AiKategori) =>
    forklaringar?.find((f) => f.kategori === kategori)

  return (
    <section className="forklaring" aria-label="Förklaring till kategorierna">
      <div className="forklaring-topp">
        <h2>Förklaring till kategorierna</h2>
        <div className="forklaring-topp-knappar">
          <button className="knapp" onClick={hamta} disabled={laddar}>
            {laddar ? 'Hämtar …' : 'Uppdatera lärarstödet'}
          </button>
          <button className="knapp" onClick={vidStang}>
            Stäng förklaringen
          </button>
        </div>
      </div>

      <p className="forklaring-ingress">
        Concept Cartoons bygger på att elever reagerar på <em>andra barns</em> påståenden. Varje
        bubbla har ett pedagogiskt syfte – här ser du vilket, och varför just den här texten hamnat
        i sin kategori.
      </p>

      {laddar && (
        <p className="forklaring-status">
          <IkonAi /> AI skräddarsyr stödet utifrån din fråga och bubbeltexterna …
        </p>
      )}
      {fel && <p className="forklaring-fel">{fel}</p>}

      <div className="forklaring-kort">
        {ALLA_KATEGORIER.map((kategori) => {
          const stod = KATEGORI_STOD[kategori]
          const bubbla = scen.bubblor.find((b) => b.kategori === kategori)
          const doldMenFinns = kategori === 'vetinte' && !scen.visaVetInte
          const aiStod = kategori !== 'vetinte' ? forStodet(kategori) : undefined

          return (
            <article key={kategori} className={`forklaring-kategori kategori-${kategori}`}>
              <h3>
                <span className="chip">{KATEGORI_ETIKETT[kategori]}</span>
                {aiStod && <span className="ai-markering">AI-anpassad</span>}
                {doldMenFinns && <span className="dold-markering">dold i bilden</span>}
              </h3>

              <p className="kort">{stod.kort}</p>

              {bubbla && (
                <blockquote className="utsaga">
                  {bubbla.text ? `”${bubbla.text}”` : <em>(tom bubbla – skriv en text själv)</em>}
                </blockquote>
              )}

              {aiStod ? (
                <>
                  <h4>Varför den här hör hit</h4>
                  <p>{aiStod.varfor}</p>
                  <h4>I klassrumssamtalet</h4>
                  <p>{aiStod.samtal}</p>
                </>
              ) : (
                <>
                  <h4>Så känner du igen den</h4>
                  <ul>
                    {stod.kannetecken.map((tecken) => (
                      <li key={tecken}>{tecken}</li>
                    ))}
                  </ul>
                  <h4>I klassrumssamtalet</h4>
                  <p>{stod.iSamtalet}</p>
                </>
              )}
            </article>
          )
        })}
      </div>

      <p className="forklaring-fot">
        AI:n kan missa nyansen mellan kategorierna. Läs igenom utsagorna och justera dem själv – du
        är alltid sista granskaren innan något visas för eleverna.
      </p>
    </section>
  )
}
