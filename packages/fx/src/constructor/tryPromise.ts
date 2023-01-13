import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export const tryPromise: <A>(evaluate: () => Promise<A>) => Fx<never, unknown, A> = flow(
  Effect.tryPromise,
  fromEffect,
)
