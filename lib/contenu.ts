import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'
import { parse as parserYaml } from 'yaml'
import { config, serrureSection, type Config } from './config'
import { Controle, type Obj } from './controle'
import { parserCsv } from './csv'
import { accorder, romain } from './format'
import { icones } from './icones'
import { normaliser } from './recherche'
import type { ColonneAffichee, Embleme, Ligne, Livre, Page, PageRegistre, Sceau, Section } from './types'

/*
 * Reads content/ into a Livre:
 *
 *   content/livre.json              identity, access, look, every visible string (lib/config.ts)
 *   content/<NN-section>/section.json   one folder = one section = one ribbon
 *   content/<NN-section>/<NN-page>.md   one file = one page (+ its thumb tab)
 *   content/<NN-section>/<name>.csv     data of the ledger pages
 *
 * Folders and files are ordered by name (numeric prefixes). Every problem found is reported at once,
 * with the file and the field, in one error.
 */

const CONTENU = path.join(process.cwd(), 'content')
const TYPES = ['notes', 'registre', 'a-venir'] as const
const ICONE_RESCELLER = 'padlock'

/** Server-side definition of a section (the page sources stay on the server). */
export type DefSection = Section & { motDePasseEnv: string }

export type LivreComplet = Livre & { defs: DefSection[] }

function slug(s: string): string {
  return normaliser(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const sansPrefixe = (nom: string) => nom.replace(/\.[a-z]+$/i, '').replace(/^\d+[-_ .]*/, '')
const ordre = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

function nombre(s: string | undefined): number | null {
  const t = (s ?? '').replace(/\s/g, '').replace(',', '.')
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function frontmatter(source: string, c: Controle): { meta: Obj; corps: string } {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) {
    c.erreur('', 'has no frontmatter (the file must start with a "---" block holding at least "type" and "titre")')
    return { meta: {}, corps: source }
  }
  try {
    return { meta: c.objet(parserYaml(m[1]) ?? {}, 'frontmatter'), corps: m[2] }
  } catch (e) {
    c.erreur('frontmatter', `is not valid YAML: ${(e as Error).message.split('\n')[0]}`)
    return { meta: {}, corps: m[2] }
  }
}

/** Reads the emblem SVG: its viewBox and every path, merged into one outline. */
function lireEmbleme(fichier: string, c: Controle): Embleme {
  const chemin = path.join(CONTENU, fichier)
  if (!fs.existsSync(chemin)) {
    c.erreur('embleme.fichier', `points to "content/${fichier}", which does not exist`)
    return { viewBox: '0 0 1 1', d: '' }
  }
  const svg = fs.readFileSync(chemin, 'utf8')
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1]
  const d = Array.from(svg.matchAll(/<path[^>]*\sd="([^"]+)"/g), (m) => m[1]).join(' ')
  if (!viewBox || !d) c.erreur('embleme.fichier', `content/${fichier} must be an SVG with a viewBox and at least one <path d="…"> (see README, "Emblem")`)
  return { viewBox: viewBox ?? '0 0 1 1', d }
}

/* ───────────────────────────── Ledgers ───────────────────────────── */

type Csv = { entete: string[]; lignes: string[][] }

function lireRegistre(
  base: { id: string; section: string; titre: string; court: string; icone: string; surtitre: string },
  meta: Obj,
  dossier: string,
  c: Controle,
  cfg: Config,
  csvs: Map<string, Csv>,
): PageRegistre {
  const donnees = c.texte(meta, 'donnees', '')
  const fichier = path.resolve(dossier, donnees)
  let csv: Csv = { entete: [], lignes: [] }
  if (donnees) {
    if (!fichier.startsWith(CONTENU + path.sep)) c.erreur('donnees', 'must point to a CSV file inside content/')
    else if (!fs.existsSync(fichier)) c.erreur('donnees', `points to "${path.relative(process.cwd(), fichier)}", which does not exist`)
    else {
      if (!csvs.has(fichier)) {
        const [entete = [], ...lignes] = parserCsv(fs.readFileSync(fichier, 'utf8'))
        csvs.set(fichier, { entete: entete.map((e) => e.trim()), lignes })
      }
      csv = csvs.get(fichier)!
    }
  }
  const nomCsv = donnees || 'the CSV'

  /** Index of a CSV column, by header name (case and accents ignored). Reports unknown columns. */
  const col = (nom: unknown, chemin: string): number => {
    if (typeof nom !== 'string' || !nom) {
      c.erreur(chemin, 'must name a CSV column')
      return -1
    }
    const i = csv.entete.findIndex((e) => normaliser(e) === normaliser(nom))
    if (i < 0 && csv.entete.length) c.erreur(chemin, `names the column "${nom}", which is not in ${nomCsv} (columns: ${csv.entete.join(', ')})`)
    return i
  }
  const cellule = (l: string[], i: number) => (i < 0 ? '' : (l[i] ?? '').trim())

  // Rows kept by the optional filter.
  let lignes = csv.lignes
  if (meta.filtre !== undefined) {
    const f = c.objet(meta.filtre, 'filtre')
    const i = col(f.colonne, 'filtre.colonne')
    const v = f.valeur
    const valeurs = (Array.isArray(v) ? v : [v]).map((x) => normaliser(String(x ?? '').trim()))
    if (v === undefined) c.erreur('filtre.valeur', 'is missing (the value, or list of values, a row must hold to appear on this page)')
    lignes = lignes.filter((l) => valeurs.includes(normaliser(cellule(l, i))))
  }

  // Stamp column (e.g. craftsman): one engraved glyph per row.
  let sceaux: Sceau[] = []
  let sceauDe: (l: string[]) => string | null = () => null
  if (meta.sceau !== undefined) {
    const s = c.objet(meta.sceau, 'sceau')
    const i = col(s.colonne, 'sceau.colonne')
    const valeurs = c.objet(s.valeurs, 'sceau.valeurs')
    const reconnaitre: Record<string, string[]> = {}
    sceaux = Object.entries(valeurs).map(([cle, v]) => {
      const o = c.objet(v, `sceau.valeurs.${cle}`)
      const ch = `sceau.valeurs.${cle}`
      reconnaitre[cle] = [cle, ...c.textes(o, 'reconnaitre', ch, [])].map(normaliser)
      return {
        cle,
        libelle: c.texte(o, 'libelle', ch),
        icone: c.texte(o, 'icone', ch),
        couleur: c.texte(o, 'couleur', ch, 'currentColor'),
        legende: c.booleen(o, 'legende', ch, true),
      }
    })
    const defaut = s.defaut === undefined ? null : c.texte(s, 'defaut', 'sceau')
    if (defaut !== null && !sceaux.some((x) => x.cle === defaut)) c.erreur('sceau.defaut', `must be one of the keys of sceau.valeurs (${sceaux.map((x) => x.cle).join(', ')})`)
    sceauDe = (l) => {
      const v = normaliser(cellule(l, i))
      if (v) for (const x of sceaux) if (reconnaitre[x.cle].some((m) => v.includes(m))) return x.cle
      return defaut
    }
  }

  // Columns. The first one is the label (name pair or text); "note" columns go under the label;
  // the others are value columns on the right.
  const defs = Array.isArray(meta.colonnes) ? meta.colonnes : []
  if (!Array.isArray(meta.colonnes) || !defs.length) c.erreur('colonnes', 'is missing (expected a list of columns, see README "registre")')
  const fmt = new Intl.NumberFormat(cfg.locale, { maximumFractionDigits: 2 })
  const prix = (v: number | null) => (v === null ? '—' : fmt.format(v))

  let libelle: (l: string[]) => [string, string] = () => ['', '']
  let titreLibelle = ''
  let courtLibelle = ''
  const notes: ((l: string[]) => string)[] = []
  const colonnes: ColonneAffichee[] = []
  const cellules: ((l: string[]) => { texte: string; nombres: (number | null)[] })[] = []
  const etendue: number[] = []
  const LARGEURS = { prix: 62, fourchette: 104, texte: 120 }

  defs.forEach((d, k) => {
    const ch = `colonnes[${k}]`
    const o = c.objet(d, ch)
    const type = c.choix(o, 'type', ch, ['nom', 'texte', 'note', 'prix', 'fourchette'] as const)
    if (k === 0) {
      if (type !== 'nom' && type !== 'texte') {
        c.erreur(`${ch}.type`, 'the first column is the row label: it must be "nom" or "texte"')
        return
      }
      titreLibelle = c.texte(o, 'titre', ch)
      courtLibelle = c.texte(o, 'court', ch, titreLibelle)
      if (type === 'nom') {
        const paire = Array.isArray(o.colonnes) ? o.colonnes : []
        if (paire.length < 1 || paire.length > 2) c.erreur(`${ch}.colonnes`, 'must list one or two CSV columns (main name, second name)')
        const [a, b] = [col(paire[0], `${ch}.colonnes[0]`), paire[1] === undefined ? -1 : col(paire[1], `${ch}.colonnes[1]`)]
        libelle = (l) => {
          const x = cellule(l, a)
          const y = cellule(l, b)
          return [x || y, x ? y : '']
        }
      } else {
        const i = col(o.colonne, `${ch}.colonne`)
        libelle = (l) => [cellule(l, i), '']
      }
      return
    }
    if (type === 'nom') return c.erreur(`${ch}.type`, '"nom" is only allowed as the first column')
    if (type === 'note') {
      const i = col(o.colonne, `${ch}.colonne`)
      notes.push((l) => cellule(l, i))
      return
    }
    const largeur = c.nombre(o, 'largeur', ch, LARGEURS[type])
    colonnes.push({
      titre: c.texte(o, 'titre', ch),
      court: c.texte(o, 'court', ch, String(o.titre ?? '')),
      genre: type,
      ton: c.choix(o, 'ton', ch, ['normal', 'pale', 'rouge'] as const, 'normal'),
      largeur,
      largeurEtroite: c.nombre(o, 'largeurEtroite', ch, Math.round(largeur * 0.56)),
    })
    const compte = c.booleen(o, 'etendue', ch, false)
    if (type === 'texte') {
      const i = col(o.colonne, `${ch}.colonne`)
      cellules.push((l) => ({ texte: cellule(l, i), nombres: [] }))
    } else if (type === 'prix') {
      const i = col(o.colonne, `${ch}.colonne`)
      cellules.push((l) => {
        const v = nombre(cellule(l, i))
        if (compte && v !== null) etendue.push(v)
        return { texte: prix(v), nombres: [v] }
      })
    } else {
      const paire = Array.isArray(o.colonnes) ? o.colonnes : []
      if (paire.length !== 2) c.erreur(`${ch}.colonnes`, 'must list two CSV columns (low, high)')
      const [a, b] = [col(paire[0], `${ch}.colonnes[0]`), col(paire[1], `${ch}.colonnes[1]`)]
      cellules.push((l) => {
        const [x, y] = [nombre(cellule(l, a)), nombre(cellule(l, b))]
        if (compte) for (const v of [x, y]) if (v !== null) etendue.push(v)
        const texte = x === null && y === null ? '—' : x === null || y === null || x === y ? prix(x ?? y) : `${prix(x)} – ${prix(y)}`
        return { texte, nombres: [x, y] }
      })
    }
  })

  // "If empty" wording, e.g. "à négocier" when neither floor nor ceiling price is known.
  let siVide = ''
  let estVide: (l: string[]) => boolean = () => false
  if (meta.siVide !== undefined) {
    const o = c.objet(meta.siVide, 'siVide')
    siVide = c.texte(o, 'texte', 'siVide')
    const surveillees = c.textes(o, 'colonnes', 'siVide').map((n, k) => col(n, `siVide.colonnes[${k}]`))
    estVide = (l) => surveillees.every((i) => cellule(l, i) === '')
  }

  const vus = new Set<string>()
  const sorties: Ligne[] = []
  for (const l of lignes) {
    const [l1, l2] = libelle(l)
    if (!l1) continue
    let id = slug(l1) || 'ligne'
    for (let n = 2; vus.has(id); n++) id = `${slug(l1) || 'ligne'}-${n}`
    vus.add(id)
    const vide = estVide(l)
    const valeurs = cellules.map((f) => f(l))
    const ns = notes.map((f) => f(l)).filter(Boolean)
    const sceau = sceauDe(l)
    const libelleSceau = sceaux.find((x) => x.cle === sceau)?.libelle ?? ''
    sorties.push({
      id,
      sceau,
      libelle: l1,
      libelle2: l2,
      notes: ns,
      valeurs: valeurs.map((v) => v.texte),
      vide,
      texte: [l1, l2, libelleSceau, ...ns, ...valeurs.filter((_, k) => colonnes[k]?.genre === 'texte').map((v) => v.texte)].join(' '),
    })
  }

  const modeleEtendue = c.texte(meta, 'etendue', '', '')
  const decompte =
    accorder(c.texte(meta, 'decompte', '', ''), { n: sorties.length }) +
    (etendue.length && modeleEtendue ? accorder(modeleEtendue, { min: prix(Math.min(...etendue)), max: prix(Math.max(...etendue)) }) : '')

  const legende = (Array.isArray(meta.legende) ? meta.legende : meta.legende === undefined ? [] : (c.erreur('legende', 'must be a list of { terme, definition }'), [])).map(
    (x, k) => {
      const o = c.objet(x, `legende[${k}]`)
      return { terme: c.texte(o, 'terme', `legende[${k}]`), definition: c.texte(o, 'definition', `legende[${k}]`) }
    },
  )

  return {
    ...base,
    type: 'registre',
    sousTitre: c.texte(meta, 'sousTitre', '', ''),
    resume: c.texte(meta, 'resume', '', ''),
    titreLibelle,
    courtLibelle,
    colonnes,
    lignes: sorties,
    sceaux,
    siVide,
    legende,
    decompte,
    pied: c.texte(meta, 'pied', '', ''),
    citation: c.texte(meta, 'citation', '', ''),
  }
}

/* ───────────────────────────── The book ───────────────────────────── */

function lire(): LivreComplet {
  const cfg = config()
  const erreurs: string[] = []
  const general = new Controle('content/livre.json', erreurs)
  const embleme = lireEmbleme(cfg.embleme.fichier, general)

  const dossiers = fs
    .readdirSync(CONTENU, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort(ordre)
  if (!dossiers.length) general.erreur('', 'the book has no section: add a folder content/01-<name>/ with a section.json and pages')

  const sommaire: DefSection = {
    id: 'sommaire',
    titre: cfg.sommaire.titre,
    court: cfg.sommaire.court,
    couleur: cfg.sommaire.couleur,
    icone: cfg.sommaire.icone,
    prive: false,
    ouverte: false,
    serrure: null,
    motDePasseEnv: '',
  }
  const defs: DefSection[] = [sommaire]
  const pages: Page[] = [
    { type: 'sommaire', id: 'sommaire', section: 'sommaire', titre: cfg.sommaire.titre, court: cfg.sommaire.court, icone: cfg.sommaire.icone, surtitre: '', citation: cfg.sommaire.citation },
  ]
  const csvs = new Map<string, Csv>()
  const ids = new Map<string, string>()

  for (const dossier of dossiers) {
    const rel = `content/${dossier}`
    const c = new Controle(`${rel}/section.json`, erreurs)
    const fichierSection = path.join(CONTENU, dossier, 'section.json')
    let brut: unknown = {}
    if (!fs.existsSync(fichierSection)) c.erreur('', 'is missing (every section folder needs one: { "titre", "court", "couleur", "icone" })')
    else {
      try {
        brut = JSON.parse(fs.readFileSync(fichierSection, 'utf8'))
      } catch (e) {
        c.erreur('', `is not valid JSON: ${(e as Error).message}`)
      }
    }
    const s = c.objet(brut, '')
    const id = slug(sansPrefixe(dossier))
    const prive = c.booleen(s, 'prive', '', false)
    const def: DefSection = {
      id,
      titre: c.texte(s, 'titre', ''),
      court: c.texte(s, 'court', '', String(s.titre ?? '')),
      couleur: c.texte(s, 'couleur', ''),
      icone: c.texte(s, 'icone', ''),
      prive,
      ouverte: false,
      serrure: prive ? serrureSection(c, c.objet(s.serrure, 'serrure', true), 'serrure', cfg.sectionPrivee) : null,
      motDePasseEnv: c.texte(s, 'motDePasseEnv', '', 'LIVRE_MOT_DE_PASSE'),
    }
    if (id === 'sommaire') c.erreur('', '"sommaire" is reserved for the generated title page: rename the folder')
    defs.push(def)
    const modeleSurtitre = c.texte(s, 'surtitre', '', '{section}')
    const defautsRegistre = c.objet(s.registre, 'registre', true)

    const fichiers = fs
      .readdirSync(path.join(CONTENU, dossier))
      .filter((f) => f.endsWith('.md'))
      .sort(ordre)
    if (!fichiers.length) c.erreur('', `the section has no page: add a file ${rel}/01-<name>.md`)

    fichiers.forEach((f, k) => {
      const cp = new Controle(`${rel}/${f}`, erreurs)
      const { meta: lu, corps } = frontmatter(fs.readFileSync(path.join(CONTENU, dossier, f), 'utf8'), cp)
      const type = cp.choix(lu, 'type', '', TYPES)
      const meta = type === 'registre' ? { ...defautsRegistre, ...lu } : lu
      const pid = slug(sansPrefixe(f))
      if (ids.has(pid)) cp.erreur('', `has the same page name "${pid}" as ${ids.get(pid)} (page names must be unique in the book: rename one file)`)
      ids.set(pid, `${rel}/${f}`)
      const titre = cp.texte(meta, 'titre', '')
      const base = {
        id: pid,
        section: id,
        titre,
        court: cp.texte(meta, 'court', '', titre),
        icone: cp.texte(meta, 'icone', '', type === 'registre' ? 'scroll-unfurled' : type === 'notes' ? 'quill-ink' : 'sands-of-time'),
        surtitre: cp.texte(meta, 'surtitre', '', accorder(modeleSurtitre, { section: def.titre, n: romain(k + 1).toUpperCase() })),
      }
      if (type === 'notes') {
        pages.push({
          ...base,
          type: 'notes',
          resume: cp.texte(meta, 'resume', '', ''),
          auteur: cp.texte(meta, 'auteur', '', ''),
          citation: cp.texte(meta, 'citation', '', ''),
          html: marked.parse(corps, { async: false }),
          texte: `${titre} ${meta.resume ?? ''} ${corps.replace(/[#*_>`\-[\]()]/g, ' ')}`,
        })
      } else if (type === 'registre') {
        pages.push(lireRegistre(base, meta, path.join(CONTENU, dossier), cp, cfg, csvs))
      } else {
        pages.push({
          ...base,
          type: 'a-venir',
          resume: cp.texte(meta, 'resume', '', ''),
          attente: cp.texte(meta, 'attente', ''),
          citation: cp.texte(meta, 'citation', '', ''),
        })
      }
    })
  }

  if (erreurs.length) new Controle('', erreurs).verifier()
  return {
    config: cfg,
    defs,
    sections: defs,
    pages,
    consigneLe: process.env.LIVRE_CONSIGNE_LE || new Date().toISOString(),
    embleme,
    icones: {},
  }
}

let cache: LivreComplet | null = null

/** The whole book, every section included. Server only: never send it as is to the browser. */
export function livreComplet(): LivreComplet {
  // Re-read on every request in development, so content edits show up at once.
  if (process.env.NODE_ENV !== 'production') return lire()
  return (cache ??= lire())
}

/**
 * The book as one reader may see it: the pages of the private sections they have not unlocked are
 * replaced by sealed pages carrying only their title, label and icon. Nothing else of them leaves the server.
 */
export function livrePourLecteur(complet: LivreComplet, ouvertes: Set<string>): Livre {
  const fermees = new Set(complet.defs.filter((d) => d.prive && !ouvertes.has(d.id)).map((d) => d.id))
  const sections: Section[] = complet.defs.map(({ motDePasseEnv: _, ...s }) => ({ ...s, ouverte: s.prive && !fermees.has(s.id) }))
  const pages: Page[] = complet.pages.map((p) =>
    fermees.has(p.section) ? { type: 'scellee', id: p.id, section: p.section, titre: p.titre, court: p.court, icone: p.icone, surtitre: p.surtitre } : p,
  )
  const noms = [
    ...sections.map((s) => s.icone),
    ...pages.flatMap((p) => [p.icone, ...(p.type === 'registre' ? p.sceaux.map((x) => x.icone) : [])]),
    ...(sections.some((s) => s.prive) ? [ICONE_RESCELLER] : []),
  ]
  return { config: complet.config, sections, pages, consigneLe: complet.consigneLe, embleme: complet.embleme, icones: icones(noms) }
}

export { ICONE_RESCELLER }
