import { dual, pipe } from '@fp-ts/core/Function'
import * as B from '@fp-ts/core/typeclass/Bicovariant'

import type { Fx } from '../Fx.js'
import { map } from '../operator/map.js'
import { mapError } from '../operator/mapError.js'

import type { FxTypeLambda } from './TypeLambda.js'

export const bimap: B.Bicovariant<FxTypeLambda>['bimap'] = dual(
  3,
  <R, E, A, E2, B>(self: Fx<R, E, A>, f: (e: E) => E2, g: (a: A) => B) =>
    pipe(self, mapError(f), map(g)),
)

export const Bicovariant: B.Bicovariant<FxTypeLambda> = {
  bimap,
}

export const mapLeft: <E1, E2>(f: (e: E1) => E2) => <R, A>(self: Fx<R, E1, A>) => Fx<R, E2, A> =
  B.mapLeft(Bicovariant)
