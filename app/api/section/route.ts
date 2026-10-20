import { NextResponse } from 'next/server'
import { livreComplet } from '@/lib/contenu'
import { cookieSection, DUREE_SCEAU, egaux, jetonPour, jetonSection } from '@/lib/sceau'

/** Private section: give the word. On success the signed section cookie is set; the page then refreshes. */
export async function POST(req: Request) {
  const { section, motDePasse } = (await req.json().catch(() => ({}))) as { section?: string; motDePasse?: string }
  const def = livreComplet().defs.find((d) => d.prive && d.id === section)
  if (!def || !def.serrure) return NextResponse.json({ message: '' }, { status: 404 })

  const attendu = await jetonSection(def.id, def.motDePasseEnv)
  if (!attendu) return NextResponse.json({ message: def.serrure.nonForgee }, { status: 503 })

  const jeton = await jetonPour(`section:${def.id}`, String(motDePasse ?? '').trim())
  if (!jeton || !egaux(jeton, attendu)) {
    await new Promise((r) => setTimeout(r, 900))
    return NextResponse.json({ message: def.serrure.refus }, { status: 401 })
  }

  const rep = NextResponse.json({ ok: true })
  rep.cookies.set(cookieSection(def.id), attendu, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DUREE_SCEAU,
  })
  return rep
}

/** Re-seal a private section. */
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('section') ?? ''
  const rep = NextResponse.json({ ok: true })
  if (livreComplet().defs.some((d) => d.prive && d.id === id)) rep.cookies.set(cookieSection(id), '', { path: '/', maxAge: 0 })
  return rep
}
