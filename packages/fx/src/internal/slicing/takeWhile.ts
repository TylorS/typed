import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, Scope } from '@typed/fx/internal/_externals'

export const takeWhile: {
  <R, E, A>(self: Fx<R, E, A>, predicate: (value: A) => boolean): Fx<R, E, A>
  <A>(predicate: (value: A) => boolean): <R, E>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, predicate: (value: A) => boolean) =>
      new TakeWhileFx(self, predicate).traced(trace),
)

export class TakeWhileFx<R, E, A> extends BaseFx<R, E, A> {
  readonly name = 'TakeWhile'

  constructor(readonly self: Fx<R, E, A>, readonly predicate: (value: A) => boolean) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return Effect.suspend(() => this.self.run(new TakeWhileSink(sink, this.predicate)))
  }
}

export class TakeWhileSink<E, A> implements Sink<E, A> {
  constructor(readonly sink: Sink<E, A>, readonly predicate: (value: A) => boolean) {}

  event(value: A) {
    if (this.predicate(value)) {
      return this.sink.event(value)
    }

    return this.sink.end()
  }

  error: Sink<E, A>['error'] = this.sink.error
  end = this.sink.end
}
