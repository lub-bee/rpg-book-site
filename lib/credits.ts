/*
 * Default wording of the book's last leaf, « Achevé de copier » (livre.json "colophon", read by lib/config.ts).
 * Every key can be overridden in livre.json; these defaults only fill what a book leaves out, in the book's
 * language ("langue": French or English, English for any other).
 *
 * `moteur` credits what the template itself ships: the game-icons.net icons (CC BY 3.0), the Poly Haven
 * photo textures (CC0) and the Google Fonts typefaces (SIL OFL). A book that replaces the textures or the
 * fonts turns them off ("creditsMoteur": false) and writes its own "rubriques". The same facts are in
 * README.md (« Credits & licenses ») and NOTICE.md.
 */

export type Rubrique = { titre: string; texte: string }

export type TextesColophon = {
  titre: string
  sousTitre: string
  court: string
  surtitre: string
  /** First paragraph of the left page (illuminated initial). `{titre}` = the book's title. */
  intro: string
  signature: string
  citation: string
  /** Credits of the engine's own third-party assets, shown first on the right page. */
  moteur: Rubrique[]
}

const FR: TextesColophon = {
  titre: 'Achevé de copier',
  sousTitre: 'Colophon & crédits',
  court: 'Achevé',
  surtitre: 'Dernier feuillet',
  intro: 'Ici s’achève la copie de « {titre} ». Voici ceux qui ont prêté au copiste leurs gravures, leurs cuirs et leurs caractères.',
  signature: '',
  citation: 'Ce qui est copié avec soin ne se perd jamais tout à fait.',
  moteur: [
    {
      titre: 'Gravures',
      texte: 'Les petites gravures des onglets, des rubans et des marges viennent de game-icons.net (Lorc, Delapouite et leurs compagnons), sous licence CC BY 3.0.',
    },
    {
      titre: 'Bois, cuir et fer',
      texte: 'La table, le cuir de la reliure et le fer des serrures sont des photographies de Poly Haven (wood_table, brown_leather, rusty_metal_04), versées au domaine public (CC0).',
    },
    {
      titre: 'Caractères',
      texte: 'UnifrakturMaguntia, IM Fell English et IM Fell English SC : sous SIL Open Font License, servis par Google Fonts.',
    },
  ],
}

const EN: TextesColophon = {
  titre: 'Colophon',
  sousTitre: 'Credits',
  court: 'Colophon',
  surtitre: 'Last leaf',
  intro: 'Here ends the copy of “{titre}”. These are the hands that lent the copyist their engravings, their leather and their type.',
  signature: '',
  citation: 'What is copied with care is never wholly lost.',
  moteur: [
    {
      titre: 'Engravings',
      texte: 'The small engravings of the tabs, ribbons and margins come from game-icons.net (Lorc, Delapouite and contributors), under the CC BY 3.0 license.',
    },
    {
      titre: 'Wood, leather and iron',
      texte: 'The table, the binding’s leather and the iron of the locks are photographs from Poly Haven (wood_table, brown_leather, rusty_metal_04), dedicated to the public domain (CC0).',
    },
    {
      titre: 'Type',
      texte: 'UnifrakturMaguntia, IM Fell English and IM Fell English SC: under the SIL Open Font License, served by Google Fonts.',
    },
  ],
}

/** Defaults for a book language (`fr`, `fr-CA`… → French; anything else → English). */
export function colophonParDefaut(langue: string): TextesColophon {
  return /^fr\b/i.test(langue) ? FR : EN
}
