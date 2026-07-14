# SPEC — Diskussionsunderlag

> Levande källa till sanning för produkt- och arkitekturbeslut.
> Uppdateras i samma commit som varje beslut som ändrar den.

## 1. Produkt

**Diskussionsunderlag** är ett webbverktyg för lärare i Lunds kommun (BSF, F–åk 9)
som skapar concept cartoons — diskussionsbilder där illustrerade barn uttrycker
olika utsagor om ett begrepp via pratbubblor — enligt Keogh & Naylors metod i
Skolverkets anpassning. Läraren anger begrepp + årskurs, AI föreslår utsagor,
läraren redigerar, verktyget renderar och exporterar.

**Skolverkets material är pedagogisk förebild (metoden), aldrig innehållskälla
(illustrationer/texter kopieras inte).**

### Framgångskriterier
- Begrepp → klassrumsfärdigt underlag på under 5 minuter.
- Utsagorna är pedagogiskt användbara med lätt redigering.
- Resultatet ser professionellt formgivet ut utan designarbete.

## 2. Produktbeslut (beslutade av produktägaren 2026-07-14)

| # | Beslut |
|---|---|
| 1 | **4 + 1 bubblor:** AI genererar korrekt, intuitiv missuppfattning, övergeneralisering, falsk logik (taxonomi i §3). Femte bubblan är en fast öppen "?"-bubbla (Skolverkets konvention) som kan slås av och redigeras. |
| 2 | **Sessionsbaserat:** ingen lagring på server eller i webbläsare. Export är "sparandet". |
| 3 | **Driftsagnostiskt:** statisk frontend + liten Node-API. Körs lokalt; flyttbart till Azure m.m. Ingen inloggning i v1. |
| 4 | **Språk:** svenska standard + valbart språk (engelska, arabiska, somaliska, ukrainska, fritext) för flerspråkiga klassrum. |

### Icke-mål (v1)
Inga elevkonton, ingen delningsplattform, ingen AI-bildgenerering av barn,
ingen LMS-integration, inget allmänt ritverktyg.

## 3. Domänmodell

- **Utsaga** = { kategori, text }. Kategorier enligt produktägarens taxonomi
  (beslut 2026-07-14, baserad på analys av Skolverkets material):

  | Nyckel | Kategori | Innebörd |
  |---|---|---|
  | `korrekt` | Det vetenskapligt korrekta svaret | Korrekt förklaring enligt gällande principer, på enkelt vardagsspråk utan att förlora stringens |
  | `intuitiv` | Den intuitiva/vardagliga missuppfattningen | Känns logiskt vid första anblick men är fel; hopblandade vardagsbegrepp (vikt/volym, värme/temperatur) eller förhastade slutsatser av det synliga |
  | `overgeneralisering` | Övergeneraliseringen (regelföljande fel) | En inlärd regel tillämpas där den inte gäller, eller mellansteg glöms (t.ex. täljare + täljare, nämnare + nämnare) |
  | `falsklogik` | Det missuppfattade orsakssambandet (falsk logik) | Logisk tankekedja med felaktig utgångspunkt/mekanism – en egen, ofta bakvänd förklaringsmodell ("jackan smälter snögubben") |
  | `vetinte` | Den öppna frågan / tomma förslaget ("?") | Fast bubbla som bjuder in den läsande eleven med egna teorier; kan redigeras eller döljas |
- **Scen** = begrepp, årskurs, stadium, språk, ev. bakgrunds-URL, 5 pratbubblor
  (kategori, text, figur, fyllnadsfärg), visaVetInte.
- **Årskurs → stadium:** F–3 → `lag`, 4–6 → `mellan`, 7–9 → `hog`. Styr både
  figururval och språkregister i AI-prompten.
- **Slumpning (pedagogiskt krav):** kategori→figur-tilldelningen slumpas vid
  varje generering (seedbar Fisher–Yates, `src/domain/slump.ts`) så att ingen
  figur konsekvent "har rätt". Läraren kan slumpa om tilldelningen.
- **Placering:** varje bubbla bär en `forskjutning` som läraren ändrar genom att
  dra figuren (med pratbubblan) i scenen. Förskjutningen klampas så inget kan
  hamna utanför bildytan, och används av editor, PDF och PPTX via
  `src/domain/scenlayout.ts` – det läraren ser är det som exporteras.
- **Öppna "?"-bubblan följer språkvalet:** AI:n returnerar fältet `oppenFraga`
  på valt språk; saknas det används svensk standardtext.

## 4. Figurbibliotek (assets-register)

`public/figurer/manifest.json` är källa till sanning; 15 PNG med äkta alfa,
5 per stadium (`lag1–5`, `mellan1–5`, `hog1–9`-prefix i filnamnet är nyckeln).
Ny figur = släpp in PNG + manifestpost — ingen kodändring. Figurhöjder
normaliseras vid layout (`FIGUR_HOJD`), proportioner bevaras.

## 5. Design

- **Palett (obligatorisk):** Ljusgul `#FFF1BE` (ytor), Ljusrosa `#F7C1BD` och
  Ljusblå `#CCE1E0` (bubbelvarianter), Orange `#EB683E` (accent/primärknapp),
  Lila `#5B124D` (rubriker, konturer), Grön `#0B3A38` (text) + vitt/nästan-svart.
- **WCAG AA** låses av enhetstester (`src/domain/kontrast.test.ts`). Notera:
  vit text på orange klarar inte AA → primärknappar har mörk text.
- **Logisk scen:** 1600×900; alla mått är namngivna konstanter i
  `src/domain/konstanter.ts`. Samma layoutmatte i editor (SVG), PDF (canvas)
  och PPTX (native objekt).
- Kategorietiketter visas endast i editorn, aldrig i export.
- **Gränssnitt:** menyrad överst (begrepp, årskurs, språk, bakgrund, generera);
  verktygsrad under den visas **först när underlaget finns** (export + växlar +
  förklaring). Scenen fyller resten. Alla knappar har samma form och den lila
  profilfärgen (`#5B124D`) med vit text (kontrast ≈ 13:1).
  Radbrytande flex → fungerar från mobil (375 px) via iPad till projektor.
- **Lärarstöd:** knappen "Förklara kategorierna" öppnar en panel som för varje
  kategori visar definition, igenkänningstecken, ett exempel av samma slag och
  en ingång till klassrumssamtalet – tillsammans med scenens egen utsaga, så att
  läraren ser *varför* en text är t.ex. en övergeneralisering. Stödtexterna bor i
  `KATEGORI_STOD` (`src/domain/kategorier.ts`) och når aldrig exporten.

## 6. AI-generering

- Endpoint: `POST /api/generera` med `{ begrepp, arskurs, sprak }`.
- Kontrakt (zod, `src/domain/validering.ts`): exakt 4 utsagor, en per kategori,
  1–250 tecken. Valideras på servern INNAN UI. Vid brott: ett omförsök med
  felbeskrivning, därefter tydligt svenskt fel.
- **Leverantör (beslut 2026-07-14): OpenAI** — modell `gpt-5-mini` (konfigurerbar
  via `OPENAI_MODEL`), adapter i `server/openai.ts`. Anthropic-adaptern finns
  kvar (`claude-sonnet-5`); servern väljer utifrån vilken nyckel som finns i
  `.env` (OpenAI först om båda). Nyckel endast i server-`.env`.
- Rekommenderad maxlängd per stadium (styr prompt + UI-riktmärke):
  lag 90, mellan 120, hog 160 tecken.
- **Verktyget är fullt användbart utan AI:** "Skapa tom (skriv själv)" +
  exempelgenerator som reservläge när servern/nyckeln saknas.

## 7. Export

- **PDF:** A4 liggande, 300 DPI (3508×2480). Scenmodellen ritas om deterministiskt
  på canvas (ingen DOM-skärmdump) med titel + sidfot. Även PNG från samma canvas.
- **PPTX:** 16:9 (10×5,625 tum). Bakgrund, varje figur och varje pratbubbla är
  separata, redigerbara PowerPoint-objekt (roundRect + svans-triangel + text).
  Verifieras i röktestet genom uppackning och XML-assertions.

## 8. GDPR / dataminimering

| Data | Var den finns | Lämnar webbläsaren? |
|---|---|---|
| Begrepp, årskurs, språk | UI-state → `/api/generera` → AI-leverantören (OpenAI; alternativt Anthropic) | Ja (enda utflödet) |
| Uppladdad bakgrundsbild | Objekt-URL i webbläsarminnet | **Nej, aldrig** |
| Färdigt underlag | Endast i sessionen + lärarens exporterade filer | Nej (bara som fil till lärarens dator) |
| Analytics/spårning | Finns inte | — |

Bilduppladdning valideras (PNG/JPEG/WebP, max 10 MB). Ingen persistens.
AI-genererade utsagor når aldrig elever utan lärarens redigering/godkännande
(läraren är alltid sista ledet före export).

## 9. Öppna frågor (parkerade)

1. Slutlig driftmiljö (Azure? BSF/IT-beslut) och ev. M365-SSO.
2. Lgr22-koppling i prompten (v1 är läroplansagnostisk).
3. GitHub-repo under `DigitaliseringsenhetenBSF` — skapas på produktägarens signal.
4. A3-format och fler exportstorlekar (kod förberedd via konstanter).
