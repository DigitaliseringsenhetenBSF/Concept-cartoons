// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { fireEvent } from '@testing-library/dom'
import { Scen } from './Scen'
import { skapaScen, type Utsaga } from '../domain/scen'
import type { Figur } from '../domain/figurer'
import { SCEN_BREDD, SCEN_HOJD } from '../domain/konstanter'
import type { Textmatare } from '../domain/layout'

const FIGURER: Figur[] = ['mellan1', 'mellan2', 'mellan3', 'mellan4', 'mellan5'].map((fil) => ({
  fil: `${fil}.png`,
  stadium: 'mellan',
  bredd: 800,
  hojd: 1400,
}))

const UTSAGOR: Utsaga[] = [
  { kategori: 'korrekt', text: 'Korrekt utsaga' },
  { kategori: 'intuitiv', text: 'Intuitiv utsaga' },
  { kategori: 'overgeneralisering', text: 'Övergeneraliserad utsaga' },
  { kategori: 'falsklogik', text: 'Falsk logik-utsaga' },
]

const mat: Textmatare = (text, fontstorlek) => text.length * fontstorlek * 0.55

function scen() {
  return skapaScen({ begrepp: 'test', arskurs: '4', utsagor: UTSAGOR, figurer: FIGURER, fro: 5 })
}

/** SVG:n renderas 1:1 mot logiska scenenheter, så 1 klientpixel = 1 scenenhet. */
function mockaSvgStorlek() {
  Element.prototype.getBoundingClientRect = vi.fn(
    () => ({ left: 0, top: 0, width: SCEN_BREDD, height: SCEN_HOJD }) as DOMRect,
  )
}

function pekare(x: number, y: number) {
  return { clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse' }
}

beforeEach(() => {
  cleanup()
  mockaSvgStorlek()
})

function renderaScen() {
  const vidTextandring = vi.fn()
  const vidFlytt = vi.fn()
  render(
    <Scen
      scen={scen()}
      mat={mat}
      visaKategorier={false}
      vidTextandring={vidTextandring}
      vidFlytt={vidFlytt}
    />,
  )
  return { vidTextandring, vidFlytt }
}

describe('Scen – drag och släpp', () => {
  it('rapporterar förskjutningen när en figur dras till ny plats', () => {
    const { vidFlytt } = renderaScen()
    const grupp = document.querySelectorAll('.bubbelgrupp')[1]

    fireEvent.pointerDown(grupp, pekare(400, 700))
    fireEvent.pointerMove(grupp, pekare(520, 620))
    fireEvent.pointerUp(grupp, pekare(520, 620))

    expect(vidFlytt).toHaveBeenCalledTimes(1)
    const [index, forskjutning] = vidFlytt.mock.calls[0]
    expect(typeof index).toBe('number')
    expect(forskjutning.x).toBeCloseTo(120)
    expect(forskjutning.y).toBeCloseTo(-80)
  })

  it('öppnar textredigering vid tryck utan rörelse (klick, inte drag)', () => {
    const { vidFlytt } = renderaScen()
    const grupp = document.querySelectorAll('.bubbelgrupp')[1]

    fireEvent.pointerDown(grupp, pekare(400, 700))
    fireEvent.pointerUp(grupp, pekare(402, 701)) // under dragtröskeln

    expect(vidFlytt).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('visar alla fem bubblor och deras texter', () => {
    renderaScen()
    expect(document.querySelectorAll('.bubbelgrupp')).toHaveLength(5)
    expect(document.querySelector('svg')?.textContent).toContain('Korrekt utsaga')
    expect(document.querySelector('svg')?.textContent).toContain('Vad tror du')
  })
})
