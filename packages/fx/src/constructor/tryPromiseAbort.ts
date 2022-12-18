import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const tryPromiseAbort: <A>(
  evaluate: (signal: AbortSignal) => Promise<A>,
) => Fx<never, unknown, A> = flow(Effect.tryPromiseAbort, fromEffect)
