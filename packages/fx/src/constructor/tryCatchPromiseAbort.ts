import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const tryCatchPromiseInterrupt: <E, A>(
  evaluate: (signal: AbortSignal) => Promise<A>,
  onReject: (reason: unknown) => E,
) => Fx<never, E, A> = flow(Effect.tryCatchPromiseInterrupt, fromEffect)
