import { ALLA_KATEGORIER, KATEGORI_ETIKETT, KATEGORI_STOD } from '../domain/kategorier'
import type { Scen } from '../domain/scen'

interface Props {
  scen: Scen
  vidStang: () => void
}

/**
 * Lärarstöd: förklarar varför varje utsaga tillhör sin kategori, med
 * igenkänningstecken och en ingång till klassrumssamtalet. Visas på begäran och
 * följer med aldrig till exporten.
 */
export function Forklaring({ scen, vidStang }: Props) {
  return (
    <section className="forklaring" aria-label="Förklaring till kategorierna">
      <div className="forklaring-topp">
        <h2>Förklaring till kategorierna</h2>
        <button className="knapp" onClick={vidStang}>
          Stäng förklaringen
        </button>
      </div>

      <p className="forklaring-ingress">
        Concept Cartoons bygger på att elever reagerar på <em>andra barns</em> påståenden. Varje
        bubbla har ett pedagogiskt syfte – här ser du vilket, och varför just den här texten hamnat
        i sin kategori.
      </p>

      <div className="forklaring-kort">
        {ALLA_KATEGORIER.map((kategori) => {
          const stod = KATEGORI_STOD[kategori]
          const bubbla = scen.bubblor.find((b) => b.kategori === kategori)
          const doldMenFinns = kategori === 'vetinte' && !scen.visaVetInte

          return (
            <article key={kategori} className={`forklaring-kategori kategori-${kategori}`}>
              <h3>
                <span className="chip">{KATEGORI_ETIKETT[kategori]}</span>
                {doldMenFinns && <span className="dold-markering">dold i bilden</span>}
              </h3>

              <p className="kort">{stod.kort}</p>

              {bubbla && (
                <blockquote className="utsaga">
                  {bubbla.text ? `”${bubbla.text}”` : <em>(tom bubbla – skriv en text själv)</em>}
                </blockquote>
              )}

              <h4>Så känner du igen den</h4>
              <ul>
                {stod.kannetecken.map((tecken) => (
                  <li key={tecken}>{tecken}</li>
                ))}
              </ul>

              <h4>Exempel av samma slag</h4>
              <p className="exempel">{stod.exempel}</p>

              <h4>I klassrumssamtalet</h4>
              <p>{stod.iSamtalet}</p>
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
