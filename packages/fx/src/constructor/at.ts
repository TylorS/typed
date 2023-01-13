import * as Effect from '@effect/io/Effect'
import type { Duration } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'

import { fromEffect } from './fromEffect.js'

export function at<A>(delay: Duration, value: A): Fx<never, never, A> {
  return pipe(Effect.sleep(delay), Effect.as(value), fromEffect)
}
