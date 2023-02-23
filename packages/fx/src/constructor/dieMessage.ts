import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const dieMessage: (message: string) => Fx<never, never, never> = flow(
  Effect.dieMessage,
  fromEffect,
)
