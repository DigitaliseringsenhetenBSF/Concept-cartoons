# Diskussionsunderlag

Webbverktyg för lärare i Lunds kommun (Barn- och skolförvaltningen) som skapar
**concept cartoons** — diskussionsbilder där illustrerade barn uttrycker olika
utsagor om ett begrepp i pratbubblor. Metoden (Keogh & Naylor, Skolverkets
anpassning) synliggör missuppfattningar och sätter igång klassrumssamtal:
målet är resonemang, inte rätt svar.

Läraren skriver ett begrepp (t.ex. *"Varför har regnbågen sina färger?"*),
väljer årskurs (F–9) och språk. AI föreslår fyra utsagor (korrekt, vanlig
missuppfattning, igångsättande, fakta); en fast "vet inte / ?"-bubbla ingår.
Läraren redigerar allt och exporterar till **PDF** (utskrift/projektor),
**PowerPoint** (fullt redigerbara objekt) eller **PNG**.

## Kommandon

```bash
npm install          # installera beroenden
npm run dev          # dev-server: Vite (5173) + API (3001) samtidigt
npm test             # alla tester (48 st: domän, AI-kontrakt, export-XML)
npm run smoke        # röktest: "bråk åk 4" end-to-end mot mockad AI → pptx-XML
npm run lint         # ESLint
npm run format       # Prettier
npm run build        # typkontroll + produktionsbygge till dist/
```

## AI-nyckel (valfritt men rekommenderat)

```bash
cp .env.example .env   # fyll i OPENAI_API_KEY (eller ANTHROPIC_API_KEY)
```

Servern väljer AI-leverantör utifrån vilken nyckel som finns: **OpenAI**
(`gpt-5-mini`, ändra med `OPENAI_MODEL`) eller **Anthropic**
(`claude-sonnet-5`). Nyckeln används **endast av servern**
(`server/index.ts`) — aldrig i webbläsarkod, och `.env` är git-ignorerad.
Utan nyckel fungerar verktyget ändå: "Skapa tom (skriv själv)" och
exempelutsagor täcker hela flödet.

## Integritet (GDPR)

- Det enda som skickas till AI-tjänsten är **begrepp + årskurs + språk**.
- Uppladdade bakgrundsbilder **lämnar aldrig webbläsaren**.
- Ingen lagring, inga konton, ingen spårning. Se [SPEC.md](SPEC.md) §8.

## Dokumentation

| Fil | Innehåll |
|---|---|
| [SPEC.md](SPEC.md) | Produktbeslut, domänmodell, GDPR-dataflöde — källa till sanning |
| [TECHNICAL_PLAN.md](TECHNICAL_PLAN.md) | Stackval med motiv, promptdesign, exportpipeline |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Mermaid-diagram: systemöversikt + huvudflödet |
| [TASKS.md](TASKS.md) | Fasindelad backlog med succékriterier |

## Figurbiblioteket

`public/figurer/` innehåller 15 fotorealistiska barnfigurer (PNG med alfa),
fem per stadium (`lag`/`mellan`/`hog`). `manifest.json` är registret — en ny
figur läggs till genom att släppa in en PNG och en manifestpost, ingen kod.
Vilken figur som säger vad **slumpas vid varje generering** så att ingen figur
konsekvent är "den som har rätt".
