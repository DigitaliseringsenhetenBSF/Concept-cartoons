/** WCAG 2.1-kontrasthjälpare. Används i tester för att låsa palettens kombinationer till AA. */

function hexTillRgb(hex: string): [number, number, number] {
  const ren = hex.replace('#', '')
  return [
    parseInt(ren.slice(0, 2), 16),
    parseInt(ren.slice(2, 4), 16),
    parseInt(ren.slice(4, 6), 16),
  ]
}

function relativLuminans(hex: string): number {
  const [r, g, b] = hexTillRgb(hex).map((kanal) => {
    const c = kanal / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function kontrastKvot(farg1: string, farg2: string): number {
  const l1 = relativLuminans(farg1)
  const l2 = relativLuminans(farg2)
  const [ljus, mork] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (ljus + 0.05) / (mork + 0.05)
}

/** AA för normal text: 4.5:1. För stor text (≥24 px / 19 px fet): 3:1. */
export function uppfyllerAA(text: string, bakgrund: string, storText = false): boolean {
  return kontrastKvot(text, bakgrund) >= (storText ? 3 : 4.5)
}
