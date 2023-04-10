import * as Cause from '@effect/io/Cause'
import type { FiberId } from '@effect/io/Fiber/Id'

import { Fx } from './Fx.js'

export function failCause<E>(cause: Cause.Cause<E>): Fx<never, E, never> {
  return Fx((sink) => sink.error(cause))
}

export function fail<E>(error: E): Fx<never, E, never> {
  return failCause(Cause.fail(error))
}

export function interrupt(id: FiberId): Fx<never, never, never> {
  return Fx((sink) => sink.error(Cause.interrupt(id)))
}
