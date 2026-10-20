import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import { IM_Fell_English, IM_Fell_English_SC, UnifrakturMaguntia } from 'next/font/google'
import { config, COULEURS_CSS } from '@/lib/config'
import './globals.css'

const gothique = UnifrakturMaguntia({ weight: '400', subsets: ['latin'], variable: '--font-gothique' })
const texte = IM_Fell_English({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-texte' })
const capitales = IM_Fell_English_SC({ weight: '400', subsets: ['latin'], variable: '--font-capitales' })

export function generateMetadata(): Metadata {
  const c = config()
  return {
    title: c.onglet.titre,
    description: c.onglet.description,
    icons: { icon: { url: '/icone.svg', type: 'image/svg+xml' } },
    robots: { index: false, follow: false },
  }
}

export const viewport: Viewport = { themeColor: '#1a110b', width: 'device-width', initialScale: 1 }

/** The book's look (livre.json "apparence") as CSS variables on <html>: they override the defaults of globals.css. */
function apparence(): CSSProperties {
  const a = config().apparence
  const vars: Record<string, string> = {
    '--texture-table': `url("${a.table}")`,
    '--texture-cuir': `url("${a.cuir}")`,
    '--voile-cuir-1': a.voileCuir[0],
    '--voile-cuir-2': a.voileCuir[1],
  }
  a.dorure.forEach((c, i) => (vars[`--dorure-${i + 1}`] = c))
  for (const [cle, v] of Object.entries(a.couleurs)) vars[COULEURS_CSS[cle]] = v
  return vars as CSSProperties
}

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang={config().langue} className={`${gothique.variable} ${texte.variable} ${capitales.variable}`} style={apparence()}>
      <body>{children}</body>
    </html>
  )
}
