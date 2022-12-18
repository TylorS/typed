import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const tryCatchPromiseAbort: <E, A>(
  evaluate: (signal: AbortSignal) => Promise<A>,
  onReject: (reason: unknown) => E,
) => Fx<never, E, A> = flow(Effect.tryCatchPromiseAbort, fromEffect)
