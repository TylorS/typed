import type * as SCP from '@fp-ts/core/typeclass/SemiCoproduct'

import { orElse } from '../operator/orElse.js'
import { race, raceAll } from '../operator/race.js'

import { Covariant } from './Covariant.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const SemiCoproductRace: SCP.SemiCoproduct<FxTypeLambda> = {
  coproduct: (s, o) => race(o)(s),
  coproductMany: (fx, collection) => raceAll(fx, ...collection),
  imap: Covariant.imap,
}

export const SemiCoproductOrElse: SCP.SemiCoproduct<FxTypeLambda> = {
  coproduct: (s, o) => orElse(o)(s),
  coproductMany: (fx, collection) =>
    Array.from(collection).reduce((acc, fx) => orElse(fx)(acc), fx),
  imap: Covariant.imap,
}
