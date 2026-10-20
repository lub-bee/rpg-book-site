export function romain(n: number): string {
  const t: [number, string][] = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]
  let r = ''
  for (const [v, s] of t) while (n >= v) { r += s; n -= v }
  return r
}

/**
 * Fills a wording template from the content: `{n}` the number, `{s}` → "s" when n > 1 (French plural),
 * and any other `{key}` from `valeurs`. Unknown keys are left as they are.
 */
export function accorder(modele: string, valeurs: Record<string, string | number> = {}): string {
  return modele.replace(/\{(\w+)\}/g, (tout, cle: string) => {
    if (cle === 's') return Number(valeurs.n) > 1 ? 's' : ''
    if (cle === 'x') return Number(valeurs.n) > 1 ? 'x' : ''
    return cle in valeurs ? String(valeurs[cle]) : tout
  })
}

/** "1er de Primétoile": the date in the book's own calendar (month names from livre.json, or the locale's). */
export function dateDuLivre(iso: string, o: { locale: string; fuseau: string; mois: string[] }): string {
  const date = new Date(iso)
  if (!o.mois.length) return new Intl.DateTimeFormat(o.locale, { timeZone: o.fuseau, day: 'numeric', month: 'long' }).format(date)
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: o.fuseau, day: 'numeric', month: 'numeric' }).formatToParts(date)
  const jour = Number(parts.find((p) => p.type === 'day')?.value)
  const mois = o.mois[Number(parts.find((p) => p.type === 'month')?.value) - 1]
  return `${jour === 1 ? '1er' : jour} ${/^[AÂEÉÈIOUY]/i.test(mois) ? "d'" : 'de '}${mois}`
}
