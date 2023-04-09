import * as Effect from '@effect/io/Effect'

import { Fx } from '@typed/fx/Fx'

export function empty<A = never>(): Fx<never, never, A> {
  return Fx(() => Effect.unit())
}
