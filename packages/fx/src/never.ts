import * as Effect from '@effect/io/Effect'

import { Fx } from './Fx.js'

export function never<E = never, A = never>(): Fx<never, E, A> {
  return Fx<never, E, A>(() => Effect.never())
}
