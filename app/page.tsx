import Grimoire from '@/components/Grimoire'
import { livreComplet, livrePourLecteur } from '@/lib/contenu'
import { sectionsOuvertes } from '@/lib/lecteur'

// Rendered per request: the sealed sections depend on the reader's cookies.
export const dynamic = 'force-dynamic'

export default async function Accueil() {
  const complet = livreComplet()
  return <Grimoire livre={livrePourLecteur(complet, await sectionsOuvertes(complet.defs))} />
}
