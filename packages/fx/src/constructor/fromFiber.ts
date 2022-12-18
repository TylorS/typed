import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'
import { Fiber } from 'node_modules/@effect/io/Fiber.js'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fromFiber: <E, A>(fiber: Fiber<E, A>) => Fx<never, E, A> = flow(
  Effect.fromFiber,
  fromEffect,
)
