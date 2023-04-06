import { dualWithTrace } from '@effect/data/Debug'

import { Effect, Scope } from '../_externals.js'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'

export const map: {
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B) =>
      MapFx.make(fx, f).traced(trace),
)

export class MapFx<R, E, A, B> extends BaseFx<R, E, B> {
  readonly name = 'Map' as const

  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => B) {
    super()
  }

  run(sink: Sink<E, B>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(Sink((a) => sink.event(this.f(a)), sink.error, sink.end))
  }

  static make<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> {
    // Covariant fusion
    if (isMap(fx)) {
      return new MapFx(fx.fx, (a) => f(fx.f(a)))
    }

    return new MapFx(fx, f)
  }
}

export function isMap<R, E, A>(fx: Fx<R, E, A>): fx is MapFx<R, E, unknown, A> {
  return fx instanceof MapFx
}
