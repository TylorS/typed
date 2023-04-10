import { Fx } from './Fx.js'
import { Effect } from './externals.js'
import { fromEffect } from './fromEffect.js'
import { succeed } from './succeed.js'

export function continueWith<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: () => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return Fx((sink) => Effect.flatMap(fx.run(sink), () => f().run(sink)))
}

export function continueWithEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: () => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return continueWith(fx, () => fromEffect(f()))
}

export function startWith<R, E, A, B>(fx: Fx<R, E, A>, b: B): Fx<R, E, A | B> {
  return continueWith(succeed(b), () => fx)
}

export function startWithEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  other: Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return continueWith(fromEffect(other), () => fx)
}
