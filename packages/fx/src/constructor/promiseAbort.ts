import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const promiseInterrupt: <A>(
  evaluate: (controller: AbortSignal) => Promise<A>,
) => Fx<never, never, A> = flow(Effect.promiseInterrupt, fromEffect)
