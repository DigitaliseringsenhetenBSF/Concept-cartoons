/**
 * Seedbar pseudoslump (mulberry32) så att kategori→figur-slumpningen är
 * reproducerbar i tester. I produktion seedas med ett slumptal per generering.
 */
export type Slumpkalla = () => number

export function mulberry32(seed: number): Slumpkalla {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates-blandning; muterar inte indata. */
export function seedadBlandning<T>(lista: readonly T[], slump: Slumpkalla): T[] {
  const resultat = [...lista]
  for (let i = resultat.length - 1; i > 0; i--) {
    const j = Math.floor(slump() * (i + 1))
    ;[resultat[i], resultat[j]] = [resultat[j], resultat[i]]
  }
  return resultat
}

export function slumpFro(): number {
  return Math.floor(Math.random() * 2 ** 31)
}
