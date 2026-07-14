# TECHNICAL_PLAN — Diskussionsunderlag

## Stack (beslutad, med alternativ och motiv)

| Val | Beslut | Alternativ som övervägdes | Motiv |
|---|---|---|---|
| Frontend | Vite + React 18 + TypeScript (strict) | Svelte (mindre bundle), ren TS utan ramverk | Tråkigt/långlivat, bredast kompetensbas i kommunal miljö |
| API | Express, en endpoint | Hono (lättare, fler adaptrar), Azure Functions direkt | Minsta möjliga yta; AI-logiken ligger i portabel modul (`server/generera.ts`) som är trivial att flytta till en Function |
| AI | `@anthropic-ai/sdk`, `claude-sonnet-5` | Opus (dyrare, onödigt), Haiku (svagare pedagogisk nyans) | Bra svenska + följsam mot JSON-kontrakt till rimlig kostnad |
| Validering | zod, delat schema server/klient | JSON Schema + ajv | Typinferens gratis, minst kod |
| Editor | SVG i logiska enheter (1600×900) | Canvas-editor, HTML-divar | SVG ger redigerbar text, skalning och exakt samma koordinatsystem som exporten |
| PDF/PNG | Egen canvas-omritning 300 DPI → jsPDF | html2canvas-skärmdump | Deterministisk (vi äger scenmodellen), testbar layoutmatte, skarp print |
| PPTX | PptxGenJS (klient) | python-pptx (kräver server), officegen | Klient-side = ingen serverlast/lagring; native redigerbara objekt |
| Test | Vitest + jszip (PPTX-XML-assertions) | Jest | Snabbast med Vite; node-miljö räcker (domänen är DOM-fri) |

## AI-promptdesign (`server/prompt.ts`)

- Systemprompt beskriver metoden (diskussion före rätt svar, missuppfattningar
  synliggörs) och kräver exakt fyra kategorier i strikt JSON.
- **Årskursregister:** tre register (F–3 konkret vardagsspråk, 4–6 prövande med
  enkla facktermer, 7–9 utvecklade resonemang i autentiskt tonårsspråk) väljs
  via stadium; maxlängd per stadium skickas in i prompten (85 % av riktmärket
  för marginal mot kontraktet).
- Skyddsregler i prompten: missuppfattningen ska vara plausibel och vanlig,
  aldrig hånfull; inga namn; inga stereotyper; samma situation i alla utsagor.
- Robust tolkning: JSON extraheras även ur kodstaket/omgivande text; kontraktet
  (zod) avgör; ett omförsök med felbeskrivning innan svenskt fel visas.

## Rendering & export

En enda källa: scenmodellen + `beraknaLayout()`.

1. **Editor:** SVG med viewBox 0 0 1600 900. Textbrytning och fontkrympning
   (`radbrytText`/`passaText`) med canvas-`measureText` som mätare.
2. **PDF/PNG:** `ritaScen()` ritar om samma modell på offscreen-canvas; sidan
   komponeras (titel, scen, sidfot) i 3508×2480 och bäddas i jsPDF A4 liggande.
3. **PPTX:** samma platser mappas till tum (skala `(5,625−0,62)/900`); svansen
   är en triangel som ritas före bubblan så ansättningen blir sömlös; texten
   ligger i formen med autoFit.

Kända avvägningar: PowerPoint radbryter med egen font (Calibri), så radbrytning
kan skilja något från editorn — acceptabelt eftersom pptx:en är till för
efterredigering. `passaText` krymper i 1 px-steg (max ~18 iterationer, försumbart).

## Felmodi

| Fel | Hantering |
|---|---|
| API-nyckel saknas | 503 med svensk text; UI erbjuder exempelutsagor + manuellt läge |
| AI nere/långsam | 502 med svensk text; samma reservvägar |
| Kontraktsbrott från AI | 1 omförsök med felbeskrivning → tydligt fel |
| Ogiltig/för stor bilduppladdning | valideras klient-side (typ, 10 MB) med svenskt fel |
| Orimliga indata | zod på servern (begrepp 2–300 tecken) + maxLength i UI |

## Drift (förberedd, ej beslutad)

Frontend är statisk (`npm run build` → `dist/`). API:t är en Express-app vars
kärna (`generera.ts`) är ren funktion — flytt till Azure Static Web Apps +
Functions kräver bara ett tunt handler-skal. Beslut väntar på BSF/IT (se SPEC §9).
