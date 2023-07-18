import * as Effect from '@effect/io/Effect'

import { Fx } from './Fx.js'

export function empty<A = never>(): Fx<never, never, A> {
  return Fx(() => Effect.unit)
}
