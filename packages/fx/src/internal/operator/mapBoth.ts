import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Effect, Cause, Scope } from '@typed/fx/internal/_externals'
import { isMap } from '@typed/fx/internal/operator/map'

export const mapBoth: {
  <R, E, E2, A, B>(fx: Fx<R, E, A>, f: (a: E) => E2, g: (a: A) => B): Fx<R, E2, B>
  <E, E2, A, B>(f: (a: E) => E2, g: (a: A) => B): <R>(fx: Fx<R, E, A>) => Fx<R, E2, B>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, E2, A, B>(fx: Fx<R, E, A>, f: (a: E) => E2, g: (a: A) => B) =>
      MapBothFx.make(fx, f, g).traced(trace),
)

export class MapBothFx<R, E, E2, A, B> extends BaseFx<R, E2, B> {
  readonly name = 'MapBoth' as const

  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: E) => E2, readonly g: (a: A) => B) {
    super()
  }

  run(sink: Sink<E2, B>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.fx.run(
      Sink(
        (a) => sink.event(this.g(a)),
        (e) => sink.error(Cause.map(e, this.f)),
        sink.end,
      ),
    )
  }

  static make<R, E, E2, A, B>(fx: Fx<R, E, A>, f: (e: E) => E2, g: (a: A) => B): Fx<R, E2, B> {
    // Covariant fusion
    if (isMap(fx)) {
      return new MapBothFx(fx.fx, f, (a) => g(fx.f(a)))
    }

    // Bicovariant fusion
    if (isBimap(fx)) {
      return new MapBothFx(
        fx.fx,
        (e) => f(fx.f(e)),
        (a) => g(fx.g(a)),
      )
    }

    return new MapBothFx(fx, f, g)
  }
}

export function isBimap<R, E, A>(fx: Fx<R, E, A>): fx is MapBothFx<R, unknown, E, unknown, A> {
  return fx instanceof MapBothFx
}
