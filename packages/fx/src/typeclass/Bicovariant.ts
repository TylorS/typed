import * as B from '@fp-ts/core/typeclass/Bicovariant'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { map } from '../operator/map.js'
import { mapError } from '../operator/mapError.js'

import { FxTypeLambda } from './TypeLambda.js'

export const Bicovariant: B.Bicovariant<FxTypeLambda> = {
  bimap: (f, g) => (fa) => pipe(fa, mapError(f), map(g)),
}

export const mapLeft: <E1, E2>(f: (e: E1) => E2) => <R, A>(self: Fx<R, E1, A>) => Fx<R, E2, A> =
  B.mapLeft(Bicovariant)
