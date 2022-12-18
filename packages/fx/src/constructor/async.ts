import * as Effect from '@effect/io/Effect'
import { FiberId } from '@effect/io/Fiber/Id'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const async: <R, E, A>(
  register: (callback: (_: Effect.Effect<R, E, A>) => void) => void,
  blockingOn?: FiberId | undefined,
) => Fx<R, E, A> = flow(Effect.async, fromEffect)
