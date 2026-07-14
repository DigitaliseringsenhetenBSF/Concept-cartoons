import { describe, expect, it, vi } from 'vitest'
import { genereraUtsagor, GenereringsFel } from './generera'

const BEGARAN = { begrepp: 'Varför har regnbågen sina färger?', arskurs: '4', sprak: 'svenska' } as const

const GILTIG_JSON = JSON.stringify({
  utsagor: [
    { kategori: 'korrekt', text: 'Ljuset bryts i vattendropparna.' },
    { kategori: 'intuitiv', text: 'Färgerna kommer från solen som målar himlen.' },
    { kategori: 'overgeneralisering', text: 'Allt ljus som bryts blir alltid en regnbåge.' },
    { kategori: 'falsklogik', text: 'Regnet tvättar himlen så att färgerna syns.' },
  ],
  oppenFraga: 'Jag vet inte … kan man tänka på något annat sätt?',
})

describe('genereraUtsagor', () => {
  it('returnerar validerade utsagor och den öppna frågan vid korrekt svar', async () => {
    const modell = vi.fn().mockResolvedValue(GILTIG_JSON)
    const svar = await genereraUtsagor(BEGARAN, modell)
    expect(svar.utsagor).toHaveLength(4)
    expect(svar.oppenFraga).toContain('Jag vet inte')
    expect(modell).toHaveBeenCalledTimes(1)
  })

  it('godkänner svar utan öppen fråga (fältet är valfritt)', async () => {
    const utanOppenFraga = JSON.stringify({ utsagor: JSON.parse(GILTIG_JSON).utsagor })
    const modell = vi.fn().mockResolvedValue(utanOppenFraga)
    const svar = await genereraUtsagor(BEGARAN, modell)
    expect(svar.utsagor).toHaveLength(4)
    expect(svar.oppenFraga).toBeUndefined()
  })

  it('behåller den öppna frågan på det språk modellen svarat på', async () => {
    const engelska = JSON.stringify({
      utsagor: JSON.parse(GILTIG_JSON).utsagor,
      oppenFraga: "I don't know … could it be something else?",
    })
    const modell = vi.fn().mockResolvedValue(engelska)
    const svar = await genereraUtsagor(BEGARAN, modell)
    expect(svar.oppenFraga).toBe("I don't know … could it be something else?")
  })

  it('tål kodstaket och omgivande text runt JSON', async () => {
    const modell = vi.fn().mockResolvedValue('Här kommer svaret:\n```json\n' + GILTIG_JSON + '\n```')
    const svar = await genereraUtsagor(BEGARAN, modell)
    expect(svar.utsagor).toHaveLength(4)
  })

  it('gör ETT omförsök vid trasig JSON och lyckas sedan', async () => {
    const modell = vi
      .fn()
      .mockResolvedValueOnce('Jag kan tyvärr inte svara i JSON just nu.')
      .mockResolvedValueOnce(GILTIG_JSON)
    const svar = await genereraUtsagor(BEGARAN, modell)
    expect(svar.utsagor).toHaveLength(4)
    expect(modell).toHaveBeenCalledTimes(2)
    // Omförsöket ska tala om för modellen vad som var fel.
    expect(modell.mock.calls[1][1]).toContain('ogiltigt')
  })

  it('gör omförsök när en kategori saknas', async () => {
    const utanFalskLogik = JSON.stringify({
      utsagor: JSON.parse(GILTIG_JSON).utsagor.map((u: { kategori: string }) =>
        u.kategori === 'falsklogik' ? { ...u, kategori: 'korrekt' } : u,
      ),
    })
    const modell = vi.fn().mockResolvedValueOnce(utanFalskLogik).mockResolvedValueOnce(GILTIG_JSON)
    const svar = await genereraUtsagor(BEGARAN, modell)
    expect(svar.utsagor).toHaveLength(4)
    expect(modell).toHaveBeenCalledTimes(2)
  })

  it('normaliserar svensk stavning av kategorinycklar (ö, mellanslag, versaler)', async () => {
    const svenskStavning = JSON.stringify({
      utsagor: [
        { kategori: 'Korrekt', text: 'Ljuset bryts i vattendropparna.' },
        { kategori: 'Intuitiv', text: 'Färgerna kommer från solen som målar himlen.' },
        { kategori: 'Övergeneralisering', text: 'Allt ljus som bryts blir alltid en regnbåge.' },
        { kategori: 'Falsk logik', text: 'Regnet tvättar himlen så att färgerna syns.' },
      ],
    })
    const modell = vi.fn().mockResolvedValue(svenskStavning)
    const svar = await genereraUtsagor(BEGARAN, modell)
    expect(svar.utsagor.map((u) => u.kategori).sort()).toEqual([
      'falsklogik',
      'intuitiv',
      'korrekt',
      'overgeneralisering',
    ])
    expect(modell).toHaveBeenCalledTimes(1)
  })

  it('kastar ett svenskt fel efter två misslyckade försök', async () => {
    const modell = vi.fn().mockResolvedValue('inte json alls')
    await expect(genereraUtsagor(BEGARAN, modell)).rejects.toThrow(GenereringsFel)
    expect(modell).toHaveBeenCalledTimes(2)
  })
})
