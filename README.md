# Grimoire RP — book template

A leather-bound, in-character book on the web: a closed cover on a tavern table, pages that turn
in 3D (drag a corner, swipe, or click), ribbons for sections, thumb tabs for pages, engraved icons,
a quill search that turns to the hits, iron locks for what must stay secret.

**One deployment = one book.** Everything a book owner sees lives in `content/`; no code change is
needed to make a new book.

Stack: Next.js 15 (App Router) · React 19 · plain CSS · no database.

## Start a new book in five steps

1. **Copy** this repository (without `node_modules`, `.next`, `.vercel`, `.env.local`), then
   `npm install`.
2. **Edit `content/`**: `livre.json` (title, texts, access, look), one folder per section, one
   Markdown file per page, CSV files for ledgers. Replace `content/embleme.svg` with the book's
   emblem (see [Emblem](#emblem)).
3. **Set the secrets** if anything is locked (private book or private section): copy `.env.example`
   to `.env.local` and fill `LIVRE_MOT_DE_PASSE` and `LIVRE_SECRET` (`openssl rand -hex 32`).
4. **Check locally**: `npm run dev` → http://localhost:3000. Content mistakes stop the page with an
   English message naming the file and the field (`npm run build` checks them too).
5. **Deploy** on Vercel:
   ```sh
   vercel link --yes --project <book-name>      # first time only
   vercel env add LIVRE_MOT_DE_PASSE production  # if anything is locked
   vercel env add LIVRE_SECRET production
   vercel --prod --yes
   ```

## The content folder

```
content/
  livre.json               identity, access, look, every visible string
  embleme.svg              the emblem (traced SVG)
  01-echantillons/         one folder = one SECTION = one ribbon
    section.json           { "titre", "court", "couleur", "icone", "prive"?, ... }
    01-mots-a-la-piece.md          one file = one PAGE = one thumb tab
    02-ouvrages-relies.md
    catalogue.csv       data for the ledger pages
  02-carnet/
  03-reserve/
```

- **Order** = the numeric prefix of folder and file names (`01-`, `02-`, … `10-` sorts after `9-`).
  Reordering = renaming. The prefix is dropped from ids: `01-echantillons` → section `echantillons`,
  `02-ouvrages-relies.md` → page `ouvrages-relies` (deep link `/#ouvrages-relies`). Page names must be unique in the whole book.
- Folders starting with `_` or `.` are ignored (handy for drafts).
- The **title page** (frontispiece + table of contents) is generated; its texts come from `livre.json`.
- Changing a CSV, a page or `livre.json` only needs a redeploy.

## `livre.json`

All visible text is French in the example, but any language works. Templates: `{n}` is a number,
`{s}` becomes "s" when n > 1 (and `{x}` becomes "x"), other `{keys}` are listed per field.

| Key | Meaning |
|---|---|
| `titre` | Full title: page header and title page. |
| `sousTitre` | Line under the header title (hidden on phones). Empty = none. |
| `devise` | Motto, in italics on the title page. |
| `langue` / `locale` | HTML language (`fr`) and number/date locale (`fr-FR`). |
| `acces` | `"public"` (the cover opens on a click) or `"prive"` (the cover is locked, see [Access](#access)). |
| `onglet.titre` / `onglet.description` | Browser tab title and page description. |
| `embleme.fichier` | Emblem SVG, path relative to `content/`. |
| `embleme.rotationEntete` | Rotation of the emblem in the page header, in degrees (`90` = lying on its side). |
| `apparence.table` / `apparence.cuir` | Photo textures (paths under `public/`): the table, the cover leather. |
| `apparence.voileCuir` | Two colours (top, bottom) of the tint laid over the leather photo. |
| `apparence.dorure` | Four colours of the gold leaf (highlight, light gold, dark gold, reflected light): titles, emblem, fillets, favicon. |
| `apparence.couleurs` | Palette (all optional): `table`, `cuir`, `cuirClair`, `cuirSombre` (open book's binding), `or`, `orPale`, `parchemin`, `encre`, `encreDouce`, `encrePale`, `encreRouge`. |
| `couverture.titre` | Short title gilded on the cover. |
| `couverture.salut` | Greeting on the first page, seen as the cover swings open. |
| `couverture.invite` | Public book: line under the closed book ("touch the cover…"). |
| `couverture.ouvrir` | Public book: tooltip / accessible name of the cover. |
| `couverture.onglet` | Browser tab title of the cover page. |
| `serrure.*` | Private book lock: `placeholder` (text in the key-shaped field), `aide` (field's accessible name), `tourner` (tooltip of the key's bow), `refus` (wrong word), `coincee` (network failure), `nonForgee` (password or secret not configured). |
| `sectionPrivee.*` | Default wording of private sections: the same six keys as `serrure`, plus `intro` (left page of a sealed page), `citation` (closing quote under the lock, optional), `resceller` (the engraved "lock again" action), `aideResceller` (its tooltip). |
| `pageDeTitre.surTitre` | Small caps line above the title on the title page. |
| `pageDeTitre.texte` | Paragraph of the title page (hidden on phones). |
| `pageDeTitre.consigne` | Date line, `{date}` = the day the book was built, in the book's calendar. Empty = none. |
| `calendrier.fuseau` | Time zone of that date (e.g. `Asia/Tokyo`). |
| `calendrier.mois` | The 12 month names of the book's world (leave out for the locale's months). |
| `sommaire.*` | The title page's ribbon: `titre`, `court` (ribbon label), `couleur`, `icone`; `tableDesMatieres` (heading), `citation` (closing quote). |
| `textes.recherche.*` | Global search: `placeholder`, `aide`, `effacer`, `trouvailles` (`{n}`), `rien`, `mentions` (`{n}`, hits in notes), `lignes` (`{n}`, hits in ledgers), `autres` (`{n}` more rows), `vide` (no hit). |
| `textes.rechercheLocale.*` | Per-page ledger search: `placeholder`, `aide` (`{titre}`), `vides` (list of "nothing found" lines, picked in turn). |
| `textes.signature` | Notes author line, `{auteur}`. |
| `textes.refermer.gravure` / `.aide` | Word engraved on the iron latch that closes the book, and its tooltip (also the phone header key). |
| `textes.coins.*` | Page corners: `precedente`, `suivante` (accessible names), `aidePrecedente`, `aideSuivante` (tooltips). |
| `textes.navigation.rubans` / `.onglets` | Accessible names of the ribbons and tabs. |
| `egare.titre` / `.texte` / `.retour` | The "torn page" (404). |
| `credits` | Lines of the colophon on the title page. **Must credit game-icons.net** (CC BY 3.0): the book refuses to load otherwise. |

## `section.json`

```json
{
  "titre": "La Réserve",
  "court": "Réserve",
  "couleur": "#5a2d6b",
  "icone": "locked-chest",
  "surtitre": "La Réserve · Feuillet {n}",
  "prive": true,
  "motDePasseEnv": "RESERVE_MOT_DE_PASSE",
  "serrure": { "intro": "…", "placeholder": "…" },
  "registre": { "donnees": "tarifs.csv", "colonnes": [ … ] }
}
```

| Key | Meaning |
|---|---|
| `titre` | Section title (table of contents, header line of its pages). |
| `court` | Ribbon label (defaults to `titre`). |
| `couleur` | Ribbon colour; also tints the illuminated initials and ornaments of its pages. |
| `icone` | Ribbon icon ([Icons](#icons)). |
| `surtitre` | Small caps line above each page title. `{section}` = section title, `{n}` = roman page number in the section. Default `{section}`. A page may override it with its own `surtitre`. |
| `prive` | `true` = private section ([Access](#access)). |
| `motDePasseEnv` | Name of the env var holding this section's password. Default `LIVRE_MOT_DE_PASSE`. |
| `serrure` | Overrides any key of `livre.json` `sectionPrivee` for this section. |
| `registre` | Defaults merged into every `registre` page of the section (the page's own keys win). Saves repeating a ledger's columns on every page. |

## Pages (`NN-name.md`)

Every page is a Markdown file with a YAML frontmatter. Common keys:

| Key | Meaning |
|---|---|
| `type` | **Required**: `notes`, `registre` or `a-venir`. |
| `titre` | **Required**: page title. |
| `court` | Thumb tab label (defaults to `titre`). |
| `icone` | Icon beside the title and on the tab. |
| `surtitre` | Overrides the section's `surtitre` for this page. |
| `resume` | Paragraph under the title on the left page, with an illuminated initial. |
| `citation` | Closing quote at the foot of the page. |

### `notes` — free text

```markdown
---
type: notes
titre: Commander un grimoire
court: Commander
icone: quill-ink
resume: Ce que le copiste demande avant de tremper sa plume.
auteur: Ri'Oblan, copiste
citation: Une page bien copiée vaut mieux que dix pages bien racontées.
---

Markdown body: ## headings, lists, **bold**, *italics*, > quotes.
```

`auteur` adds the signature line (`textes.signature`). A `> quote` as the last paragraph of the body
also works as a closing quote. Notes are covered by the global search.

### `registre` — a ledger from a CSV

```markdown
---
type: registre
titre: Potions
sousTitre: Potions
icone: round-potion
resume: In-character introduction.
donnees: catalogue.csv          # path relative to the section folder (must stay in content/)
filtre: { colonne: chapitre, valeur: mots }   # optional: only the rows holding this value (or list)
sceau:                             # optional: an engraved stamp per row
  colonne: artisan
  defaut: divers                   # when the cell matches nothing (leave out = no stamp)
  valeurs:
    alchimiste: { libelle: Alchimiste, icone: fizzing-flask, couleur: "#2f5b3a", reconnaitre: [alchim] }
    divers:     { libelle: Divers, icone: two-coins, couleur: "#7a5a14", legende: false }
colonnes:
  - { type: nom, titre: Article, colonnes: [fr, en] }
  - { type: note, colonne: note }
  - { type: prix, titre: Coût, colonne: prod, ton: pale, largeur: 50, largeurEtroite: 30 }
  - { type: prix, titre: Plancher, court: Bas, colonne: min, etendue: true }
  - { type: prix, titre: Plafond, court: Haut, colonne: max, ton: rouge, etendue: true }
siVide: { colonnes: [min, max], texte: à négocier }
legende:
  - { terme: Coût, definition: "ce que l'objet coûte à l'atelier" }
decompte: "{n} article{s} consigné{s}"
etendue: ", de {min} à {max} septims"
pied: Prix exprimés en septims d'or
---
```

The CSV's first line names its columns (any names; case and accents are ignored when matching).
Decimal point or quoted decimal comma (`"21,875"`) both work. Extra columns are ignored.

**Column kinds** (`colonnes`, in display order):

| `type` | Keys | Shows |
|---|---|---|
| `nom` | `titre`, `court`?, `colonnes: [main, second?]` | The row label: main name, second name in italics under it (e.g. FR / EN). **First column only.** |
| `texte` | `titre`, `court`?, `colonne` | First column: a plain label. Elsewhere: a text value, right-aligned in italics. |
| `note` | `colonne` | A short red small-caps mention under the label (no column of its own). |
| `prix` | `titre`, `court`?, `colonne`, `ton`?, `etendue`? | A number, formatted for the locale; empty cell = `—`. |
| `fourchette` | `titre`, `court`?, `colonnes: [low, high]`, `ton`?, `etendue`? | `low – high` (one value if they are equal or one is missing). |

Value columns also take `largeur` / `largeurEtroite` (px, desktop / phone; defaults: prix 62,
fourchette 104, texte 120, phone ≈ 56 %), `court` (header on phones) and `ton`: `normal`, `pale`
(greyed cost), `rouge` (red ink). `etendue: true` counts the column in the `{min}`/`{max}` of `etendue`.

Other keys: `sceau` (stamps; `reconnaitre` lists extra fragments a cell may contain, `legende: false`
hides a value from the legend), `siVide` (when every listed CSV column of a row is empty, the row shows
this text instead of its values), `legende` (term / definition list on the left page), `decompte`
(`{n}` rows) and `etendue` (`{min}`, `{max}`) on the left page, `pied` (line under the table),
`sousTitre`. Each ledger page has its own search, and the global search covers every ledger.

### `a-venir` — a page still being written

```markdown
---
type: a-venir
titre: Commandes en cours
icone: sands-of-time
resume: What this page will hold.
attente: L'encre de cette page n'est pas encore sèche. Reviens à la prochaine lune, ami.
citation: Le copiste pressé fait deux livres - le mauvais, puis le bon.
---
```

## Access

- **Public book** (`"acces": "public"`): every visit starts at the closed cover; a click opens it
  (the cover swings onto the greeting page, then the book). The iron latch on the open book's left
  edge (a key in the phone header) closes it again. No secret needed unless a section is private.
- **Private book** (`"acces": "prive"`): the cover carries an iron lock; the password field is the
  shaft of the key. Right word → the key enters, turns, the cover opens. The whole site (pages and
  API) is behind the lock (`middleware.ts`). Needs `LIVRE_MOT_DE_PASSE` and `LIVRE_SECRET`.
  Changing the password closes every reader's book.
- **Private section** (`"prive": true` in `section.json`, in a public or private book): its ribbon,
  tabs and page titles stay visible, but its pages show an iron lock and key until the right word is
  given (password from `motDePasseEnv`, default `LIVRE_MOT_DE_PASSE`; `LIVRE_SECRET` required).
  The sealed pages' text, ledger rows and summaries are never sent to the browser (filtered on the
  server, absent from the search) until the word is given; a signed cookie then unlocks the section
  for 30 days. "Refermer la serrure" (wording in `sectionPrivee.resceller`) at the foot of the
  section's pages seals it again.

| Env var | Purpose |
|---|---|
| `LIVRE_MOT_DE_PASSE` | Password of a private book, and default password of private sections. |
| `LIVRE_SECRET` | Random secret signing the cookies (`openssl rand -hex 32`). |
| *(any name)* | A section's own password, named by its `motDePasseEnv`. |

## Look

### Icons

Section, page, tab and stamp icons come from [game-icons.net](https://game-icons.net) (CC BY 3.0,
credited on the title page — keep the credit) through `@iconify-json/game-icons`. Use the icon's
name: the last part of its URL on game-icons.net (e.g. `beer-stein`, `crossed-swords`). Unknown names
are reported in the server log. Only the icons in use are sent to the browser.

### Emblem

The emblem is gilded on the cover, the title page, the header and the favicon (`/icone.svg`, built
from the emblem and the gold colours). It must be a **single-colour SVG** with a `viewBox` and
`<path d="…">` elements (all paths are merged; fills are ignored). From a PNG logo:

```sh
# 1. Threshold to pure black on white (Python + Pillow)
python3 -c "from PIL import Image; im=Image.open('logo.png').convert('L'); im.point(lambda v: 0 if v<128 else 255).save('logo.bmp')"
# 2. Trace with potrace (npm package)
npx -y -p potrace node -e "require('potrace').trace('logo.bmp', (e, svg) => require('fs').writeFileSync('content/embleme.svg', svg))"
```

Then open the SVG, crop its `viewBox` tightly around the drawing (x y width height), and delete any
background rectangle path. The colour comes from `apparence.dorure`.

### Textures

Photo textures make the book: keep them real (no flat colours). The defaults are CC0 photos from
[Poly Haven](https://polyhaven.com) (download: `https://api.polyhaven.com/files/<asset>`), 2K,
recompressed:

- `public/textures/table.jpg` — [wood_table](https://polyhaven.com/a/wood_table), the table (`apparence.table`);
- `public/textures/cuir.jpg` — [brown_leather](https://polyhaven.com/a/brown_leather), the cover (`apparence.cuir`, tinted by `apparence.voileCuir`);
- `public/textures/fer.jpg` — [rusty_metal_04](https://polyhaven.com/a/rusty_metal_04), the forged iron of locks, keys and latch (lit as a relief by `FiltreFer` in `components/Fer.tsx`).

Drop new files in `public/textures/` and point `livre.json` at them. The open book's binding uses the
`cuir*` colours of `apparence.couleurs`.

### Fonts

UnifrakturMaguntia (titles), IM Fell English and IM Fell English SC (text, small caps), from Google
Fonts (`app/layout.tsx`).

## Credits

- Icons: game-icons.net, CC BY 3.0 (attribution required, shown on the title page).
- Textures: Poly Haven, CC0.
- Fonts: Google Fonts (SIL Open Font License).

## Where things are (for developers)

`lib/config.ts` (livre.json schema), `lib/contenu.ts` (content loader, validation, server-side
filtering of sealed sections), `lib/sceau.ts` (signed cookies), `middleware.ts` (cover / lock),
`app/api/sceau` (book lock), `app/api/section` (section locks), `components/` (book, pages, leaves,
iron), `app/globals.css` (all the look). Technical traps already solved are commented in place
(faces swap at mid-turn, leaves over the brass corners, cover front face hidden past 90°, title page
sized for short viewports).
