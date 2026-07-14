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
  .object({ utsagor: z.array(utsagaSchema).length(AI_KATEGORIER.length) })
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
