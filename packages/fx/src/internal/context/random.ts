import { methodWithTrace } from '@effect/data/Debug'

import { Fx } from '../Fx.js'

import { Effect, Random } from '@typed/fx/internal/_externals'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'

export const random: (_: void) => Fx<Random.Random, never, Random.Random> = methodWithTrace(
  (trace) => () => fromEffect(Effect.random()).traced(trace),
)
