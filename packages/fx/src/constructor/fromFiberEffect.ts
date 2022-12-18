import * as Effect from '@effect/io/Effect'
import { Fiber } from '@effect/io/Fiber'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromFiberEffect = flow(Effect.fromFiberEffect, fromEffect) as <R, E, E2, A>(
  fiber: Effect.Effect<R, E, Fiber<E2, A>>,
) => Fx<R, E | E2, A>
