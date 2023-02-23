import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fail: <E>(error: E) => Fx<never, E, never> = flow(Effect.fail, fromEffect)
