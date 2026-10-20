import type { Metadata } from 'next'
import Sceau from '@/components/Sceau'
import { config } from '@/lib/config'
import { livreComplet } from '@/lib/contenu'

export function generateMetadata(): Metadata {
  return { title: config().couverture.onglet }
}

export default function PageSceau() {
  const { config: c, embleme } = livreComplet()
  return <Sceau config={c} embleme={embleme} />
}
