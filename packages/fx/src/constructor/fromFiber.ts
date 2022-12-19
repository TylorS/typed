import * as Effect from '@effect/io/Effect'
import { Fiber } from '@effect/io/Fiber'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromFiber: <E, A>(fiber: Fiber<E, A>) => Fx<never, E, A> = flow(
  Effect.fromFiber,
  fromEffect,
)
