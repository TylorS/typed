import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import { fromFxEffect } from '../conversion/fromFxEffect.js'

import type { Fx } from '@typed/fx/internal/Fx'

export const promiseFx: <R, E, A>(promise: () => Promise<Fx<R, E, A>>) => Fx<R, E, A> =
  methodWithTrace((trace) => (promise) => fromFxEffect(Effect.promise(promise)).traced(trace))
