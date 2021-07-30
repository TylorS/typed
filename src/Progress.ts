import * as E from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import * as S from 'fp-ts/Semigroup'
import * as Sh from 'fp-ts/Show'

import { deepEqualsEq } from './Eq'
import { pipe } from './function'

export interface Progress {
  readonly loaded: number
  readonly total: O.Option<number>
}

export const progress = (loaded: number, total: O.Option<number> = O.none): Progress => ({
  loaded,
  total,
})

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

export const Eq: E.Eq<Progress> = {
  equals: (s: Progress) => (f: Progress) => deepEqualsEq.equals(s)(f),
}

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
