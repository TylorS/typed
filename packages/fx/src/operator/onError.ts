import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

import { onDone } from './onDone.js'

export function onError<E, R2, E2, B>(
  f: (e: E) => Effect.Effect<R2, E2, B>,
): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A> {
  return onDone(f, Effect.unit())
}
