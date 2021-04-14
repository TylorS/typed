import { none, Option, some } from 'fp-ts/Option'

/**
 * A small helper for parsing an integer
 */
export function parseInteger(s: string): Option<number> {
  const i = parseInt(s, 10)

  return Number.isNaN(i) ? none : some(i)
}
