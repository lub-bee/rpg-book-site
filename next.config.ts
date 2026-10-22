import type { NextConfig } from 'next'

const config: NextConfig = {
  // The book reads content/ at request time (sealed sections depend on the reader's cookies).
  outputFileTracingIncludes: Object.fromEntries(
    ['/', '/sceau', '/api/section', '/icone.svg', '/gaufrage.svg'].map((route) => [route, ['./content/**/*', './node_modules/@iconify-json/game-icons/icons.json']]),
  ),
  // Date shown as "consigned on" on the title page: the day the book was built.
  env: { LIVRE_CONSIGNE_LE: new Date().toISOString() },
  poweredByHeader: false,
}

export default config
