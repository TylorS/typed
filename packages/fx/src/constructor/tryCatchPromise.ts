import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const tryCatchPromise: <E, A>(
  evaluate: () => Promise<A>,
  onReject: (reason: unknown) => E,
) => Fx<never, E, A> = flow(Effect.tryCatchPromise, fromEffect)
