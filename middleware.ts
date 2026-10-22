import { NextResponse, type NextRequest } from 'next/server'
import livre from '@/content/livre.json'
import { COOKIE_OUVERT, COOKIE_SCEAU, egaux, jetonLivre } from '@/lib/sceau'

/*
 * Every visit starts at the cover (/sceau):
 * - private book: the cover is locked; the signed seal cookie lets the reader in;
 * - public book: the cover opens on a click; a session cookie remembers it was opened.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/sceau' || pathname.startsWith('/api/sceau')) return NextResponse.next()

  if ((livre as { acces?: string }).acces === 'public') {
    if (req.cookies.get(COOKIE_OUVERT)?.value) return NextResponse.next()
  } else {
    const jeton = req.cookies.get(COOKIE_SCEAU)?.value
    const attendu = await jetonLivre()
    if (jeton && attendu && egaux(jeton, attendu)) return NextResponse.next()
  }

  // The API answers, it does not redirect.
  if (pathname.startsWith('/api/')) return NextResponse.json({ message: '' }, { status: 401 })
  const url = req.nextUrl.clone()
  url.pathname = '/sceau'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icone.svg|gaufrage.svg|robots.txt|textures/).*)'],
}
