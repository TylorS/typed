import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Fiber } from '@effect/io/Fiber'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromFiber: <E, A>(fiber: Fiber<E, A>) => Fx<never, E, A> = flow(
  Effect.fromFiber,
  fromEffect,
)
