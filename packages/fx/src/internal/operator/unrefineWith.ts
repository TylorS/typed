import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Sink } from '@typed/fx/internal/Fx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Effect, identity, pipe } from '@typed/fx/internal/_externals'
import type { Option, Scope } from '@typed/fx/internal/_externals'

export const unrefineWith: {
  <E2, E, E3>(f: (defect: unknown) => Option.Option<E2>, g: (e: E) => E3): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R, E2 | E3, A>
  <R, E, A, E2, E3>(
    self: Fx<R, E, A>,
    f: (defect: unknown) => Option.Option<E2>,
    g: (e: E) => E3,
  ): Fx<R, E2 | E3, A>
} = dualWithTrace(
  3,
  (trace) =>
    function unrefineWith<R, E, A, E2, E3>(
      self: Fx<R, E, A>,
      f: (defect: unknown) => Option.Option<E2>,
      g: (e: E) => E3,
    ): Fx<R, E2 | E3, A> {
      return new UnrefineWithFx(self, f, g).traced(trace)
    },
)

export const unrefine: {
  <E2, E>(f: (defect: unknown) => Option.Option<E2>): <R, A>(self: Fx<R, E, A>) => Fx<R, E | E2, A>

  <R, E, A, E2>(self: Fx<R, E, A>, f: (defect: unknown) => Option.Option<E2>): Fx<R, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, E2>(self: Fx<R, E, A>, f: (defect: unknown) => Option.Option<E2>) =>
      unrefineWith(self, f, identity).traced(trace),
)

class UnrefineWithFx<R, E, A, E2, E3> extends BaseFx<R, E2 | E3, A> {
  readonly name = 'UnrefineWith'

  constructor(
    readonly self: Fx<R, E, A>,
    readonly f: (defect: unknown) => Option.Option<E2>,
    readonly g: (e: E) => E3,
  ) {
    super()
  }

  run(sink: Sink<E2 | E3, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return this.self.run(
      Sink(
        sink.event,
        (cause) =>
          pipe(
            Effect.failCause(cause),
            Effect.unrefineWith(this.f, this.g),
            Effect.catchAllCause(sink.error),
          ),
        sink.end,
      ),
    )
  }
}
