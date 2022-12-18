import * as Effect from '@effect/io/Effect'
import { FiberId } from '@effect/io/Fiber/Id'
import { flow } from '@fp-ts/data/Function'
import { Option } from '@fp-ts/data/Option'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const asyncOption: <R, E, A>(
  register: (callback: (_: Effect.Effect<R, E, A>) => void) => Option<Effect.Effect<R, E, A>>,
  blockingOn?: FiberId | undefined,
) => Fx<R, E, A> = flow(Effect.asyncOption, fromEffect)
