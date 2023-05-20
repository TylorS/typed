import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import type { Fx } from './Fx.js'
import { toArray } from './toArray.js'

export function toReadonlyArray<R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R | Scope, E, ReadonlyArray<A>> {
  return toArray(fx)
}
