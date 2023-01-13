import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const fail: <E>(error: E) => Fx<never, E, never> = flow(Effect.fail, fromEffect)
