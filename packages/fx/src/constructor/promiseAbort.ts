import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const promiseInterrupt: <A>(
  evaluate: (controller: AbortSignal) => Promise<A>,
) => Fx<never, never, A> = flow(Effect.promiseInterrupt, fromEffect)
