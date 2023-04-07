import { dualWithTrace } from '@effect/data/Debug'
import * as Ref from '@effect/io/Ref'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { Effect, Option, Scope } from '@typed/fx/internal/externals'

/**
 * Runs two Fx in parallel. Events are emitted when `self` emits "sampling" the latest value of `snapshot`.
 * If `snapshot` has not emitted a value yet, the event is dropped. If snapshot has emitted these 2 values are
 * then passed to `f` and the result is emitted.
 */
export const snapshot: {
  <R, E, A, R2, E2, B, C>(self: Fx<R, E, A>, snapshot: Fx<R2, E2, B>, f: (a: A, b: B) => C): Fx<
    R | R2,
    E | E2,
    C
  >
  <A, R2, E2, B, C>(snapshot: Fx<R2, E2, B>, f: (a: A, b: B) => C): <R, E>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, C>
} = dualWithTrace(
  3,
  (trace) =>
    function snapshot<R, E, A, R2, E2, B, C>(
      self: Fx<R, E, A>,
      snapshot: Fx<R2, E2, B>,
      f: (a: A, b: B) => C,
    ): Fx<R | R2, E | E2, C> {
      return new SnapshotFx(self, snapshot, f).traced(trace)
    },
)

export const sample: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, that: Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
  <R2, E2, B>(that: Fx<R2, E2, B>): <R, E, A>(self: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, that: Fx<R2, E2, B>) =>
      snapshot(self, that, (_, b) => b).traced(trace),
)

export class SnapshotFx<R, E, A, R2, E2, B, C> extends BaseFx<R | R2, E | E2, C> {
  readonly name = 'Snapshot'

  constructor(
    readonly self: Fx<R, E, A>,
    readonly snapshot: Fx<R2, E2, B>,
    readonly f: (a: A, b: B) => C,
  ) {
    super()
  }

  run(sink: Sink<E | E2, C>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    const { f, self, snapshot } = this

    return Effect.gen(function* ($) {
      const ref = yield* $(Ref.make(Option.none<B>()))

      yield* $(Effect.forkScoped(snapshot.observe((b) => Ref.set(ref, Option.some(b)))))

      return yield* $(
        self.run(
          Sink(
            (a) =>
              Effect.gen(function* ($) {
                const b = yield* $(Ref.get(ref))

                return Option.match(b, Effect.unit, (b) => sink.event(f(a, b)))
              }),
            sink.error,
            sink.end,
          ),
        ),
      )
    })
  }
}
