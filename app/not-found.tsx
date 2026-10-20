import Link from 'next/link'
import { config } from '@/lib/config'

export default function Egare() {
  const { egare } = config()
  return (
    <main className="egare">
      <h1>{egare.titre}</h1>
      <p>{egare.texte}</p>
      <Link href="/">{egare.retour}</Link>
    </main>
  )
}
