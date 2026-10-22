import type { ReactNode } from 'react'
import type { Embleme as Trace } from '@/lib/types'
import { CoinLaiton, Embleme, Fleuron } from './Ornements'
import { Serrure } from './Fer'

/**
 * Leather front board of the closed book (the cover page, and the front of the printed copy): hinge,
 * brass corners, gilded emblem and short title, the iron lock plate on the fore-edge when the book is
 * private. `children` goes on the board (the public book's "open" button).
 */
export function FaceCouverture({ titre, embleme, serrure, children }: { titre: string; embleme: Trace; serrure: boolean; children?: ReactNode }) {
  return (
    <div className="tome-couverture">
      <div className="tome-charniere" aria-hidden />
      <CoinLaiton className="hg" />
      <CoinLaiton className="bg" />
      <CoinLaiton className="hd" />
      <CoinLaiton className="bd" />
      <div className="tome-cadre">
        <Embleme trace={embleme} taille={150} className="tome-embleme" />
        <h1 className="tome-titre">{titre}</h1>
        <Fleuron className="tome-fleuron" />
      </div>
      {serrure && (
        <div className="fermoir" aria-hidden>
          <Serrure />
        </div>
      )}
      {children}
    </div>
  )
}

/** Back board of the closed book (last sheet of the printed copy): same leather, hinge on the right, a small emblem low on the board. */
export function DosCouverture({ embleme }: { embleme: Trace }) {
  return (
    <div className="tome-couverture tome-dos">
      <div className="tome-charniere" aria-hidden />
      <CoinLaiton className="hg" />
      <CoinLaiton className="bg" />
      <CoinLaiton className="hd" />
      <CoinLaiton className="bd" />
      <div className="tome-cadre" aria-hidden />
      <Embleme trace={embleme} taille={64} className="tome-embleme tome-dos-embleme" />
    </div>
  )
}
