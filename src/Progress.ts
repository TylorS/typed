/**
 * Progress is a data structure to represent loading some data.
 *
 * @since 0.9.2
 */
import * as E from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import * as S from 'fp-ts/Semigroup'
import * as Sh from 'fp-ts/Show'

import { deepEqualsEq } from './Eq'
import { pipe } from './function'

/**
 * @since 0.9.2
 * @category Model
 */
export interface Progress {
  readonly loaded: number
  readonly total: O.Option<number>
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const progress = (loaded: number, total: O.Option<number> = O.none): Progress => ({
  loaded,
  total,
})

/**
 * @since 0.9.2
 * @category Instance
 */
export const Show: Sh.Show<Progress> = {
  show: (p: Progress): string =>
    pipe(
      p.total,
      O.matchW(
        () => `${p.loaded}`,
        () => `${p.loaded}/${p.total}`,
      ),
    ),
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Eq: E.Eq<Progress> = {
  equals: (s: Progress) => (f: Progress) => deepEqualsEq.equals(s)(f),
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Semigroup: S.Semigroup<Progress> = {
  concat:
    (s: Progress) =>
    (f: Progress): Progress =>
      pipe(
        O.Do,
        O.apS('sTotal', s.total),
        O.apS('fTotal', f.total),
        O.map(({ sTotal, fTotal }) => progress(f.loaded + s.loaded, O.some(fTotal + sTotal))),
        O.getOrElse(() => progress(f.loaded + s.loaded)),
      ),
}
