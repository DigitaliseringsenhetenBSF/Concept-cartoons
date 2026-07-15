import { z } from 'zod'
import { AI_KATEGORIER } from './kategorier'
import { MAXLANGD_HARD } from './konstanter'

/**
 * Kontrakt för AI-svaret – valideras på servern INNAN något når UI:t.
 * Exakt fyra utsagor, en per AI-kategori.
 */
export const utsagaSchema = z.object({
  kategori: z.enum(AI_KATEGORIER),
  text: z.string().trim().min(1).max(MAXLANGD_HARD),
})

export const aiSvarSchema = z
  .object({
    utsagor: z.array(utsagaSchema).length(AI_KATEGORIER.length),
    /** Den öppna "?"-bubblan, formulerad på samma språk som utsagorna. */
    oppenFraga: z.string().trim().min(1).max(MAXLANGD_HARD).optional(),
  })
  .refine(
    (svar) => new Set(svar.utsagor.map((u) => u.kategori)).size === AI_KATEGORIER.length,
    { message: 'Svaret måste innehålla exakt en utsaga per kategori' },
  )

export type AiSvar = z.infer<typeof aiSvarSchema>

/** Begäran från webbläsaren till /api/generera. Endast begrepp + årskurs + språk – aldrig bilder eller personuppgifter. */
export const genereraBegaranSchema = z.object({
  begrepp: z.string().trim().min(2).max(300),
  arskurs: z.enum(['F', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
  sprak: z.string().trim().min(2).max(40).default('svenska'),
})

export type GenereraBegaran = z.infer<typeof genereraBegaranSchema>

/**
 * Begäran till /api/forklara: lärarstödet ska förklara varje ruta UTIFRÅN den
 * konkreta frågan och de pratbubbletexter som just skapats/redigerats. Skickar
 * alltså med utsagorna – men fortfarande aldrig bilder eller personuppgifter.
 */
export const forklaraBegaranSchema = z.object({
  begrepp: z.string().trim().min(2).max(300),
  arskurs: z.enum(['F', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
  sprak: z.string().trim().min(2).max(40).default('svenska'),
  utsagor: z
    .array(
      z.object({
        kategori: z.enum(AI_KATEGORIER),
        text: z.string().trim().min(1).max(MAXLANGD_HARD),
      }),
    )
    .length(AI_KATEGORIER.length),
  oppenFraga: z.string().trim().max(MAXLANGD_HARD).optional(),
})

export type ForklaraBegaran = z.infer<typeof forklaraBegaranSchema>

/**
 * Kontrakt för förklaringssvaret – valideras på servern innan det når UI:t.
 * En förklaring per AI-kategori: varför just den här texten hör till kategorin
 * (utifrån begreppet) och ett konkret samtalsdrag för klassrummet.
 */
export const forklaringSvarSchema = z
  .object({
    forklaringar: z
      .array(
        z.object({
          kategori: z.enum(AI_KATEGORIER),
          varfor: z.string().trim().min(1).max(600),
          samtal: z.string().trim().min(1).max(600),
        }),
      )
      .length(AI_KATEGORIER.length),
  })
  .refine(
    (svar) => new Set(svar.forklaringar.map((f) => f.kategori)).size === AI_KATEGORIER.length,
    { message: 'Svaret måste innehålla exakt en förklaring per kategori' },
  )

export type ForklaringSvar = z.infer<typeof forklaringSvarSchema>
