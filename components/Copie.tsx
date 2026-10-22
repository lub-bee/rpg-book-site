'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import type { Livre, Page, PageRegistre } from '@/lib/types'
import { accorder, romain } from '@/lib/format'
import { CitationFin, Dicton, EnTete, Frontispice, type Ctx } from './Pages'
import { Fleuron, GlypheSceau } from './Ornements'
import { DosCouverture, FaceCouverture } from './Couverture'

/**
 * The whole book laid out as a printable A4 document (livre.json "modules.copie"): leather front board,
 * title page, contents, every page in the book's order, back board. On load it waits for fonts and
 * textures, then opens the print dialog ("Save as PDF" is the export). It is given the reader's view of
 * the book: a private section the reader has not unlocked is copied sealed, its content never sent.
 */
export default function Copie({ livre }: { livre: Livre }) {
  const { config, embleme } = livre
  const copie = config.modules.copie!
  const lance = useRef(false)

  useEffect(() => {
    if (lance.current) return
    lance.current = true
    const images = Array.from(document.images).filter((img) => !img.complete)
    // The covers' textures are CSS backgrounds and SVG filter images, invisible to document.images.
    const textures = [copie.cuir, '/textures/fer.jpg', '/textures/parchemin-impression.jpg'].map((src) => {
      const img = new Image()
      img.src = src
      return img.decode().catch(() => {})
    })
    Promise.all([document.fonts.ready, ...textures, ...images.map((img) => new Promise((r) => (img.onload = img.onerror = r)))]).then(() =>
      // Two frames so the layout with the loaded fonts is painted before printing.
      requestAnimationFrame(() => requestAnimationFrame(() => window.print())),
    )
  }, [copie.cuir])

  const ctx: Ctx = { livre, index: 0, interactif: false, requete: '', locale: '' }
  const sommaire = livre.pages.find((p) => p.type === 'sommaire')
  const cuir = { '--texture-cuir': `url("${copie.cuir}")` } as CSSProperties

  return (
    <div className="copie">
      <nav className="copie-retour">
        <a href="/">❧ {copie.retour}</a>
        <button type="button" onClick={() => window.print()}>
          {copie.recopier}
        </button>
      </nav>

      <section className="copie-couverture" aria-hidden>
        <div className="couverture-imprimee" style={cuir}>
          <FaceCouverture titre={config.couverture.titre} embleme={embleme} serrure={config.acces === 'prive'} />
        </div>
      </section>

      <section className="feuille feuille-titre" style={teinte(livre, 'sommaire')}>
        <Frontispice ctx={ctx} compact={false} />
      </section>

      <section className="feuille" style={teinte(livre, 'sommaire')}>
        <header className="en-tete">
          <h2 className="titre-page">{config.sommaire.tableDesMatieres}</h2>
          {config.sommaire.sousTitre && <div className="sous-titre">{config.sommaire.sousTitre}</div>}
          <Fleuron />
        </header>
        <SommaireCopie livre={livre} />
        {sommaire?.type === 'sommaire' && <CitationFin texte={sommaire.citation} />}
      </section>

      {livre.pages.map((page) => (
        <PageCopie key={page.id} page={page} livre={livre} />
      ))}

      {copie.fin && (
        <p className="copie-fin">
          <Fleuron />
          {copie.fin}
        </p>
      )}

      <section className="copie-couverture copie-dos" aria-hidden>
        <div className="couverture-imprimee" style={cuir}>
          <DosCouverture embleme={embleme} />
        </div>
      </section>
    </div>
  )
}

/** One page of the book, as its sheet(s) of the copy. */
function PageCopie({ page, livre }: { page: Page; livre: Livre }) {
  const icone = livre.icones[page.icone]
  const section = livre.sections.find((s) => s.id === page.section)
  switch (page.type) {
    case 'sommaire':
      return null
    case 'registre':
      return <RegistreCopie page={page} livre={livre} />
    case 'notes':
      return (
        <section id={page.id} className="feuille" style={teinte(livre, page.section)}>
          <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={icone}>
            {page.resume && <p className="intro">{page.resume}</p>}
            {page.auteur && <p className="signature">{accorder(livre.config.textes.signature, { auteur: page.auteur })}</p>}
            <Dicton texte={page.dicton} auteur={page.dictonAuteur} />
          </EnTete>
          <div className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
          <CitationFin texte={page.citation} />
        </section>
      )
    case 'a-venir':
      return (
        <section id={page.id} className="feuille" style={teinte(livre, page.section)}>
          <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={icone}>
            {page.resume && <p className="intro">{page.resume}</p>}
          </EnTete>
          <p className="copie-attente">{page.attente}</p>
          <CitationFin texte={page.citation} />
        </section>
      )
    case 'scellee':
      // Only what the grimoire shows of a sealed page: its title and the lock's wording.
      return (
        <section id={page.id} className="feuille copie-scellee" style={teinte(livre, page.section)}>
          <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={icone}>
            {section?.serrure?.intro && <p className="intro">{section.serrure.intro}</p>}
          </EnTete>
          {section?.serrure && <CitationFin texte={section.serrure.citation} />}
        </section>
      )
  }
}

const teinte = (livre: Livre, section: string) => ({ '--teinte': livre.sections.find((s) => s.id === section)?.couleur } as CSSProperties)

/** Contents of the copy: every page of every section, linked to its sheet, numbered within its section. */
function SommaireCopie({ livre }: { livre: Livre }) {
  return (
    <nav className="table-matieres copie-sommaire">
      {livre.sections
        .filter((s) => s.id !== 'sommaire')
        .map((section) => (
          <section key={section.id}>
            <h4 style={{ color: section.couleur }}>{section.titre}</h4>
            {section.sousTitre && <div className="sous-titre-section">{section.sousTitre}</div>}
            <ol>
              {livre.pages
                .filter((p) => p.section === section.id)
                .map((p, k) => (
                  <li key={p.id}>
                    <a href={`#${p.id}`}>
                      <span className="renvoi">{romain(k + 1).toUpperCase()}.</span>
                      <span className="entree">{p.titre}</span>
                      <span className="points" />
                    </a>
                  </li>
                ))}
            </ol>
          </section>
        ))}
    </nav>
  )
}

/** A ledger as a real table, so that the printed header repeats on every sheet it spans. */
function RegistreCopie({ page, livre }: { page: PageRegistre; livre: Livre }) {
  const avecSceau = page.sceaux.length > 0
  const sceaux = page.sceaux.filter((s) => s.legende)
  return (
    <section id={page.id} className="feuille" style={teinte(livre, page.section)}>
      <EnTete surtitre={page.surtitre} titre={page.titre} sousTitre={page.sousTitre} icone={livre.icones[page.icone]}>
        {page.resume && <p className="intro lettrine">{page.resume}</p>}
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
      </EnTete>

      <table className="copie-registre-table">
        <thead>
          <tr>
            <th className="col-libelle" colSpan={avecSceau ? 2 : 1}>
              {page.titreLibelle}
            </th>
            {page.colonnes.map((c, k) => (
              <th key={k}>{c.titre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {page.lignes.map((l) => (
            <tr key={l.id}>
              {avecSceau && (
                <td className="col-glyphe">
                  <GlypheSceau sceau={page.sceaux.find((s) => s.cle === l.sceau)} icones={livre.icones} />
                </td>
              )}
              <td className="noms">
                <span className="copie-nom">
                  <span className="nom-fr">{l.libelle}</span>
                  <span className="points-conduite" aria-hidden />
                </span>
                {l.libelle2 && <span className="nom-en">{l.libelle2}</span>}
                {l.notes.map((n, k) => (
                  <span key={k} className="note-article">
                    {n}
                  </span>
                ))}
              </td>
              {l.vide ? (
                <td className="si-vide" colSpan={Math.max(1, page.colonnes.length)}>
                  {page.siVide}
                </td>
              ) : (
                page.colonnes.map((c, k) => (
                  <td key={k} className={`valeur valeur-${c.genre} ton-${c.ton}`} style={{ width: `${c.largeur + 14}px` }}>
                    {l.valeurs[k]}
                  </td>
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {page.pied && <p className="registre-pied">{page.pied}</p>}
      {sceaux.length > 0 && (
        <div className="legende-sceaux">
          {sceaux.map((s) => (
            <span key={s.cle}>
              <GlypheSceau sceau={s} icones={livre.icones} /> {s.libelle}
            </span>
          ))}
        </div>
      )}
      <CitationFin texte={page.citation} />
    </section>
  )
}
