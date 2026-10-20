'use client'

import { useRef, useState } from 'react'
import type { Config } from '@/lib/config'
import type { Embleme as Trace } from '@/lib/types'
import { COOKIE_OUVERT } from '@/lib/sceau'
import { CoinLaiton, Embleme, Fleuron } from './Ornements'
import { Cle, Serrure } from './Fer'

type Etat = 'repos' | 'essai' | 'refus' | 'ouvert'

/**
 * The closed book on the table.
 * - Private book: an iron lock on the fore-edge; the password field is the shaft of the key.
 *   Right word → the key enters, turns, the cover swings open on the greeting page.
 * - Public book: no lock; a click on the cover opens it (same swing, same greeting page).
 */
export default function Sceau({ config, embleme }: { config: Config; embleme: Trace }) {
  const publique = config.acces === 'public'
  const textes = config.serrure
  const [motDePasse, setMotDePasse] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [etat, setEtat] = useState<Etat>('repos')
  const champ = useRef<HTMLInputElement>(null)

  const ouvrir = () => {
    if (etat !== 'repos') return
    document.cookie = `${COOKIE_OUVERT}=1; path=/; SameSite=Lax`
    setEtat('ouvert')
    setTimeout(() => window.location.replace('/'), 1900)
  }

  const tourner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (etat !== 'repos') return
    if (!motDePasse.trim()) {
      champ.current?.focus()
      return
    }
    setEtat('essai')
    setMessage(null)
    const [rep] = await Promise.all([
      fetch('/api/sceau', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motDePasse }),
      }).catch(() => null),
      new Promise((r) => setTimeout(r, 500)), // let the key reach the lock
    ])
    if (rep?.ok) {
      setEtat('ouvert')
      setTimeout(() => window.location.replace('/'), 2100)
      return
    }
    const corps = rep ? ((await rep.json().catch(() => ({}))) as { message?: string }) : {}
    setEtat('refus')
    setMessage(corps.message || textes.coincee)
    setTimeout(() => {
      setEtat('repos')
      champ.current?.select()
    }, 900)
  }

  return (
    <main className="seuil">
      <div className={`table-tome etat-${etat} ${publique ? 'acces-public' : ''}`}>
        <div className="tome">
          <div className="tome-pages" aria-hidden />
          <div className="tome-garde" aria-hidden>
            <Fleuron />
            <p>{config.couverture.salut}</p>
          </div>
          <div className="tome-battant">
            <div className="tome-doublure" aria-hidden />
            <div className="tome-couverture">
              <div className="tome-charniere" aria-hidden />
              <CoinLaiton className="hg" />
              <CoinLaiton className="bg" />
              <CoinLaiton className="hd" />
              <CoinLaiton className="bd" />
              <div className="tome-cadre">
                <Embleme trace={embleme} taille={150} className="tome-embleme" />
                <h1 className="tome-titre">{config.couverture.titre}</h1>
                <Fleuron className="tome-fleuron" />
              </div>
              {!publique && (
                <div className="fermoir" aria-hidden>
                  <Serrure />
                </div>
              )}
              {publique && (
                <button type="button" className="tome-ouvrir" onClick={ouvrir} disabled={etat !== 'repos'} aria-label={config.couverture.ouvrir} title={config.couverture.ouvrir} autoFocus />
              )}
            </div>
          </div>
        </div>

        {!publique && (
          <div className="cle-fourreau">
            <form className="cle" onSubmit={tourner}>
              <Cle />
              <input
                ref={champ}
                className="cle-tige"
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder={textes.placeholder}
                autoComplete="current-password"
                autoFocus
                disabled={etat !== 'repos'}
                aria-label={textes.aide}
              />
              <button type="submit" className="cle-anneau" title={textes.tourner} aria-label={textes.tourner} disabled={etat !== 'repos'} />
            </form>
          </div>
        )}
      </div>
      <p className="tome-message" role="status">
        {publique ? (etat === 'repos' ? config.couverture.invite : '') : message}
      </p>
    </main>
  )
}
