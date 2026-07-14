import { FONT_FAMILJ } from '../domain/konstanter'
import type { Textmatare } from '../domain/layout'

/** Skapar en textmätare baserad på canvas – samma mätning används i editorn och i exporten. */
export function skapaTextmatare(): Textmatare {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  return (text, fontstorlek) => {
    ctx.font = `600 ${fontstorlek}px ${FONT_FAMILJ}`
    return ctx.measureText(text).width
  }
}
