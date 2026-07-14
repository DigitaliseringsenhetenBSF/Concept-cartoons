import { describe, expect, it } from 'vitest'
import { forstapersonsord, harForstapersonsrost } from './rost'
import { VET_INTE_TEXT } from './konstanter'
import { exempelUtsagor } from '../ai/mock'

describe('forstapersonsord', () => {
  it('fångar när barnet talar som ämnet ("Jag skriker på våren")', () => {
    expect(forstapersonsord('Jag skriker på våren för det är parningstid.', 'svenska')).toEqual([
      'jag',
    ])
    expect(harForstapersonsrost('Vi tycker att katterna är arga.', 'svenska')).toBe(true)
  })

  it('godkänner utsagor i tredje person', () => {
    expect(forstapersonsord('Katterna skriker på våren för att det är parningstid.', 'svenska'))
      .toEqual([])
    expect(harForstapersonsrost('De låter som bebisar för att locka andra katter.', 'svenska'))
      .toBe(false)
  })

  it('förväxlar inte ord som innehåller pronomen ("mina" i "minaret", "vi" i "vinter")', () => {
    expect(harForstapersonsrost('På vintern blir det kallt i viken.', 'svenska')).toBe(false)
    expect(harForstapersonsrost('Jaget är ett begrepp inom psykologin.', 'svenska')).toBe(false)
  })

  it('fungerar på engelska', () => {
    expect(harForstapersonsrost('I scream in spring because it is mating season.', 'engelska'))
      .toBe(true)
    expect(harForstapersonsrost('Cats scream in spring because it is mating season.', 'engelska'))
      .toBe(false)
  })

  it('släpper igenom språk vi saknar ordlista för (promptregeln får styra)', () => {
    expect(forstapersonsord('vilken text som helst', 'somaliska')).toEqual([])
  })
})

describe('appens egna standardtexter är fria från förstapersonsröst', () => {
  it('den fasta "?"-bubblan', () => {
    expect(harForstapersonsrost(VET_INTE_TEXT, 'svenska')).toBe(false)
  })

  it('exempelutsagorna (reservläget utan AI)', () => {
    for (const utsaga of exempelUtsagor('Varför skriker katter i mars?')) {
      expect(harForstapersonsrost(utsaga.text, 'svenska')).toBe(false)
    }
  })
})
