import type { Cause } from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const failCauseSync: <E>(cause: () => Cause<E>) => Fx<never, E, never> = flow(
  Effect.failCauseSync,
  fromEffect,
)
