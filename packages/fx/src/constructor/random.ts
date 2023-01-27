import * as Effect from '@effect/io/Effect'
import type { Random } from '@effect/io/Random'
import { pipe } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const random: Fx<never, never, Random> = pipe(Effect.random(), fromEffect)
