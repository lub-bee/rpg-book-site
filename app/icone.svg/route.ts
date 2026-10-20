import { livreComplet } from '@/lib/contenu'

/** Favicon: the book's emblem, gilded with the book's gold, on a leather tile. */
export function GET() {
  const { config, embleme } = livreComplet()
  const [a, b, c, d] = config.apparence.dorure
  const fond = config.apparence.couleurs.cuirSombre ?? '#2a120a'
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="o" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${a}"/><stop offset=".45" stop-color="${b}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${d}"/>` +
    `</linearGradient></defs><rect width="64" height="64" rx="12" fill="${fond}"/>` +
    `<svg x="5" y="5" width="54" height="54" viewBox="${embleme.viewBox}"><path fill="url(#o)" fill-rule="evenodd" d="${embleme.d}"/></svg></svg>`
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } })
}
