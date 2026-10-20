---
type: registre
titre: Offres et options
sousTitre: Offers & Options
court: Offres
icone: book-cover
resume: Ce Khajiit encre, décore, structure et relie. De l'écriture à la livraison, voici nos offres et options.
donnees: offres.csv
colonnes:
  - { type: nom, titre: Ouvrage, colonnes: [fr, en] }
  - { type: note, colonne: note }
  - { type: fourchette, titre: Prix, colonnes: [min, max], etendue: true }
  - { type: texte, titre: Délai, colonne: delai, largeur: 96, largeurEtroite: 64 }
siVide: { colonnes: [min, max], texte: à négocier }
legende:
  - { terme: Prix, definition: "en septims, selon l'ampleur de l'ouvrage" }
  - { terme: Délai, definition: "de l'écriture à la livraison" }
decompte: "{n} offre{s}"
etendue: ", de {min} à {max} septims"
pied: Prix exprimés en septims d'or
citation: Les mots partent dans le vent, les lettres s'encrent dans le temps.
---
