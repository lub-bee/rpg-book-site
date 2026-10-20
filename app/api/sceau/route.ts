import { NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { COOKIE_OUVERT, COOKIE_SCEAU, DUREE_SCEAU, egaux, jetonLivre, jetonPour } from '@/lib/sceau'

/** Private book: turn the key (check the word, set the signed seal cookie). */
export async function POST(req: Request) {
  const textes = config().serrure
  const attendu = await jetonLivre()
  if (!attendu) return NextResponse.json({ message: textes.nonForgee }, { status: 503 })

  const { motDePasse } = (await req.json().catch(() => ({}))) as { motDePasse?: string }
  const jeton = await jetonPour('livre', String(motDePasse ?? '').trim())
  if (!jeton || !egaux(jeton, attendu)) {
    await new Promise((r) => setTimeout(r, 900))
    return NextResponse.json({ message: textes.refus }, { status: 401 })
  }

  const rep = NextResponse.json({ ok: true })
  rep.cookies.set(COOKIE_SCEAU, attendu, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DUREE_SCEAU,
  })
  return rep
}

/** Close the book (both access modes). */
export async function DELETE() {
  const rep = NextResponse.json({ ok: true })
  rep.cookies.set(COOKIE_SCEAU, '', { path: '/', maxAge: 0 })
  rep.cookies.set(COOKIE_OUVERT, '', { path: '/', maxAge: 0 })
  return rep
}
