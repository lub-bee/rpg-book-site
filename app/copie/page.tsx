import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Copie from '@/components/Copie'
import { config } from '@/lib/config'
import { livreComplet, livrePourLecteur } from '@/lib/contenu'
import { sectionsOuvertes } from '@/lib/lecteur'

// Rendered per request, from the reader's view of the book: the private sections they have not
// unlocked are copied sealed (title only), exactly as the grimoire shows them.
export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  // Browsers use the document title as the default PDF file name.
  return { title: config().modules.copie?.titre }
}

export default async function PageCopie() {
  const complet = livreComplet()
  if (!complet.config.modules.copie) notFound()
  return <Copie livre={livrePourLecteur(complet, await sectionsOuvertes(complet.defs))} />
}
