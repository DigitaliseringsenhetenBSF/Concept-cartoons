import type { ModellAnrop } from './generera'

/**
 * OpenAI-adapter. Samma kontrakt som Anthropic-adaptern: prompt in → råtext ut.
 * Ingen SDK behövs – ett enkelt fetch-anrop mot chat completions räcker.
 */
export function skapaOpenAiAnrop(apiNyckel: string, modell: string): ModellAnrop {
  return async (system, anvandare) => {
    const svar = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiNyckel}`,
      },
      body: JSON.stringify({
        model: modell,
        max_completion_tokens: 2048,
        // JSON-läge minskar risken för kontraktsbrott; prompten kräver redan JSON.
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: anvandare },
        ],
      }),
    })

    if (!svar.ok) {
      const kropp = await svar.text().catch(() => '')
      throw new Error(`OpenAI svarade ${svar.status}: ${kropp.slice(0, 500)}`)
    }

    const data = (await svar.json()) as {
      choices?: { message?: { content?: string | null } }[]
    }
    return data.choices?.[0]?.message?.content ?? ''
  }
}
