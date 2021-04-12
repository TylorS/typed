import { none, Option, some } from 'fp-ts/Option'

export function parseInteger(s: string): Option<number> {
  const i = parseInt(s, 10)

  return Number.isNaN(i) ? none : some(i)
}
