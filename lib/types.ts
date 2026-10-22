/* Shapes of the book as sent to the browser. Built by lib/contenu.ts from content/. */

import type { Config } from './config'

export type TextesSectionPrivee = Config['sectionPrivee']

/** One section of the book = one ribbon. The generated title page has its own section (`sommaire`). */
export type Section = {
  id: string
  titre: string
  /** Line under the section's title in the table of contents (e.g. its name in another language). */
  sousTitre: string
  court: string
  couleur: string
  icone: string
  /** Private section (its pages are sealed until the right word is given). */
  prive: boolean
  /** Private section the reader has unlocked (offers the "re-seal" action). */
  ouverte: boolean
  /** Lock wording of a private section. */
  serrure: TextesSectionPrivee | null
}

/**
 * `icone` is a game-icons.net name, resolved to its SVG body in `Livre.icones`. `sousTitre`: the line in
 * italics under the page title (e.g. its name in another language), empty for none.
 */
type Base = { id: string; section: string; titre: string; sousTitre: string; court: string; icone: string; surtitre: string }

/** Value of the stamp column of a ledger (e.g. the craftsman's guild). */
export type Sceau = { cle: string; libelle: string; icone: string; couleur: string; legende: boolean }

/** A displayed value column of a ledger, resolved for rendering. */
export type ColonneAffichee = {
  titre: string
  court: string
  genre: 'prix' | 'fourchette' | 'texte'
  ton: 'normal' | 'pale' | 'rouge'
  largeur: number
  largeurEtroite: number
}

/** A ledger row, formatted on the server. */
export type Ligne = {
  id: string
  sceau: string | null
  libelle: string
  libelle2: string
  notes: string[]
  /** One formatted cell per value column. */
  valeurs: string[]
  /** Every value cell watched by `siVide` is empty: the row shows the page's `siVide` wording instead. */
  vide: boolean
  /** Longer note of the row (`detail` column), as HTML: touching the row opens it on a pinned slip. Empty for none. */
  detail: string
  /** Haystack for the searches. */
  texte: string
}

export type PageSommaire = Base & { type: 'sommaire'; citation: string }
export type PageNotes = Base & {
  type: 'notes'
  resume: string
  auteur: string
  /** Saying under the summary on the left page, and who said it. */
  dicton: string
  dictonAuteur: string
  html: string
  citation: string
  texte: string
}
export type PageRegistre = Base & {
  type: 'registre'
  resume: string
  titreLibelle: string
  courtLibelle: string
  colonnes: ColonneAffichee[]
  lignes: Ligne[]
  sceaux: Sceau[]
  siVide: string
  legende: { terme: string; definition: string }[]
  decompte: string
  pied: string
  citation: string
}
export type PageAVenir = Base & { type: 'a-venir'; resume: string; attente: string; citation: string }
/** A page of a private section the reader has not unlocked: only its title, label and icon are sent. */
export type PageScellee = Base & { type: 'scellee' }
/**
 * The book's last leaf, « Achevé de copier »: colophon and credits (livre.json "colophon", defaults in
 * lib/credits.ts). Back matter: in the title page's section (no ribbon of its own), no chapter number,
 * listed last in the contents; on it, its own tab only.
 */
export type PageColophon = Base & {
  type: 'colophon'
  intro: string
  suite: string[]
  signature: string
  citation: string
  rubriques: { titre: string; texte: string }[]
}

export type Page = PageSommaire | PageNotes | PageRegistre | PageAVenir | PageScellee | PageColophon

export type Embleme = { viewBox: string; d: string }

export type Livre = {
  config: Config
  sections: Section[]
  pages: Page[]
  consigneLe: string
  embleme: Embleme
  icones: Record<string, string>
}
