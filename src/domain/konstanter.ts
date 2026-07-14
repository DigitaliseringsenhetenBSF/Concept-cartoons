// Alla "magiska tal" för scen, typografi och export samlas här.
// Motiveras i SPEC.md §Design.

/** Lunds kommuns palett – inga andra kulörer får användas (utöver vitt/nästan-svart). */
export const PALETT = {
  ljusgul: '#FFF1BE',
  ljusrosa: '#F7C1BD',
  ljusbla: '#CCE1E0',
  orange: '#EB683E',
  lila: '#5B124D',
  gron: '#0B3A38',
  vit: '#FFFFFF',
  mork: '#1A1A1A',
} as const

/** Logisk scenyta (16:9). All layout räknas i dessa enheter. */
export const SCEN_BREDD = 1600
export const SCEN_HOJD = 900

/** Figurernas maxmått per plats i scenen. */
export const FIGUR_HOJD = 380
export const FIGUR_MAX_BREDD = 300
export const FIGUR_BOTTENMARGINAL = 16

/**
 * Rubrikyta överst i scenen: lärarens begrepp/fråga visas ALLTID i sin helhet
 * (radbryts och krymper vid behov – klipps aldrig). Ytan är en del av scenen,
 * så rubriken följer automatiskt med till PDF, PowerPoint och PNG.
 */
export const TITEL_HOJD = 108
export const TITEL_TOPPMARGINAL = 20
export const TITEL_SIDMARGINAL = 60
export const TITEL_FONTSTORLEK = 54

/** Pratbubblor. */
export const BUBBLA_BREDD = 292
export const BUBBLA_HOJD = 224
export const BUBBLA_RADIE = 26
export const BUBBLA_PADDING = 20
export const BUBBLA_KANTBREDD = 3
/** Vertikal förskjutning som varannan bubbla får, för ett levande serietidningsuttryck. */
export const BUBBLA_STAGGER = 96
/** Avstånd mellan rubrikytan och bubblornas ovankant. */
export const BUBBLA_TOPPMARGINAL = 24

/** Typografi. Basstorlek (px i scenenheter) per stadium – yngre elever = större text, kortare utsagor. */
export const FONTSTORLEK_PER_STADIUM = { lag: 34, mellan: 30, hog: 27 } as const
export const MINSTA_FONTSTORLEK = 16
export const RADHOJD_FAKTOR = 1.25
export const FONT_FAMILJ = "'Segoe UI', 'Avenir Next', system-ui, sans-serif"

/** Rekommenderad maxlängd (tecken) per utsaga och stadium – styr både AI-prompt och varningar i UI. */
export const MAXLANGD_PER_STADIUM = { lag: 90, mellan: 120, hog: 160 } as const
/** Hård gräns i AI-kontraktet oavsett stadium. */
export const MAXLANGD_HARD = 250

/** Export. */
export const EXPORT_DPI = 300
/** A4 liggande vid 300 DPI. */
export const PDF_BREDD_PX = 3508
export const PDF_HOJD_PX = 2480
/** PowerPoint 16:9 i tum. */
export const PPTX_BREDD_TUM = 10
export const PPTX_HOJD_TUM = 5.625

/**
 * Standardtext för den fasta "?"-bubblan (Skolverkets konvention).
 * Riktad till eleven och utan förstapersonsröst – barnen talar om ämnet, inte
 * som ämnet (se src/domain/rost.ts).
 */
export const VET_INTE_TEXT = 'Vad tror du? Kan man tänka på något annat sätt?'

/** Bubblornas fyllnadsfärger roterar över dessa varianter (text alltid mörkgrön – WCAG AA-testat). */
export const BUBBLA_VARIANTER = [PALETT.vit, PALETT.ljusbla, PALETT.ljusrosa] as const

/** Maxstorlek för uppladdad bakgrundsbild (bilden lämnar aldrig webbläsaren). */
export const MAX_BAKGRUND_BYTES = 10 * 1024 * 1024
export const TILLATNA_BILDTYPER = ['image/png', 'image/jpeg', 'image/webp'] as const
