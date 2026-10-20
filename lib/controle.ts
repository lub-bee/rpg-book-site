/* Small validation helper: walks a parsed JSON/YAML value, collects every problem with its path,
   then throws one readable error listing them all. */

export type Obj = Record<string, unknown>

export class Controle {
  /** Several Controle may share one list, to report the problems of every file at once. */
  constructor(
    readonly fichier: string,
    readonly erreurs: string[] = [],
  ) {}

  erreur(chemin: string, message: string) {
    this.erreurs.push(`${this.fichier}: ${chemin ? `"${chemin}" ` : ''}${message}`)
  }

  objet(v: unknown, chemin: string, optionnel = false): Obj {
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Obj
    if (!(optionnel && v === undefined)) this.erreur(chemin, v === undefined ? 'is missing (expected an object)' : 'must be an object')
    return {}
  }

  texte(o: Obj, cle: string, chemin: string, defaut?: string): string {
    const v = o[cle]
    const ici = chemin ? `${chemin}.${cle}` : cle
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(v)
    if (v === undefined || v === null) {
      if (defaut !== undefined) return defaut
      this.erreur(ici, 'is missing (expected a text)')
    } else this.erreur(ici, 'must be a text')
    return ''
  }

  nombre(o: Obj, cle: string, chemin: string, defaut?: number): number {
    const v = o[cle]
    const ici = chemin ? `${chemin}.${cle}` : cle
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (v === undefined && defaut !== undefined) return defaut
    this.erreur(ici, v === undefined ? 'is missing (expected a number)' : 'must be a number')
    return defaut ?? 0
  }

  booleen(o: Obj, cle: string, chemin: string, defaut: boolean): boolean {
    const v = o[cle]
    if (v === undefined) return defaut
    if (typeof v === 'boolean') return v
    this.erreur(chemin ? `${chemin}.${cle}` : cle, 'must be true or false')
    return defaut
  }

  textes(o: Obj, cle: string, chemin: string, defaut?: string[]): string[] {
    const v = o[cle]
    const ici = chemin ? `${chemin}.${cle}` : cle
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v as string[]
    if (v === undefined && defaut !== undefined) return defaut
    this.erreur(ici, v === undefined ? 'is missing (expected a list of texts)' : 'must be a list of texts')
    return defaut ?? []
  }

  choix<T extends string>(o: Obj, cle: string, chemin: string, valeurs: readonly T[], defaut?: T): T {
    const v = o[cle]
    if (typeof v === 'string' && (valeurs as readonly string[]).includes(v)) return v as T
    if (v === undefined && defaut !== undefined) return defaut
    this.erreur(chemin ? `${chemin}.${cle}` : cle, `must be one of: ${valeurs.map((x) => `"${x}"`).join(', ')}${v === undefined ? ' (missing)' : ` (got ${JSON.stringify(v)})`}`)
    return defaut ?? valeurs[0]
  }

  verifier() {
    if (this.erreurs.length) {
      throw new Error(`Invalid book content (${this.erreurs.length} problem${this.erreurs.length > 1 ? 's' : ''}):\n  - ${this.erreurs.join('\n  - ')}`)
    }
  }
}
