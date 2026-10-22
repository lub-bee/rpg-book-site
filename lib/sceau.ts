// Seals (signed cookies). A seal holds HMAC(LIVRE_SECRET, scope + password): changing the password
// breaks every seal made with it. Edge-safe (Web Crypto only): used by the middleware too.

/** Private book: the reader has turned the key on the cover. */
export const COOKIE_SCEAU = 'livre_sceau'
/** Public book: the reader has opened the cover in this browser session (no security, just the ceremony). */
export const COOKIE_OUVERT = 'livre_ouvert'
/** Private section: the reader has given its word. */
export const cookieSection = (id: string) => `livre_section_${id}`

export const DUREE_SCEAU = 60 * 60 * 24 * 30

const encodeur = new TextEncoder()

async function hmac(secret: string, message: string): Promise<string> {
  const cle = await crypto.subtle.importKey('raw', encodeur.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', cle, encodeur.encode(message))
  return Array.from(new Uint8Array(signature), (o) => o.toString(16).padStart(2, '0')).join('')
}

/** Seal for `motDePasse` in a scope ("livre", or "section:<id>"). Null when LIVRE_SECRET is not set. */
export async function jetonPour(portee: string, motDePasse: string): Promise<string | null> {
  const secret = process.env.LIVRE_SECRET
  if (!secret || !motDePasse) return null
  return hmac(secret, `${portee}:${motDePasse}`)
}

/** The seal the reader must hold for the whole book (private books). */
export async function jetonLivre(): Promise<string | null> {
  return jetonPour('livre', process.env.LIVRE_MOT_DE_PASSE ?? '')
}

/** The seal of a private section; its password comes from the env var it names (LIVRE_MOT_DE_PASSE by default). */
export async function jetonSection(id: string, motDePasseEnv: string): Promise<string | null> {
  return jetonPour(`section:${id}`, process.env[motDePasseEnv] ?? '')
}

export function egaux(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/* ── Signed values ─────────────────────────────────────────────
   For cookies that carry a value rather than a password seal (an identity, an OAuth state…):
   `base64url(JSON).hmac`, readable by anyone, forgeable by no one without LIVRE_SECRET. The `usage`
   is part of the signature, so a value signed for one use is refused for another. */

const decodeur = new TextDecoder()

function versBase64Url(octets: Uint8Array): string {
  let bin = ''
  octets.forEach((o) => (bin += String.fromCharCode(o)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function depuisBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

/** Signs a JSON value for one usage. Throws when LIVRE_SECRET is not set (nothing can be signed then). */
export async function signer(usage: string, valeur: unknown): Promise<string> {
  const secret = process.env.LIVRE_SECRET
  if (!secret) throw new Error('LIVRE_SECRET is not set: cannot sign a value')
  const corps = versBase64Url(encodeur.encode(JSON.stringify(valeur)))
  return `${corps}.${await hmac(secret, `${usage}:${corps}`)}`
}

/** The value signed by `signer` for this usage, or null (missing, forged, other usage, no secret). */
export async function verifier<T>(usage: string, signe: string | undefined): Promise<T | null> {
  const secret = process.env.LIVRE_SECRET
  if (!secret || !signe) return null
  const [corps, sig] = signe.split('.')
  if (!corps || !sig || !egaux(sig, await hmac(secret, `${usage}:${corps}`))) return null
  try {
    return JSON.parse(decodeur.decode(depuisBase64Url(corps))) as T
  } catch {
    return null
  }
}
