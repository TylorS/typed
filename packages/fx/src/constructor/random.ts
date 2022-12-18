import * as Effect from '@effect/io/Effect'
import { Random } from '@effect/io/Random'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const random: Fx<never, never, Random> = pipe(Effect.random(), fromEffect)
