import * as Cause from '@effect/io/Cause'
import type * as CP from '@fp-ts/core/typeclass/Coproduct'

import type { Fx } from '../Fx.js'
import { failCause } from '../constructor/failCause.js'
import { never } from '../constructor/never.js'
import { orElse } from '../operator/orElse.js'
import { raceAll } from '../operator/race.js'

import { SemiCoproductRace, SemiCoproductOrElse } from './SemiCoproduct.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const CoproductRace: CP.Coproduct<FxTypeLambda> = {
  ...SemiCoproductRace,
  zero: () => never,
  coproductAll: <R, E, A>(collection: Iterable<Fx<R, E, A>>) =>
    raceAll<readonly Fx<R, E, A>[]>(...collection),
}

export const CoproductOrElse: CP.Coproduct<FxTypeLambda> = {
  ...SemiCoproductOrElse,
  zero: () => failCause(Cause.empty),
  coproductAll: <R, E, A>(collection: Iterable<Fx<R, E, A>>) =>
    Array.from(collection).reduce((acc, fx) => orElse(fx)(acc), CoproductOrElse.zero()),
}
