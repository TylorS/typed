import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const sync: <A>(evaluate: () => A) => Fx<never, never, A> = flow(Effect.sync, fromEffect)
