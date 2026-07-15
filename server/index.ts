import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { forklaraBegaranSchema, genereraBegaranSchema } from '../src/domain/validering'
import { genereraUtsagor, GenereringsFel, type ModellAnrop } from './generera'
import { genereraForklaringar } from './forklaring'
import { skapaOpenAiAnrop } from './openai'

const app = express()
app.use(express.json({ limit: '32kb' }))

/** Enda dataflödet till tredje part: begrepp + årskurs + språk. Aldrig bilder eller personuppgifter. */
const anropaAnthropic = (apiNyckel: string): ModellAnrop => {
  return async (system, anvandare) => {
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
}

/** Leverantören väljs av vilken nyckel som finns i .env (OpenAI först om båda finns). */
function valjModellAnrop(): { anrop: ModellAnrop; leverantor: string } | null {
  if (process.env.OPENAI_API_KEY) {
    return {
      anrop: skapaOpenAiAnrop(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_MODEL ?? 'gpt-5-mini',
      ),
      leverantor: 'OpenAI',
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { anrop: anropaAnthropic(process.env.ANTHROPIC_API_KEY), leverantor: 'Anthropic' }
  }
  return null
}

const modell = valjModellAnrop()

app.post('/api/generera', async (req, res) => {
  if (!modell) {
    res.status(503).json({
      fel: 'AI är inte konfigurerad på servern (OPENAI_API_KEY eller ANTHROPIC_API_KEY saknas i .env). Du kan arbeta manuellt eller använda exempelutsagor.',
    })
    return
  }

  const begaran = genereraBegaranSchema.safeParse(req.body)
  if (!begaran.success) {
    res.status(400).json({ fel: 'Ogiltig begäran: kontrollera begrepp och årskurs.' })
    return
  }

  try {
    const svar = await genereraUtsagor(begaran.data, modell.anrop)
    res.json(svar)
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

app.post('/api/forklara', async (req, res) => {
  if (!modell) {
    res.status(503).json({
      fel: 'AI är inte konfigurerad på servern. Lärarstödet kräver en API-nyckel i .env.',
    })
    return
  }

  const begaran = forklaraBegaranSchema.safeParse(req.body)
  if (!begaran.success) {
    res.status(400).json({ fel: 'Ogiltig begäran: kontrollera begrepp och utsagor.' })
    return
  }

  try {
    const svar = await genereraForklaringar(begaran.data, modell.anrop)
    res.json(svar)
  } catch (fel) {
    if (fel instanceof GenereringsFel) {
      res.status(502).json({ fel: fel.message })
    } else {
      console.error('Förklaringsanrop misslyckades:', fel)
      res.status(502).json({
        fel: 'Kunde inte hämta lärarstödet just nu. Försök igen om en stund.',
      })
    }
  }
})

const port = Number(process.env.API_PORT ?? 3001)
app.listen(port, () => {
  console.log(`Diskussionsunderlag API lyssnar på http://localhost:${port}`)
  if (modell) console.log(`AI-leverantör: ${modell.leverantor}`)
  else console.warn('OBS: ingen API-nyckel i .env – /api/generera svarar 503.')
})
