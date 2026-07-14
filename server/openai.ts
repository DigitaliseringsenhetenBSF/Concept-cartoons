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
        // Resonerande modeller (gpt-5-familjen) räknar interna resonemangs-tokens
        // mot budgeten – ge marginal och håll resonemanget kort för denna enkla uppgift.
        max_completion_tokens: 8000,
        ...(arResonerande(modell) ? { reasoning_effort: 'low' } : {}),
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
      choices?: { message?: { content?: string | null }; finish_reason?: string }[]
    }
    const val = data.choices?.[0]
    if (val?.finish_reason === 'length' && !val.message?.content) {
      throw new Error('OpenAI-svaret trunkerades innan något innehåll hann genereras (finish_reason=length).')
    }
    return val?.message?.content ?? ''
  }
}

/** gpt-5-familjen och o-serien tar reasoning_effort; övriga modeller avvisar parametern. */
function arResonerande(modell: string): boolean {
  return /^(gpt-5|o\d)/.test(modell)
}
