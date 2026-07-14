# ARCHITECTURE — Diskussionsunderlag

## Systemöversikt

```mermaid
flowchart LR
    subgraph Webblasare["Webbläsare (lärarens dator)"]
        UI[React-UI<br/>svensk UI-text]
        Domain[Domänlager<br/>scenmodell · layout · slumpning]
        Export[Export<br/>PDF/PNG via canvas · PPTX via PptxGenJS]
        Assets[Figurregister<br/>manifest.json]
        Bakgrund[(Uppladdad bakgrund<br/>objekt-URL – lämnar aldrig webbläsaren)]
    end
    subgraph Server["Node-API (Express, en endpoint)"]
        API[POST /api/generera<br/>zod-validering + omförsök]
        Prompt[Promptbyggare<br/>årskursregister]
    end
    Anthropic[(Anthropic API<br/>claude-sonnet-5)]

    UI --> Domain --> Export
    UI --> Assets
    UI -.begrepp + årskurs + språk.-> API
    API --> Prompt --> Anthropic
    Anthropic --> API -.validerade utsagor.-> UI
    Bakgrund --> Domain
```

API-nyckeln finns endast i serverns `.env`. Det enda som lämnar webbläsaren är
begrepp, årskurs och språk.

## Flödet generera → redigera → rendera → exportera

```mermaid
sequenceDiagram
    actor L as Lärare
    participant UI as React-UI
    participant API as /api/generera
    participant AI as Anthropic
    participant D as Domän (scen.ts)
    participant E as Export

    L->>UI: begrepp + årskurs (+ språk, bakgrund)
    UI->>API: POST {begrepp, arskurs, sprak}
    API->>AI: prompt (register per stadium)
    AI-->>API: JSON-utsagor
    API->>API: zod-kontrakt (4 st, en per kategori)<br/>vid brott: 1 omförsök → svenskt fel
    API-->>UI: utsagor
    UI->>D: skapaScen (seedad slumpning kategori→figur + "?"-bubbla)
    L->>UI: redigerar bubbeltexter, flyttar utsagor, växlar "?"-bubbla
    L->>E: exportera
    E-->>L: PDF (canvas 300 DPI) / PNG / PPTX (separata objekt)
```

## Lagerkarta

| Lager | Kod | Beroenden |
|---|---|---|
| Domän (källa till sanning) | `src/domain/` | inga — ren TS, fullt enhetstestad |
| AI-adapter | `src/ai/` (klient, mock) + `server/` (prompt, kontrakt) | domän |
| Assets-register | `src/domain/figurer.ts` + `public/figurer/manifest.json` | — |
| UI | `src/ui/` | domän, ai, export |
| Export | `src/export/` | domän |

Domänlagret vet inget om React, canvas eller Anthropic — samma scenmodell driver
editorn (SVG), PDF-exporten (canvas) och PPTX-exporten (native objekt), vilket
garanterar att det läraren ser är det som exporteras.

## Källa till sanning vs genererat

- Källa: `src/`, `server/`, `public/figurer/` (inkl. manifest), dokumenten.
- Genererat (checkas aldrig in): `dist/`, `node_modules/`, exporterade filer.
