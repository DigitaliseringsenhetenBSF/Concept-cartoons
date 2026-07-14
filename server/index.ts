import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { genereraBegaranSchema } from '../src/domain/validering'
import { genereraUtsagor, GenereringsFel, type ModellAnrop } from './generera'

const app = express()
app.use(express.json({ limit: '32kb' }))

const apiNyckel = process.env.ANTHROPIC_API_KEY

/** Enda dataflödet till tredje part: begrepp + årskurs + språk. Aldrig bilder eller personuppgifter. */
const anropaAnthropic: ModellAnrop = async (system, anvandare) => {
  const klient = new Anthropic({ apiKey: apiNyckel })
  const svar = await klient.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: anvandare }],
  })
  const block = svar.content.find((b) => b.type === 'text')
  return block && block.type === 'text' ? block.text : ''
}

app.post('/api/generera', async (req, res) => {
  if (!apiNyckel) {
    res.status(503).json({
      fel: 'AI är inte konfigurerad på servern (ANTHROPIC_API_KEY saknas i .env). Du kan arbeta manuellt eller använda exempelutsagor.',
    })
    return
  }

  const begaran = genereraBegaranSchema.safeParse(req.body)
  if (!begaran.success) {
    res.status(400).json({ fel: 'Ogiltig begäran: kontrollera begrepp och årskurs.' })
    return
  }

  try {
    const utsagor = await genereraUtsagor(begaran.data, anropaAnthropic)
    res.json({ utsagor })
  } catch (fel) {
    if (fel instanceof GenereringsFel) {
      res.status(502).json({ fel: fel.message })
    } else {
      console.error('AI-anrop misslyckades:', fel)
      res.status(502).json({
        fel: 'Kunde inte nå AI-tjänsten just nu. Försök igen om en stund – eller skriv utsagorna manuellt.',
      })
    }
  }
})

const port = Number(process.env.API_PORT ?? 3001)
app.listen(port, () => {
  console.log(`Diskussionsunderlag API lyssnar på http://localhost:${port}`)
  if (!apiNyckel) console.warn('OBS: ANTHROPIC_API_KEY saknas – /api/generera svarar 503.')
})
