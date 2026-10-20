import 'server-only'
import { cookies } from 'next/headers'
import type { DefSection } from './contenu'
import { cookieSection, egaux, jetonSection } from './sceau'

/** Ids of the private sections whose seal the reader holds (signed cookie checked on the server). */
export async function sectionsOuvertes(defs: DefSection[]): Promise<Set<string>> {
  const jar = await cookies()
  const ouvertes = new Set<string>()
  for (const d of defs) {
    if (!d.prive) continue
    const jeton = jar.get(cookieSection(d.id))?.value
    const attendu = await jetonSection(d.id, d.motDePasseEnv)
    if (jeton && attendu && egaux(jeton, attendu)) ouvertes.add(d.id)
  }
  return ouvertes
}
