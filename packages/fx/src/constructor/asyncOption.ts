import { flow } from '@effect/data/Function'
import type { Option } from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import type { FiberId } from '@effect/io/Fiber/Id'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const asyncOption: <R, E, A>(
  register: (callback: (_: Effect.Effect<R, E, A>) => void) => Option<Effect.Effect<R, E, A>>,
  blockingOn?: FiberId | undefined,
) => Fx<R, E, A> = flow(Effect.asyncOption, fromEffect)
