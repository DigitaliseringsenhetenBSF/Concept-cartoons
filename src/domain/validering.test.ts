import { describe, expect, it } from 'vitest'
import { aiSvarSchema, genereraBegaranSchema } from './validering'

const GILTIGT = {
  utsagor: [
    { kategori: 'korrekt', text: 'Ljuset bryts i vattendropparna.' },
    { kategori: 'fel', text: 'Regnbågen är målad på himlen.' },
    { kategori: 'igangsattande', text: 'Kan man ta på en regnbåge?' },
    { kategori: 'fakta', text: 'Regnbågen har sju färger.' },
  ],
}

describe('aiSvarSchema', () => {
  it('godkänner ett korrekt svar', () => {
    expect(aiSvarSchema.safeParse(GILTIGT).success).toBe(true)
  })

  it('kräver exakt fyra utsagor', () => {
    expect(aiSvarSchema.safeParse({ utsagor: GILTIGT.utsagor.slice(0, 3) }).success).toBe(false)
  })

  it('kräver en utsaga per kategori (inga dubbletter)', () => {
    const dubblett = { utsagor: [...GILTIGT.utsagor.slice(0, 3), GILTIGT.utsagor[0]] }
    expect(aiSvarSchema.safeParse(dubblett).success).toBe(false)
  })

  it('avvisar tomma och överlånga texter', () => {
    const tom = { utsagor: GILTIGT.utsagor.map((u, i) => (i === 0 ? { ...u, text: ' ' } : u)) }
    expect(aiSvarSchema.safeParse(tom).success).toBe(false)
    const lang = { utsagor: GILTIGT.utsagor.map((u, i) => (i === 0 ? { ...u, text: 'x'.repeat(300) } : u)) }
    expect(aiSvarSchema.safeParse(lang).success).toBe(false)
  })

  it('avvisar okända kategorier', () => {
    const okand = { utsagor: GILTIGT.utsagor.map((u, i) => (i === 0 ? { ...u, kategori: 'skoj' } : u)) }
    expect(aiSvarSchema.safeParse(okand).success).toBe(false)
  })
})

describe('genereraBegaranSchema', () => {
  it('godkänner en normal begäran och sätter svenska som standardspråk', () => {
    const resultat = genereraBegaranSchema.parse({ begrepp: 'bråk', arskurs: '4' })
    expect(resultat.sprak).toBe('svenska')
  })

  it('avvisar orimliga indata', () => {
    expect(genereraBegaranSchema.safeParse({ begrepp: 'x', arskurs: '4' }).success).toBe(false)
    expect(genereraBegaranSchema.safeParse({ begrepp: 'x'.repeat(500), arskurs: '4' }).success).toBe(false)
    expect(genereraBegaranSchema.safeParse({ begrepp: 'bråk', arskurs: '10' }).success).toBe(false)
  })
})
