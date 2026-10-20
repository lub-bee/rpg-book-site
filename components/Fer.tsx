'use client'

import { useId, useState } from 'react'

/** useId, usable as an SVG id (several copies of a lock may share the page while a leaf turns). */
const useIdSvg = () => useId().replace(/[^a-zA-Z0-9_-]/g, '')

/**
 * Forged-iron look for an SVG shape: a CC0 photo of worn metal (desaturated, darkened), lit as a
 * relief. The height map mixes the blurred silhouette (bevelled edges) and the photo's own
 * luminance (pitting, rough patches).
 */
export function FiltreFer({ id, l, h }: { id: string; l: number; h: number }) {
  const cote = Math.max(l, h) * 1.2
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width={l} height={h} colorInterpolationFilters="sRGB">
      <feImage href="/textures/fer.jpg" x="0" y="0" width={cote} height={cote} preserveAspectRatio="xMidYMid slice" result="photo" />
      <feColorMatrix in="photo" type="saturate" values="0.12" result="gris" />
      <feComponentTransfer in="gris" result="sombre">
        <feFuncR type="linear" slope="0.62" intercept="0.02" />
        <feFuncG type="linear" slope="0.6" intercept="0.02" />
        <feFuncB type="linear" slope="0.6" intercept="0.03" />
      </feComponentTransfer>
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="biseau" />
      <feColorMatrix in="photo" type="luminanceToAlpha" result="aspérités" />
      <feComposite in="biseau" in2="aspérités" operator="arithmetic" k1="0" k2="1" k3="0.45" k4="0" result="relief" />
      <feDiffuseLighting in="relief" surfaceScale="3.2" diffuseConstant="1.15" lightingColor="#f2ede4" result="diffus">
        <feDistantLight azimuth="235" elevation="42" />
      </feDiffuseLighting>
      <feSpecularLighting in="relief" surfaceScale="3.6" specularConstant="0.5" specularExponent="26" lightingColor="#e9e4da" result="reflet">
        <feDistantLight azimuth="235" elevation="42" />
      </feSpecularLighting>
      <feBlend in="sombre" in2="diffus" mode="multiply" result="eclaire" />
      <feComposite in="reflet" in2="SourceAlpha" operator="in" result="refletForme" />
      <feComposite in="eclaire" in2="refletForme" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" result="metal" />
      <feComposite in="metal" in2="SourceAlpha" operator="in" />
    </filter>
  )
}

/** Outline of the iron plates (lock on the closed book, latch on the open one), drawn for 84×140. */
export const PLAQUE_FER =
  'M36 3C46 10 59 11 67 7C69 24 66 34 59 40C66 46 69 52 69 58C69 65 65 70 59 76C66 83 69 92 67 109C59 105 46 106 36 113C26 106 13 105 5 109C3 92 6 83 13 76C7 70 3 65 3 58C3 52 6 46 13 40C6 34 3 24 5 7C13 11 26 10 36 3Z'

/**
 * The lock seen from inside the open book: an iron plate on the cover's fore-edge with its bolt.
 * Clicking it slides the bolt back and closes the grimoire (ends the session).
 */
export function Verrou({ onRefermer, gravure, aide }: { onRefermer: () => void; gravure: string; aide: string }) {
  const [tire, setTire] = useState(false)
  const id = useIdSvg()
  return (
    <button
      type="button"
      className={`verrou ${tire ? 'tire' : ''}`}
      title={aide}
      aria-label={aide}
      disabled={tire}
      onClick={() => {
        setTire(true)
        setTimeout(onRefermer, 420)
      }}
    >
      <svg viewBox="0 0 84 140" aria-hidden>
        <defs>
          <FiltreFer id={`${id}-plaque`} l={84} h={140} />
          <FiltreFer id={`${id}-pene`} l={84} h={140} />
          <linearGradient id={`${id}-gache`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#1d1611" />
          </linearGradient>
        </defs>
        <g filter={`url(#${id}-plaque)`}>
          <path transform="scale(1.1667 1.2069)" d={PLAQUE_FER} fill="#fff" />
          {[
            [15, 23],
            [69, 23],
            [15, 117],
            [69, 117],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#fff" />
          ))}
        </g>
        {/* Groove the bolt slides in */}
        <rect x="12" y="57" width="60" height="26" rx="4" fill={`url(#${id}-gache)`} stroke="#9a9286" strokeOpacity=".3" />
        <path d="M13 60H71" stroke="#000" strokeOpacity=".7" strokeWidth="2" />
        <g className="verrou-pene" filter={`url(#${id}-pene)`}>
          {/* Bolt, pushed out past the edge, and its thumb knob */}
          <rect x="0" y="62" width="60" height="16" rx="3" fill="#fff" />
          <rect x="44" y="50" width="10" height="20" rx="3" fill="#fff" />
        </g>
        {/* Light catching the top of the bolt, shadow under it */}
        <g className="verrou-pene" aria-hidden>
          <path d="M3 63.5H43M55 63.5H58" stroke="#e8e1d4" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M45 51.5H53" stroke="#e8e1d4" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3 78.5H58" stroke="#000" strokeOpacity=".75" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        {/* Engraved word under the bolt: dark cut, light lower lip */}
        <g className="verrou-grave" fontFamily="var(--f-capitales)" fontSize="11" letterSpacing=".5" textAnchor="middle">
          <text x="42" y="100.4" fill="#000" fillOpacity=".8">{gravure}</text>
          <text x="42" y="101.2" fill="#cfc6b6" fillOpacity=".78">{gravure}</text>
        </g>
      </svg>
    </button>
  )
}

/** Hand-forged iron key, drawn pointing left (viewBox 380×120). */
export function Cle({ className = 'cle-dessin' }: { className?: string }) {
  const id = useIdSvg()
  return (
    <svg className={className} viewBox="0 0 380 120" aria-hidden>
      <defs>
        <FiltreFer id={id} l={380} h={120} />
        <mask id={`${id}-ajoure`} maskUnits="userSpaceOnUse" x="0" y="0" width="380" height="120">
          <rect width="380" height="120" fill="#fff" />
          <circle cx="334" cy="46" r="10.5" fill="#000" />
          <circle cx="334" cy="74" r="10.5" fill="#000" />
          <circle cx="320" cy="60" r="10.5" fill="#000" />
          <circle cx="348" cy="60" r="10.5" fill="#000" />
          <circle cx="334" cy="60" r="7" fill="#000" />
        </mask>
      </defs>
      <g filter={`url(#${id})`}>
        {/* Bit */}
        <path d="M4 46L11 43L64 44L65 77L57 78L57 103L47 104L46 92L37 92L38 103L25 104L24 86L15 87L14 77L5 76Z" fill="#fff" />
        {/* Shaft, slightly uneven like hammered iron */}
        <path d="M58 43C110 40 190 45 270 41L271 79C190 76 112 81 58 77Z" fill="#fff" />
        {/* Collars */}
        <path d="M266 33L280 34L281 87L265 86Z" fill="#fff" />
        <path d="M284 38L293 37L294 83L284 84Z" fill="#fff" />
        {/* Bow, pierced with a quatrefoil */}
        <path d="M290 60C290 34 309 15 335 16C359 17 377 36 376 61C375 86 356 104 332 104C308 103 290 85 290 60Z" fill="#fff" mask={`url(#${id}-ajoure)`} />
      </g>
    </svg>
  )
}

/** Narrow screens: the latch gives way to a small iron key in the header that closes the grimoire. */
export function CleRefermer({ onRefermer, aide }: { onRefermer: () => void; aide: string }) {
  const [tourne, setTourne] = useState(false)
  return (
    <button
      type="button"
      className={`cle-refermer ${tourne ? 'tourne' : ''}`}
      title={aide}
      aria-label={aide}
      disabled={tourne}
      onClick={() => {
        setTourne(true)
        setTimeout(onRefermer, 420)
      }}
    >
      <Cle className="cle-refermer-dessin" />
    </button>
  )
}

/**
 * Iron lock plate (the cover's lock, and the lock of a sealed section). Its keyhole is the key's
 * cross-section at the key's scale (the plate is drawn for a 340px key): the round is the shaft,
 * the slot below is the bit.
 */
export function Serrure({ className = 'serrure' }: { className?: string }) {
  const id = useIdSvg()
  return (
    <svg className={className} viewBox="0 0 84 140" aria-hidden>
      <defs>
        <FiltreFer id={`${id}-fer`} l={84} h={140} />
        <linearGradient id={`${id}-trou`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" />
          <stop offset="100%" stopColor="#15100c" />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-fer)`}>
        <path transform="scale(1.1667 1.2069)" d={PLAQUE_FER} fill="#fff" />
        {[
          [15, 23],
          [69, 23],
          [15, 117],
          [69, 117],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#fff" />
        ))}
      </g>
      {/* Keyhole: shaft round (r 16) and bit slot (down to the bit's depth) */}
      <path d="M37.5 70L36 98H48L46.5 70A16.1 16.1 0 1 0 37.5 70Z" fill={`url(#${id}-trou)`} />
      <path d="M26 58A16 16 0 0 1 58 58" fill="none" stroke="#000" strokeOpacity=".7" strokeWidth="2" />
      <path d="M28 64A15 15 0 0 0 56 64" fill="none" stroke="#d8d2c6" strokeOpacity=".22" strokeWidth="1" />
    </svg>
  )
}
