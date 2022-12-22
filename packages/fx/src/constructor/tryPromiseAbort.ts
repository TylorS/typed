import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const tryPromiseInterrupt: <A>(
  evaluate: (signal: AbortSignal) => Promise<A>,
) => Fx<never, unknown, A> = flow(Effect.tryPromiseInterrupt, fromEffect)
