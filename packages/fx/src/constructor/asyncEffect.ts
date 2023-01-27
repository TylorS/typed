import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const asyncEffect: <R, E, A, R2, E2, X>(
  register: (callback: (_: Effect.Effect<R, E, A>) => void) => Effect.Effect<R2, E2, X>,
) => Fx<R | R2, E | E2, A> = flow(Effect.asyncEffect, fromEffect)
