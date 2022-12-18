import * as Effect from '@effect/io/Effect'
import { FiberId } from '@effect/io/Fiber/Id'
import { Either } from '@fp-ts/data/Either'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const asyncInterrupt: <R, E, A>(
  register: (
    callback: (effect: Effect.Effect<R, E, A>) => void,
  ) => Either<Effect.Effect<R, never, void>, Effect.Effect<R, E, A>>,
  blockingOn?: FiberId | undefined,
) => Fx<R, E, A> = flow(Effect.asyncInterrupt, fromEffect)
