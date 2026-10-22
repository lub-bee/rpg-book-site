/* content/livre.json: identity, access, look and every visible string of the book.
   Imported statically (works in the edge middleware too) and validated once. */

import brut from '@/content/livre.json'
import { Controle, type Obj } from './controle'

export type TextesSerrure = {
  /** Text inside the key-shaped field. */
  placeholder: string
  /** Accessible name of the field. */
  aide: string
  /** Tooltip of the key's bow (the submit button). */
  tourner: string
  /** Wrong word. */
  refus: string
  /** Network failure. */
  coincee: string
  /** The password (or the secret) is not configured on the server. */
  nonForgee: string
}

export type Config = {
  titre: string
  sousTitre: string
  devise: string
  langue: string
  locale: string
  acces: 'public' | 'prive'
  onglet: { titre: string; description: string }
  embleme: { fichier: string; rotationEntete: number }
  apparence: {
    table: string
    cuir: string
    voileCuir: string[]
    dorure: string[]
    couleurs: Record<string, string>
    /** The emblem blind-pressed into every page (off when null): opacity of the relief, 0 to 1. */
    gaufrage: { intensite: number; registres: number } | null
  }
  couverture: { titre: string; salut: string; invite: string; onglet: string; ouvrir: string }
  serrure: TextesSerrure
  sectionPrivee: TextesSerrure & { intro: string; citation: string; resceller: string; aideResceller: string }
  pageDeTitre: { surTitre: string; texte: string; consigne: string }
  calendrier: { fuseau: string; mois: string[] }
  sommaire: { titre: string; court: string; couleur: string; icone: string; tableDesMatieres: string; sousTitre: string; citation: string }
  textes: {
    recherche: {
      placeholder: string
      aide: string
      effacer: string
      trouvailles: string
      rien: string
      mentions: string
      lignes: string
      autres: string
      vide: string
    }
    rechercheLocale: { placeholder: string; aide: string; vides: string[] }
    signature: string
    refermer: { gravure: string; aide: string }
    coins: { precedente: string; suivante: string; aidePrecedente: string; aideSuivante: string }
    navigation: { rubans: string; onglets: string }
    /** Pinned slip (a ledger row's `detail`): the "put it away" action and the rows' tooltip. Null when not given. */
    fiche: { ranger: string; aide: string } | null
  }
  /** Optional modules: null = off. */
  modules: {
    /** Printable copy of the book (/copie), saved as a PDF by the browser. */
    copie: {
      titre: string
      aide: string
      icone: string
      retour: string
      recopier: string
      fin: string
      /** Leather photo of the printed covers (a lighter file keeps the PDF small). */
      cuir: string
    } | null
  }
  egare: { titre: string; texte: string; retour: string }
  credits: string[]
}

/** Palette keys of `apparence.couleurs` and the CSS variables they set. */
export const COULEURS_CSS: Record<string, string> = {
  table: '--table',
  cuir: '--cuir',
  cuirClair: '--cuir-clair',
  cuirSombre: '--cuir-sombre',
  or: '--or',
  orPale: '--or-pale',
  parchemin: '--parchemin',
  encre: '--encre',
  encreDouce: '--encre-douce',
  encrePale: '--encre-pale',
  encreRouge: '--encre-rouge',
}

function serrure(c: Controle, o: Obj, chemin: string, base?: TextesSerrure): TextesSerrure {
  return {
    placeholder: c.texte(o, 'placeholder', chemin, base?.placeholder),
    aide: c.texte(o, 'aide', chemin, base?.aide),
    tourner: c.texte(o, 'tourner', chemin, base?.tourner),
    refus: c.texte(o, 'refus', chemin, base?.refus),
    coincee: c.texte(o, 'coincee', chemin, base?.coincee),
    nonForgee: c.texte(o, 'nonForgee', chemin, base?.nonForgee),
  }
}

/** Lock wording of a private section: `section.json` "serrure" overrides livre.json "sectionPrivee". */
export function serrureSection(c: Controle, o: Obj, chemin: string, base: Config['sectionPrivee']): Config['sectionPrivee'] {
  return {
    ...serrure(c, o, chemin, base),
    intro: c.texte(o, 'intro', chemin, base.intro),
    citation: c.texte(o, 'citation', chemin, base.citation),
    resceller: c.texte(o, 'resceller', chemin, base.resceller),
    aideResceller: c.texte(o, 'aideResceller', chemin, base.aideResceller),
  }
}

function lire(v: unknown): Config {
  const c = new Controle('content/livre.json')
  const r = c.objet(v, '')

  const onglet = c.objet(r.onglet, 'onglet')
  const embleme = c.objet(r.embleme, 'embleme')
  const apparence = c.objet(r.apparence, 'apparence')
  const couleurs = c.objet(apparence.couleurs, 'apparence.couleurs', true)
  for (const k of Object.keys(couleurs)) {
    if (!COULEURS_CSS[k]) c.erreur(`apparence.couleurs.${k}`, `is not a palette key (known: ${Object.keys(COULEURS_CSS).join(', ')})`)
    else if (typeof couleurs[k] !== 'string') c.erreur(`apparence.couleurs.${k}`, 'must be a CSS colour text')
  }
  const couverture = c.objet(r.couverture, 'couverture')
  const pageDeTitre = c.objet(r.pageDeTitre, 'pageDeTitre')
  const calendrier = c.objet(r.calendrier, 'calendrier', true)
  const sommaire = c.objet(r.sommaire, 'sommaire')
  const textes = c.objet(r.textes, 'textes')
  const recherche = c.objet(textes.recherche, 'textes.recherche')
  const rechercheLocale = c.objet(textes.rechercheLocale, 'textes.rechercheLocale')
  const refermer = c.objet(textes.refermer, 'textes.refermer')
  const coins = c.objet(textes.coins, 'textes.coins')
  const navigation = c.objet(textes.navigation, 'textes.navigation')
  const egare = c.objet(r.egare, 'egare')
  const modules = c.objet(r.modules, 'modules', true)
  const sectionPrivee = c.objet(r.sectionPrivee, 'sectionPrivee')

  const dorure = c.textes(apparence, 'dorure', 'apparence')
  if (dorure.length !== 4) c.erreur('apparence.dorure', 'must list exactly 4 colours (highlight, light gold, dark gold, reflected light)')
  const voileCuir = c.textes(apparence, 'voileCuir', 'apparence', ['rgba(70, 24, 8, 0.3)', 'rgba(36, 10, 3, 0.42)'])
  if (voileCuir.length !== 2) c.erreur('apparence.voileCuir', 'must list exactly 2 colours (top and bottom of the tint laid over the leather)')
  const mois = c.textes(calendrier, 'mois', 'calendrier', [])

  // Optional switches: absent or false = off; true or an object = on (an object may tune it).
  const active = (v: unknown, chemin: string): Obj | null => {
    if (v === undefined || v === false) return null
    if (v === true) return {}
    return c.objet(v, chemin)
  }
  const g = active(apparence.gaufrage, 'apparence.gaufrage')
  const gaufrage = g && { intensite: c.nombre(g, 'intensite', 'apparence.gaufrage', 0.7), registres: c.nombre(g, 'registres', 'apparence.gaufrage', 0.45) }
  for (const k of ['intensite', 'registres'] as const) {
    if (gaufrage && (gaufrage[k] < 0 || gaufrage[k] > 1)) c.erreur(`apparence.gaufrage.${k}`, 'must be between 0 and 1')
  }
  const fiche = textes.fiche === undefined ? null : c.objet(textes.fiche, 'textes.fiche')
  const copie = active(modules.copie, 'modules.copie')
  if (mois.length && mois.length !== 12) c.erreur('calendrier.mois', 'must list the 12 month names (or be left out)')

  const credits = c.textes(r, 'credits', '')
  if (!credits.some((x) => /game-icons/i.test(x))) {
    c.erreur('credits', 'must credit game-icons.net (the icons are CC BY 3.0: attribution is required)')
  }

  const serrureLivre = serrure(c, c.objet(r.serrure, 'serrure'), 'serrure')
  const config: Config = {
    titre: c.texte(r, 'titre', ''),
    sousTitre: c.texte(r, 'sousTitre', ''),
    devise: c.texte(r, 'devise', ''),
    langue: c.texte(r, 'langue', '', 'fr'),
    locale: c.texte(r, 'locale', '', 'fr-FR'),
    acces: c.choix(r, 'acces', '', ['public', 'prive'] as const),
    onglet: { titre: c.texte(onglet, 'titre', 'onglet'), description: c.texte(onglet, 'description', 'onglet', '') },
    embleme: { fichier: c.texte(embleme, 'fichier', 'embleme'), rotationEntete: c.nombre(embleme, 'rotationEntete', 'embleme', 0) },
    apparence: {
      table: c.texte(apparence, 'table', 'apparence'),
      cuir: c.texte(apparence, 'cuir', 'apparence'),
      voileCuir,
      dorure,
      couleurs: couleurs as Record<string, string>,
      gaufrage,
    },
    couverture: {
      titre: c.texte(couverture, 'titre', 'couverture'),
      salut: c.texte(couverture, 'salut', 'couverture'),
      invite: c.texte(couverture, 'invite', 'couverture', ''),
      onglet: c.texte(couverture, 'onglet', 'couverture'),
      ouvrir: c.texte(couverture, 'ouvrir', 'couverture'),
    },
    serrure: serrureLivre,
    sectionPrivee: {
      ...serrure(c, sectionPrivee, 'sectionPrivee', serrureLivre),
      intro: c.texte(sectionPrivee, 'intro', 'sectionPrivee'),
      citation: c.texte(sectionPrivee, 'citation', 'sectionPrivee', ''),
      resceller: c.texte(sectionPrivee, 'resceller', 'sectionPrivee'),
      aideResceller: c.texte(sectionPrivee, 'aideResceller', 'sectionPrivee'),
    },
    pageDeTitre: {
      surTitre: c.texte(pageDeTitre, 'surTitre', 'pageDeTitre', ''),
      texte: c.texte(pageDeTitre, 'texte', 'pageDeTitre', ''),
      consigne: c.texte(pageDeTitre, 'consigne', 'pageDeTitre', ''),
    },
    calendrier: { fuseau: c.texte(calendrier, 'fuseau', 'calendrier', 'UTC'), mois },
    sommaire: {
      titre: c.texte(sommaire, 'titre', 'sommaire'),
      court: c.texte(sommaire, 'court', 'sommaire'),
      couleur: c.texte(sommaire, 'couleur', 'sommaire'),
      icone: c.texte(sommaire, 'icone', 'sommaire'),
      tableDesMatieres: c.texte(sommaire, 'tableDesMatieres', 'sommaire'),
      sousTitre: c.texte(sommaire, 'sousTitre', 'sommaire', ''),
      citation: c.texte(sommaire, 'citation', 'sommaire', ''),
    },
    textes: {
      recherche: {
        placeholder: c.texte(recherche, 'placeholder', 'textes.recherche'),
        aide: c.texte(recherche, 'aide', 'textes.recherche'),
        effacer: c.texte(recherche, 'effacer', 'textes.recherche'),
        trouvailles: c.texte(recherche, 'trouvailles', 'textes.recherche'),
        rien: c.texte(recherche, 'rien', 'textes.recherche'),
        mentions: c.texte(recherche, 'mentions', 'textes.recherche'),
        lignes: c.texte(recherche, 'lignes', 'textes.recherche'),
        autres: c.texte(recherche, 'autres', 'textes.recherche'),
        vide: c.texte(recherche, 'vide', 'textes.recherche'),
      },
      rechercheLocale: {
        placeholder: c.texte(rechercheLocale, 'placeholder', 'textes.rechercheLocale'),
        aide: c.texte(rechercheLocale, 'aide', 'textes.rechercheLocale'),
        vides: c.textes(rechercheLocale, 'vides', 'textes.rechercheLocale'),
      },
      signature: c.texte(textes, 'signature', 'textes'),
      refermer: { gravure: c.texte(refermer, 'gravure', 'textes.refermer'), aide: c.texte(refermer, 'aide', 'textes.refermer') },
      coins: {
        precedente: c.texte(coins, 'precedente', 'textes.coins'),
        suivante: c.texte(coins, 'suivante', 'textes.coins'),
        aidePrecedente: c.texte(coins, 'aidePrecedente', 'textes.coins'),
        aideSuivante: c.texte(coins, 'aideSuivante', 'textes.coins'),
      },
      navigation: { rubans: c.texte(navigation, 'rubans', 'textes.navigation'), onglets: c.texte(navigation, 'onglets', 'textes.navigation') },
      fiche: fiche && { ranger: c.texte(fiche, 'ranger', 'textes.fiche'), aide: c.texte(fiche, 'aide', 'textes.fiche') },
    },
    modules: {
      copie: copie && {
        titre: c.texte(copie, 'titre', 'modules.copie'),
        aide: c.texte(copie, 'aide', 'modules.copie'),
        icone: c.texte(copie, 'icone', 'modules.copie', 'quill-ink'),
        retour: c.texte(copie, 'retour', 'modules.copie'),
        recopier: c.texte(copie, 'recopier', 'modules.copie'),
        fin: c.texte(copie, 'fin', 'modules.copie', ''),
        cuir: c.texte(copie, 'cuir', 'modules.copie', c.texte(apparence, 'cuir', 'apparence')),
      },
    },
    egare: { titre: c.texte(egare, 'titre', 'egare'), texte: c.texte(egare, 'texte', 'egare'), retour: c.texte(egare, 'retour', 'egare') },
    credits,
  }
  if (!config.textes.rechercheLocale.vides.length) c.erreur('textes.rechercheLocale.vides', 'must hold at least one line')
  c.verifier()
  return config
}

let cache: Config | null = null

export function config(): Config {
  return (cache ??= lire(brut as unknown))
}
