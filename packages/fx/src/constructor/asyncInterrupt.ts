import * as Effect from '@effect/io/Effect'
import type { FiberId } from '@effect/io/Fiber/Id'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const asyncInterrupt = <R, E, A>(
  register: (callback: (effect: Effect.Effect<R, E, A>) => void) => Effect.Effect<R, never, void>,
  blockingOn?: FiberId | undefined,
): Fx<R, E, A> => fromEffect(Effect.asyncInterrupt<R, E, A>(register, blockingOn))
