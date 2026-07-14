import { describe, expect, it, vi } from 'vitest'
import { genereraUtsagor, GenereringsFel } from './generera'

const BEGARAN = { begrepp: 'Varför har regnbågen sina färger?', arskurs: '4', sprak: 'svenska' } as const

const GILTIG_JSON = JSON.stringify({
  utsagor: [
    { kategori: 'korrekt', text: 'Ljuset bryts i vattendropparna.' },
    { kategori: 'fel', text: 'Färgerna kommer från solen som målar himlen.' },
    { kategori: 'igangsattande', text: 'Varför ser man den bara ibland?' },
    { kategori: 'fakta', text: 'En regnbåge är egentligen en hel cirkel.' },
  ],
})

describe('genereraUtsagor', () => {
  it('returnerar validerade utsagor vid korrekt svar', async () => {
    const modell = vi.fn().mockResolvedValue(GILTIG_JSON)
    const utsagor = await genereraUtsagor(BEGARAN, modell)
    expect(utsagor).toHaveLength(4)
    expect(modell).toHaveBeenCalledTimes(1)
  })

  it('tål kodstaket och omgivande text runt JSON', async () => {
    const modell = vi.fn().mockResolvedValue('Här kommer svaret:\n```json\n' + GILTIG_JSON + '\n```')
    const utsagor = await genereraUtsagor(BEGARAN, modell)
    expect(utsagor).toHaveLength(4)
  })

  it('gör ETT omförsök vid trasig JSON och lyckas sedan', async () => {
    const modell = vi
      .fn()
      .mockResolvedValueOnce('Jag kan tyvärr inte svara i JSON just nu.')
      .mockResolvedValueOnce(GILTIG_JSON)
    const utsagor = await genereraUtsagor(BEGARAN, modell)
    expect(utsagor).toHaveLength(4)
    expect(modell).toHaveBeenCalledTimes(2)
    // Omförsöket ska tala om för modellen vad som var fel.
    expect(modell.mock.calls[1][1]).toContain('ogiltigt')
  })

  it('gör omförsök när en kategori saknas', async () => {
    const utanFakta = JSON.stringify({
      utsagor: JSON.parse(GILTIG_JSON).utsagor.map((u: { kategori: string }) =>
        u.kategori === 'fakta' ? { ...u, kategori: 'korrekt' } : u,
      ),
    })
    const modell = vi.fn().mockResolvedValueOnce(utanFakta).mockResolvedValueOnce(GILTIG_JSON)
    await expect(genereraUtsagor(BEGARAN, modell)).resolves.toHaveLength(4)
    expect(modell).toHaveBeenCalledTimes(2)
  })

  it('kastar ett svenskt fel efter två misslyckade försök', async () => {
    const modell = vi.fn().mockResolvedValue('inte json alls')
    await expect(genereraUtsagor(BEGARAN, modell)).rejects.toThrow(GenereringsFel)
    expect(modell).toHaveBeenCalledTimes(2)
  })
})
