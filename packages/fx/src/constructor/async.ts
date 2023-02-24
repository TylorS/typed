import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { FiberId } from '@effect/io/Fiber/Id'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const async: <R, E, A>(
  register: (callback: (_: Effect.Effect<R, E, A>) => void) => void,
  blockingOn?: FiberId | undefined,
) => Fx<R, E, A> = flow(Effect.async, fromEffect)
