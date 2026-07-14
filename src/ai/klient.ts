import type { Utsaga } from '../domain/scen'
import type { GenereraParametrar, UtsageGenerator } from './typer'

export class AiFel extends Error {}

/** Anropar serverns /api/generera. API-nyckeln finns bara på servern. */
export class ServerGenerator implements UtsageGenerator {
  async generera(parametrar: GenereraParametrar): Promise<Utsaga[]> {
    let svar: Response
    try {
      svar = await fetch('/api/generera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parametrar),
      })
    } catch {
      throw new AiFel('Kunde inte nå AI-servern. Kontrollera att den är igång, eller arbeta manuellt.')
    }

    const data = (await svar.json().catch(() => null)) as
      | { utsagor?: Utsaga[]; fel?: string }
      | null
    if (!svar.ok || !data?.utsagor) {
      throw new AiFel(data?.fel ?? 'AI-generering misslyckades. Försök igen eller arbeta manuellt.')
    }
    return data.utsagor
  }
}
