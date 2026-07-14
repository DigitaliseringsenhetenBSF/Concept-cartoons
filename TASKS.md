# TASKS — Diskussionsunderlag

Fasindelad backlog. En uppgift är klar först när dess succékriterium är verifierat.

## Fas 0 — Skelett & dokument ✅ (2026-07-14)

- [x] Scaffold Vite + React + TS + Vitest + ESLint/Prettier — *`npm run dev/test/lint/build` fungerar*
- [x] Figurbibliotek till `public/figurer/` (15 PNG + manifest) — *manifestet läses vid start*
- [x] SPEC.md, TECHNICAL_PLAN.md, TASKS.md, ARCHITECTURE.md — *finns och speglar besluten*
- [x] Git-repo med conventional commits — *initierat*

## Fas 1 — Gående skelett (mockad AI) ✅ (2026-07-14)

- [x] Domänmodell: kategorier, årskurs→stadium, scen — *enhetstester gröna*
- [x] Seedad slumpning kategori→figur — *test: alla 25 kombinationer över 400 frön*
- [x] Layoutmatte: platser, svansar, radbrytning, fontkrympning — *tester gröna, inga bubbelkollisioner*
- [x] SVG-editor med redigerbara bubblor (klick → textarea) — *verifierat i webbläsare*
- [x] Exempelgenerator (mock) — *röktest end-to-end*
- [x] PDF-export A4 liggande 300 DPI — *exporterad fil visuellt verifierad*

## Fas 2 — Riktig AI + PPTX ✅ (2026-07-14)

- [x] Express-server `POST /api/generera` + Anthropic-adapter — *kontrakts- och omförsökstester gröna*
- [x] zod-kontrakt server-side med omförsök + svenska fel — *tester för trasig JSON/refusal/dubbletter*
- [x] Språkval (svenska + engelska/arabiska/somaliska/ukrainska/fritext) — *skickas till prompten*
- [x] PPTX-export med separata objekt — *röktest packar upp och assert:ar XML; riktig export verifierad (5 `<p:pic>`, 11 `<p:sp>`)*
- [x] Reservlägen: manuellt läge + exempelutsagor vid AI-fel — *felväg verifierad i webbläsare utan API-nyckel*
- [ ] Verifiera riktig AI-generering med API-nyckel — *kräver ANTHROPIC_API_KEY från produktägaren*
- [ ] Öppna exporterad .pptx i riktig PowerPoint och justera en bubbla — *manuell kontroll av produktägaren*

## Fas 3 — Polish & felfall (pågår)

- [x] Bakgrundsbilduppladdning klient-side med validering (typ, 10 MB)
- [x] Flytta utsagor mellan figurer (pilknappar), slumpa om, "?"-toggle
- [x] PNG-export
- [x] WCAG AA låst med tester
- [ ] Regenerera EN utsaga i taget (endpoint klarar det; UI-knapp saknas)
- [ ] A3-format i PDF-exporten (välj format)
- [ ] Spara/öppna underlag som lokal JSON-fil (nice-to-have, sessionsbeslutet står fast)
- [ ] Tangentbordsnavigering i scenens bubblor (a11y-genomgång)
- [ ] Prestanda: förladda stadiumets figurbilder vid val av årskurs

## Parkerat (beslut krävs — se SPEC §9)

- [ ] GitHub-repo under `DigitaliseringsenhetenBSF` + CI
- [ ] Driftmiljö (Azure SWA + Functions?) och ev. M365-SSO
- [ ] Lgr22-referens i prompten
