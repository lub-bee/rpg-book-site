'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Livre, Page, PageRegistre, PageScellee } from '@/lib/types'
import { ligneCorrespond, plages } from '@/lib/recherche'
import { accorder, dateDuLivre, romain } from '@/lib/format'
import { Embleme, Fleuron, GlypheSceau, Icone, Plume } from './Ornements'
import { Cle, Serrure } from './Fer'

export type Ctx = {
  livre: Livre
  index: number
  /** false for the faces of a turning leaf: no inputs, no animations. */
  interactif: boolean
  requete: string
  locale: string
  setLocale?: (v: string) => void
  aller?: (i: number, cible?: string) => void
  cible?: string | null
  scrollInitial?: number
  onScroll?: (v: number) => void
  /** Opens a ledger row's detail on the pinned slip. */
  ouvrirFiche?: (ligne: string) => void
  /** Row whose slip is open on this page. */
  fiche?: string | null
}

const EFFACEMENT_MS = 320
const ICONE_RESCELLER = 'padlock'

/** Highlights every token of the query in red ink. */
function Surligne({ texte, requetes }: { texte: string; requetes: string[] }) {
  const r = plages(texte, requetes.join(' '))
  if (!r.length) return <>{texte}</>
  const morceaux: ReactNode[] = []
  let pos = 0
  r.forEach(([d, f], k) => {
    if (d > pos) morceaux.push(texte.slice(pos, d))
    morceaux.push(<mark key={k}>{texte.slice(d, f)}</mark>)
    pos = f
  })
  morceaux.push(texte.slice(pos))
  return <>{morceaux}</>
}

/** Scroll container that remembers its position across page turns. */
function Defile({ ctx, className, children }: { ctx: Ctx; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (ref.current && ctx.scrollInitial) ref.current.scrollTop = ctx.scrollInitial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div ref={ref} className={`defile ${className ?? ''}`} onScroll={ctx.onScroll ? (e) => ctx.onScroll!(e.currentTarget.scrollTop) : undefined}>
      {children}
    </div>
  )
}

export function CitationFin({ texte }: { texte: string }) {
  if (!texte) return null
  return (
    <blockquote className="citation-fin">
      <p>{texte}</p>
    </blockquote>
  )
}

/** A saying under a page's summary, with who said it. */
export function Dicton({ texte, auteur }: { texte: string; auteur: string }) {
  if (!texte) return null
  return (
    <blockquote className="citation-fin dicton">
      <p>{texte}</p>
      {auteur && <p className="dicton-auteur">— {auteur}</p>}
    </blockquote>
  )
}

/** Pages placed before the title page carry no folio: the numbering starts at the title page. */
export const avantSommaire = (pages: Page[]) => Math.max(0, pages.findIndex((p) => p.type === 'sommaire'))
const rang = (ctx: Ctx) => ctx.index - avantSommaire(ctx.livre.pages)

function Folio({ n }: { n: number }) {
  if (n < 1) return null
  return <div className="folio">{romain(n)}</div>
}

const sectionDe = (ctx: Ctx, page: Page) => ctx.livre.sections.find((s) => s.id === page.section)
const teinte = (ctx: Ctx, page: Page) => ({ '--teinte': sectionDe(ctx, page)?.couleur } as CSSProperties)

/* ───────────────────────────── Left pages ───────────────────────────── */

export function PageGauche({ page, ctx, compact = false }: { page: Page; ctx: Ctx; compact?: boolean }) {
  const icone = ctx.livre.icones[page.icone]
  const corps = (() => {
    switch (page.type) {
      case 'sommaire':
        return <Frontispice ctx={ctx} compact={compact} />
      case 'registre':
        return <TeteRegistre page={page} ctx={ctx} compact={compact} />
      case 'notes':
        return (
          <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={icone} compact={compact}>
            {page.resume && <p className="intro lettrine">{page.resume}</p>}
            {page.auteur && <p className="signature">{accorder(ctx.livre.config.textes.signature, { auteur: page.auteur })}</p>}
            {!compact && <Dicton texte={page.dicton} auteur={page.dictonAuteur} />}
          </EnTete>
        )
      case 'a-venir':
        return (
          <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={icone} compact={compact}>
            {page.resume && <p className="intro lettrine">{page.resume}</p>}
          </EnTete>
        )
      case 'scellee':
        return (
          <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={icone} compact={compact}>
            {sectionDe(ctx, page)?.serrure?.intro && <p className="intro lettrine">{sectionDe(ctx, page)!.serrure!.intro}</p>}
          </EnTete>
        )
    }
  })()
  if (compact) return corps
  return (
    <div className="contenu gauche-contenu" style={teinte(ctx, page)}>
      {/* Scrolls inside the page's margins, as the right page does: the folio and the frame stay clear. */}
      <div className="defile defile-gauche">
        {corps}
        <Resceller page={page} ctx={ctx} />
      </div>
      <Folio n={rang(ctx) * 2 + 1} />
    </div>
  )
}

export function EnTete({
  surtitre,
  titre,
  sousTitre,
  icone,
  compact,
  children,
}: {
  surtitre: string
  titre: string
  sousTitre?: string
  icone?: string
  compact?: boolean
  children?: ReactNode
}) {
  return (
    <header className={`en-tete ${compact ? 'compact' : ''}`}>
      {surtitre && <div className="surtitre">{surtitre}</div>}
      <div className="titre-ligne">
        {icone && (
          <span className="medaillon" aria-hidden>
            <Icone corps={icone} />
          </span>
        )}
        <h2 className="titre-page">{titre}</h2>
      </div>
      {sousTitre && <div className="sous-titre">{sousTitre}</div>}
      <Fleuron />
      {children}
    </header>
  )
}

export function Frontispice({ ctx, compact }: { ctx: Ctx; compact: boolean }) {
  const { config, embleme, consigneLe } = ctx.livre
  const t = config.pageDeTitre
  return (
    <div className={`frontispice ${compact ? 'compact' : ''}`}>
      <Embleme trace={embleme} taille={160} className="frontispice-embleme" />
      {t.surTitre && <div className="frontispice-sur">{t.surTitre}</div>}
      <h2 className="frontispice-titre">{config.titre}</h2>
      <Fleuron />
      {config.devise && <p className="citation">{config.devise}</p>}
      {!compact && t.texte && <p className="frontispice-texte">{t.texte}</p>}
      {t.consigne && (
        <p className="consigne">
          {accorder(t.consigne, { date: dateDuLivre(consigneLe, { locale: config.locale, fuseau: config.calendrier.fuseau, mois: config.calendrier.mois }) })}
        </p>
      )}
      {!compact &&
        config.credits.map((c) => (
          <p key={c} className="colophon">
            {c}
          </p>
        ))}
    </div>
  )
}

function TeteRegistre({ page, ctx, compact }: { page: PageRegistre; ctx: Ctx; compact: boolean }) {
  const t = ctx.livre.config.textes.rechercheLocale
  const sceaux = page.sceaux.filter((s) => s.legende)
  return (
    <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={ctx.livre.icones[page.icone]} compact={compact}>
      {!compact && page.resume && <p className="intro lettrine">{page.resume}</p>}
      <label className="recherche-locale">
        <Plume className="plume" />
        <input
          type="search"
          value={ctx.interactif ? ctx.locale : ''}
          readOnly={!ctx.interactif}
          tabIndex={ctx.interactif ? 0 : -1}
          onChange={(e) => ctx.setLocale?.(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && ctx.setLocale?.('')}
          placeholder={t.placeholder}
          aria-label={accorder(t.aide, { titre: page.titre })}
        />
      </label>
      {!compact && (
        <>
          {page.decompte && <p className="decompte">{page.decompte}</p>}
          {page.legende.length > 0 && (
            <dl className="legende">
              {page.legende.map((l) => (
                <div key={l.terme}>
                  <dt>{l.terme}</dt>
                  <dd>{l.definition}</dd>
                </div>
              ))}
            </dl>
          )}
          {sceaux.length > 0 && (
            <div className="legende-sceaux">
              {sceaux.map((s) => (
                <span key={s.cle}>
                  <GlypheSceau sceau={s} icones={ctx.livre.icones} /> {s.libelle}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </EnTete>
  )
}

/** Small engraved action at the foot of an unlocked private section's pages: seals it again. */
function Resceller({ page, ctx }: { page: Page; ctx: Ctx }) {
  const router = useRouter()
  const [fait, setFait] = useState(false)
  const section = sectionDe(ctx, page)
  if (!section?.prive || !section.ouverte || !section.serrure) return null
  return (
    <button
      type="button"
      className="resceller"
      tabIndex={ctx.interactif ? 0 : -1}
      disabled={fait || !ctx.interactif}
      title={section.serrure.aideResceller}
      onClick={async () => {
        setFait(true)
        await fetch(`/api/section?section=${encodeURIComponent(section.id)}`, { method: 'DELETE' }).catch(() => null)
        router.refresh()
      }}
    >
      <Icone corps={ctx.livre.icones[ICONE_RESCELLER]} className="resceller-icone" />
      <span>{section.serrure.resceller}</span>
    </button>
  )
}

/* ───────────────────────────── Right pages ───────────────────────────── */

export function PageDroite({ page, ctx, integre = false }: { page: Page; ctx: Ctx; integre?: boolean }) {
  const corps = (() => {
    switch (page.type) {
      case 'sommaire':
        return (
          <>
            <TableDesMatieres ctx={ctx} />
            <CitationFin texte={page.citation} />
          </>
        )
      case 'registre':
        return <ListeRegistre page={page} ctx={ctx} />
      case 'notes':
        return (
          <>
            <div className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
            <CitationFin texte={page.citation} />
          </>
        )
      case 'a-venir':
        return (
          <div className="attente">
            <div className="griffonnages" aria-hidden>
              <span /><span /><span /><span /><span />
            </div>
            <p>{page.attente}</p>
            <CitationFin texte={page.citation} />
          </div>
        )
      case 'scellee':
        return <SerrureSection page={page} ctx={ctx} />
    }
  })()
  if (integre) return corps
  return (
    <div className="contenu droite-contenu" style={teinte(ctx, page)}>
      <Defile ctx={ctx}>{corps}</Defile>
      <Folio n={rang(ctx) * 2 + 2} />
    </div>
  )
}

/** Single page for narrow screens: the left page condensed above the right page. */
export function PageUnique({ page, ctx }: { page: Page; ctx: Ctx }) {
  return (
    <div className="contenu unique-contenu" style={teinte(ctx, page)}>
      <Defile ctx={ctx}>
        <PageGauche page={page} ctx={ctx} compact />
        <PageDroite page={page} ctx={ctx} integre />
        <Resceller page={page} ctx={ctx} />
        <Folio n={rang(ctx) + 1} />
      </Defile>
    </div>
  )
}

function TableDesMatieres({ ctx }: { ctx: Ctx }) {
  const { sections, pages, config } = ctx.livre
  const avant = avantSommaire(pages)
  return (
    <nav className="table-matieres" aria-label={config.sommaire.tableDesMatieres}>
      <h3 className="titre-table">{config.sommaire.tableDesMatieres}</h3>
      {config.sommaire.sousTitre && <div className="sous-titre sous-titre-table">{config.sommaire.sousTitre}</div>}
      {sections
        .filter((s) => s.id !== 'sommaire')
        .map((section) => (
          <section key={section.id}>
            <h4 style={{ color: section.couleur }}>{section.titre}</h4>
            {section.sousTitre && <div className="sous-titre-section">{section.sousTitre}</div>}
            <ol>
              {pages.map((p, i) =>
                p.section !== section.id ? null : (
                  <li key={p.id}>
                    <button type="button" tabIndex={ctx.interactif ? 0 : -1} onClick={() => ctx.aller?.(i)}>
                      <span className="entree">{p.titre}</span>
                      <span className="points" />
                      <span className="renvoi">{i >= avant ? romain((i - avant) * 2 + 1) : ''}</span>
                    </button>
                  </li>
                ),
              )}
            </ol>
          </section>
        ))}
    </nav>
  )
}

function ListeRegistre({ page, ctx }: { page: PageRegistre; ctx: Ctx }) {
  // The list shown lags behind the query: the old ink fades, then the page is rewritten.
  const [montre, setMontre] = useState({ requete: ctx.requete, locale: ctx.locale })
  const [efface, setEfface] = useState(false)
  const [generation, setGeneration] = useState(0)
  const liste = useRef<HTMLDivElement>(null)
  const vides = ctx.livre.config.textes.rechercheLocale.vides

  useEffect(() => {
    if (!ctx.interactif) return
    if (montre.requete === ctx.requete && montre.locale === ctx.locale) {
      setEfface(false)
      return
    }
    setEfface(true)
    const t = setTimeout(() => {
      setMontre({ requete: ctx.requete, locale: ctx.locale })
      setEfface(false)
      setGeneration((g) => g + 1)
    }, EFFACEMENT_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.requete, ctx.locale, ctx.interactif])

  const filtres = page.lignes.filter((l) => ligneCorrespond(l, montre.requete) && ligneCorrespond(l, montre.locale))
  const requetes = [montre.requete, montre.locale].filter(Boolean)

  useEffect(() => {
    if (!ctx.interactif || !ctx.cible || !liste.current) return
    const el = liste.current.querySelector<HTMLElement>(`[data-ligne="${ctx.cible}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [ctx.cible, ctx.interactif, generation])

  // Grid: [stamp] label, dot leaders, then one track per value column (widths from the page's config).
  const avecSceau = page.sceaux.length > 0
  const grille = (etroit: boolean) =>
    `${avecSceau ? (etroit ? '16px ' : '22px ') : ''}minmax(0, max-content) minmax(${etroit ? 6 : 18}px, 1fr)${page.colonnes
      .map((c) => ` ${etroit ? c.largeurEtroite : c.largeur}px`)
      .join('')}`
  const finLibelle = avecSceau ? 4 : 3
  const style = { '--grille': grille(false), '--grille-etroite': grille(true) } as CSSProperties

  return (
    <div className="registre" style={style}>
      <div className="registre-entete" role="row">
        <span className="col-libelle" style={{ gridColumn: `1 / ${finLibelle}` }}>
          <span className="long">{page.titreLibelle}</span>
          <span className="court">{page.courtLibelle}</span>
        </span>
        {page.colonnes.map((c, k) => (
          <span key={k} className="col-valeur">
            <span className="long">{c.titre}</span>
            <span className="court">{c.court}</span>
          </span>
        ))}
      </div>
      <div ref={liste} key={generation} className={`registre-corps ${efface ? 'efface' : ''}`}>
        {filtres.map((l, i) => (
          <div
            key={l.id}
            data-ligne={l.id}
            className={`ligne ${generation > 0 ? 'ecrit' : ''} ${ctx.cible === l.id ? 'cible' : ''} ${l.detail ? 'avec-detail' : ''} ${ctx.fiche === l.id ? 'epinglee' : ''}`}
            style={{ '--i': Math.min(i, 16) } as CSSProperties}
            {...(l.detail && ctx.ouvrirFiche
              ? {
                  role: 'button',
                  tabIndex: ctx.interactif ? 0 : -1,
                  title: ctx.livre.config.textes.fiche?.aide,
                  'aria-expanded': ctx.fiche === l.id,
                  onClick: () => ctx.ouvrirFiche?.(l.id),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return
                    e.preventDefault()
                    ctx.ouvrirFiche?.(l.id)
                  },
                }
              : {})}
          >
            {avecSceau && <GlypheSceau sceau={page.sceaux.find((s) => s.cle === l.sceau)} icones={ctx.livre.icones} />}
            <div className="noms">
              <span className="nom-fr">
                <Surligne texte={l.libelle} requetes={requetes} />
                {l.detail && <span className="epingle-detail" aria-hidden />}
              </span>
              {l.libelle2 && <span className="nom-en"><Surligne texte={l.libelle2} requetes={requetes} /></span>}
              {l.notes.map((n, k) => (
                <span key={k} className="note-article">
                  <Surligne texte={n} requetes={requetes} />
                </span>
              ))}
            </div>
            <span className="points-conduite" aria-hidden />
            {l.vide ? (
              <span className="si-vide" style={{ gridColumn: `${finLibelle} / -1` }}>
                {page.siVide}
              </span>
            ) : (
              page.colonnes.map((c, k) => (
                <span key={k} className={`valeur valeur-${c.genre} ton-${c.ton}`}>
                  {c.genre === 'texte' ? <Surligne texte={l.valeurs[k]} requetes={requetes} /> : l.valeurs[k]}
                </span>
              ))
            )}
          </div>
        ))}
        {filtres.length === 0 && <p className={`vide ${generation > 0 ? 'ecrit' : ''}`}>{vides[requetes.join('').length % vides.length]}</p>}
      </div>
      {page.pied && <p className="registre-pied">{page.pied}</p>}
      <CitationFin texte={page.citation} />
    </div>
  )
}

/* ───────────────────────────── Sealed pages ───────────────────────────── */

type EtatSerrure = 'repos' | 'essai' | 'refus' | 'ouvert'

/**
 * A page of a private section the reader has not unlocked: the same iron lock and key as the cover.
 * The right word sets the section's signed cookie; the page then asks the server for the book again,
 * which now sends the section's real pages.
 */
function SerrureSection({ page, ctx }: { page: PageScellee; ctx: Ctx }) {
  const router = useRouter()
  const section = sectionDe(ctx, page)
  const t = section?.serrure
  const [motDePasse, setMotDePasse] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [etat, setEtat] = useState<EtatSerrure>('repos')
  const champ = useRef<HTMLInputElement>(null)
  if (!section || !t) return null

  const tourner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (etat !== 'repos' || !ctx.interactif) return
    if (!motDePasse.trim()) {
      champ.current?.focus()
      return
    }
    setEtat('essai')
    setMessage(null)
    const [rep] = await Promise.all([
      fetch('/api/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: section.id, motDePasse }),
      }).catch(() => null),
      new Promise((r) => setTimeout(r, 500)), // let the key reach the lock
    ])
    if (rep?.ok) {
      setEtat('ouvert')
      setTimeout(() => router.refresh(), 950)
      return
    }
    const corps = rep ? ((await rep.json().catch(() => ({}))) as { message?: string }) : {}
    setEtat('refus')
    setMessage(corps.message || t.coincee)
    setTimeout(() => {
      setEtat('repos')
      champ.current?.select()
    }, 900)
  }

  return (
    <div className={`serrure-section etat-${etat}`}>
      <div className="serrure-section-scene">
        <div className="serrure-section-plaque">
          <Serrure />
        </div>
        <div className="serrure-section-fourreau">
          <form className="cle" onSubmit={tourner}>
            <Cle />
            <input
              ref={champ}
              className="cle-tige"
              type="password"
              value={ctx.interactif ? motDePasse : ''}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder={t.placeholder}
              autoComplete="off"
              readOnly={!ctx.interactif}
              tabIndex={ctx.interactif ? 0 : -1}
              disabled={etat !== 'repos'}
              aria-label={t.aide}
            />
            <button type="submit" className="cle-anneau" title={t.tourner} aria-label={t.tourner} tabIndex={ctx.interactif ? 0 : -1} disabled={etat !== 'repos'} />
          </form>
        </div>
      </div>
      <p className="serrure-section-message" role="status">
        {message}
      </p>
      <CitationFin texte={t.citation} />
    </div>
  )
}
