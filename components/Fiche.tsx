'use client'

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/*
 * A loose slip pinned on the left page (on the whole screen width on phones). It unrolls down from its
 * top edge and rolls back up when put away (transform and opacity only, on its own layers, so nothing
 * is repainted while it moves). It goes when the page turns, on Escape, or with its "put away" action.
 * The content is the caller's: a ledger row's detail today, any other note or form tomorrow.
 */

const DUREE_DEROULE = 560
const DUREE_ENROULE = 480
const EPAIS_ROULEAU = 16

export function Fiche({
  surtitre,
  titre,
  sousTitre,
  ranger,
  teinte,
  mobile,
  sansAnimation = false,
  fermer,
  children,
}: {
  surtitre?: string
  titre: string
  sousTitre?: string
  /** Wording of the "put it away" action (livre.json "textes.fiche.ranger"). */
  ranger: string
  /** Colour of the section the slip belongs to (initial, rules). */
  teinte?: string
  mobile: boolean
  sansAnimation?: boolean
  fermer: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  const voile = useRef<HTMLDivElement>(null)
  const papier = useRef<HTMLDivElement>(null)
  const rouleau = useRef<HTMLDivElement>(null)
  const enCours = useRef<Animation[]>([])
  const partie = useRef(false)

  /**
   * The veil slides down clipping the paper, which slides up by as much and so stays still; the roll
   * hangs at the veil's bottom edge. Veil, paper and roll share keyframes and easing, so the roll is on
   * the paper's edge at every frame. Rolling up is the same animation played backwards.
   */
  const animer = (enroule: boolean): Animation[] | null => {
    const el = ref.current
    if (!el || !voile.current || !papier.current || !rouleau.current || sansAnimation) return null
    enCours.current.forEach((a) => a.cancel())
    const h = el.offsetHeight
    const temps: KeyframeAnimationOptions = {
      duration: enroule ? DUREE_ENROULE : DUREE_DEROULE,
      easing: enroule ? 'cubic-bezier(.5,0,.6,1)' : 'cubic-bezier(.25,.1,.25,1)',
      fill: 'both',
      direction: enroule ? 'reverse' : 'normal',
    }
    el.dataset.deroule = ''
    const anims = [
      voile.current.animate([{ transform: `translateY(${-h}px)` }, { transform: 'translateY(0px)' }], temps),
      papier.current.animate([{ transform: `translateY(${h}px)` }, { transform: 'translateY(0px)' }], temps),
      rouleau.current.animate(
        [
          { offset: 0, opacity: 1, transform: 'scaleY(1.25)' },
          { offset: 0.9, opacity: 1, transform: 'scaleY(0.9)' },
          { offset: 1, opacity: 0, transform: 'scaleY(0.8)' },
        ],
        temps,
      ),
    ]
    if (enroule) anims.push(el.animate([{ offset: 0, opacity: 0 }, { offset: 0.12, opacity: 1 }, { offset: 1, opacity: 1 }], temps))
    enCours.current = anims
    return anims
  }

  useLayoutEffect(() => {
    const anims = animer(false)
    if (!anims) return
    Promise.all(anims.map((a) => a.finished)).then(
      () => {
        if (enCours.current !== anims) return
        anims.forEach((a) => a.cancel())
        enCours.current = []
        delete ref.current?.dataset.deroule
      },
      () => {},
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const partir = () => {
    if (partie.current) return
    partie.current = true
    const anims = animer(true)
    if (!anims) return fermer()
    Promise.all(anims.map((a) => a.finished)).then(fermer, () => {})
  }

  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && partir()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <aside
      ref={ref}
      className={`fiche ${mobile ? 'mobile' : ''}`}
      style={{ '--teinte': teinte } as CSSProperties}
      aria-label={titre}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <svg className="fiche-defs" width="0" height="0" aria-hidden focusable="false">
        {/* Deckled edges of rag paper. Static: the slip moves by transforms only. */}
        <filter id="fiche-barbes" x="-3%" y="-3%" width="106%" height="106%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08 0.06" numOctaves="3" seed="9" result="b" />
          <feDisplacementMap in="SourceGraphic" in2="b" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="fiche-voile" ref={voile}>
        <div className="fiche-masque">
          <div className="fiche-contenu" ref={papier}>
            <div className="fiche-papier" aria-hidden />
            <span className="fiche-epingle" aria-hidden />
            <header className="fiche-tete">
              {surtitre && <div className="fiche-surtitre">{surtitre}</div>}
              <h2 className="fiche-titre">{titre}</h2>
              {sousTitre && <div className="fiche-sous-titre">{sousTitre}</div>}
              <button type="button" className="fiche-ranger" onClick={partir}>
                {ranger}
              </button>
            </header>
            <div className="fiche-corps">{children}</div>
          </div>
        </div>
        <div className="fiche-rouleau" ref={rouleau} style={{ height: EPAIS_ROULEAU }} aria-hidden />
      </div>
    </aside>
  )
}
