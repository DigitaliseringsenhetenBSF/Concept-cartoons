/** Bildhjälpare för export. Figurbilder hämtas same-origin; bakgrund är en lokal objekt-URL. */

export function laddaBild(url: string): Promise<HTMLImageElement> {
  return new Promise((losa, avvisa) => {
    const bild = new Image()
    bild.onload = () => losa(bild)
    bild.onerror = () => avvisa(new Error(`Kunde inte ladda bild: ${url}`))
    bild.src = url
  })
}

/** Konverterar en bild-URL till data-URL (krävs för inbäddning i .pptx). */
export async function bildTillDataUrl(url: string): Promise<string> {
  const bild = await laddaBild(url)
  const canvas = document.createElement('canvas')
  canvas.width = bild.naturalWidth
  canvas.height = bild.naturalHeight
  canvas.getContext('2d')!.drawImage(bild, 0, 0)
  return canvas.toDataURL('image/png')
}
