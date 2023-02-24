import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const dieSync: (defect: () => unknown) => Fx<never, never, never> = flow(
  Effect.dieSync,
  fromEffect,
)
