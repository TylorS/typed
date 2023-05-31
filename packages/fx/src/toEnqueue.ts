import * as Effect from '@effect/io/Effect'
import * as Q from '@effect/io/Queue'
import * as Scope from '@effect/io/Scope'

import { Fx } from './Fx.js'
import { observe } from './observe.js'

export function toEnqueue<R, E, A>(
  fx: Fx<R, E, A>,
  enqueue: Q.Enqueue<A>,
): Effect.Effect<R | Scope.Scope, E, void> {
  return observe(fx, enqueue.offer)
}
