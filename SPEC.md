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
| 1 | **4 + 1 bubblor:** AI genererar korrekt, fel, igångsättande, fakta. Femte bubblan är en fast "vet inte / ?"-bubbla (Skolverkets konvention) som kan slås av och redigeras. |
| 2 | **Sessionsbaserat:** ingen lagring på server eller i webbläsare. Export är "sparandet". |
| 3 | **Driftsagnostiskt:** statisk frontend + liten Node-API. Körs lokalt; flyttbart till Azure m.m. Ingen inloggning i v1. |
| 4 | **Språk:** svenska standard + valbart språk (engelska, arabiska, somaliska, ukrainska, fritext) för flerspråkiga klassrum. |

### Icke-mål (v1)
Inga elevkonton, ingen delningsplattform, ingen AI-bildgenerering av barn,
ingen LMS-integration, inget allmänt ritverktyg.

## 3. Domänmodell

- **Utsaga** = { kategori, text }. Kategorier: `korrekt`, `fel` (plausibel
  missuppfattning), `igangsattande`, `fakta` samt `vetinte` (fast).
- **Scen** = begrepp, årskurs, stadium, språk, ev. bakgrunds-URL, 5 pratbubblor
  (kategori, text, figur, fyllnadsfärg), visaVetInte.
- **Årskurs → stadium:** F–3 → `lag`, 4–6 → `mellan`, 7–9 → `hog`. Styr både
  figururval och språkregister i AI-prompten.
- **Slumpning (pedagogiskt krav):** kategori→figur-tilldelningen slumpas vid
  varje generering (seedbar Fisher–Yates, `src/domain/slump.ts`) så att ingen
  figur konsekvent "har rätt". Läraren kan flytta utsagor manuellt (pilknappar).

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

## 6. AI-generering

- Endpoint: `POST /api/generera` med `{ begrepp, arskurs, sprak }`.
- Kontrakt (zod, `src/domain/validering.ts`): exakt 4 utsagor, en per kategori,
  1–250 tecken. Valideras på servern INNAN UI. Vid brott: ett omförsök med
  felbeskrivning, därefter tydligt svenskt fel.
- Modell: `claude-sonnet-5` via `@anthropic-ai/sdk`. Nyckel endast i server-`.env`.
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
| Begrepp, årskurs, språk | UI-state → `/api/generera` → Anthropic API | Ja (enda utflödet) |
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
