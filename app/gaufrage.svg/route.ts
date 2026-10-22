import { livreComplet } from '@/lib/contenu'

/**
 * The book's emblem blind-pressed into the paper (livre.json "apparence.gaufrage"): a faint darker
 * fill, a shadow along the upper-left inner edges and a light along the lower-right ones, as if the
 * paper had been pushed in. Laid under every page as a static background image (see globals.css,
 * "blind-pressed emblem"): it is rasterised once, nothing is filtered while the pages turn. Masks only,
 * no SVG filter, so the image stays cheap to draw at any size.
 */
export function GET() {
  const { embleme } = livreComplet()
  const [x, y, l, h] = embleme.viewBox.split(/[\s,]+/).map(Number)
  // The relief is about 1.5 px at the size the image is drawn (≈ 1000 px high).
  const d = (Math.max(l, h) || 1) * 0.0016
  const trace = (dx: number, dy: number, attributs: string) =>
    `<path transform="translate(${dx} ${dy})" fill-rule="evenodd" d="${embleme.d}" ${attributs}/>`
  const masque = (id: string, dx: number, dy: number) =>
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x - l}" y="${y - h}" width="${l * 3}" height="${h * 3}">` +
    `<rect x="${x - l}" y="${y - h}" width="${l * 3}" height="${h * 3}" fill="#fff"/>${trace(dx, dy, 'fill="#000"')}</mask>`
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${embleme.viewBox}">` +
    `<defs>${masque('ombre', d, d * 1.15)}${masque('lumiere', -d, -d * 1.15)}</defs>` +
    // Pressed-in hollow: slightly darker paper.
    trace(0, 0, 'fill="rgb(150,105,50)" fill-opacity=".07"') +
    // Shadow inside the upper-left edges: the shape minus itself moved down-right.
    trace(0, 0, 'fill="rgb(70,40,12)" fill-opacity=".34" mask="url(#ombre)"') +
    // Light inside the lower-right edges: the shape minus itself moved up-left.
    trace(0, 0, 'fill="rgb(255,249,230)" fill-opacity=".72" mask="url(#lumiere)"') +
    `</svg>`
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } })
}
