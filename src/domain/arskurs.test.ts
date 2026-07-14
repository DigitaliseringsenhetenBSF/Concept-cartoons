import { describe, expect, it } from 'vitest'
import { ARSKURSER, arskursEtikett, arskursTillStadium } from './arskurs'

describe('arskursTillStadium', () => {
  it('mappar F–3 till lågstadiet', () => {
    for (const a of ['F', '1', '2', '3'] as const) expect(arskursTillStadium(a)).toBe('lag')
  })

  it('mappar 4–6 till mellanstadiet', () => {
    for (const a of ['4', '5', '6'] as const) expect(arskursTillStadium(a)).toBe('mellan')
  })

  it('mappar 7–9 till högstadiet', () => {
    for (const a of ['7', '8', '9'] as const) expect(arskursTillStadium(a)).toBe('hog')
  })

  it('täcker alla årskurser', () => {
    for (const a of ARSKURSER) expect(['lag', 'mellan', 'hog']).toContain(arskursTillStadium(a))
  })
})

describe('arskursEtikett', () => {
  it('skriver ut förskoleklass och årskurs', () => {
    expect(arskursEtikett('F')).toBe('Förskoleklass')
    expect(arskursEtikett('7')).toBe('Årskurs 7')
  })
})
