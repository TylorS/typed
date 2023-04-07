import { methodWithTrace } from '@effect/data/Debug'

import { Fx } from '../Fx.js'

import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import { Effect, Random } from '@typed/fx/internal/externals'

export const random: (_: void) => Fx<Random.Random, never, Random.Random> = methodWithTrace(
  (trace) => () => fromEffect(Effect.random()).traced(trace),
)
