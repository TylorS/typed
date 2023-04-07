import { dualWithTrace } from '@effect/data/Debug'
import type { Predicate } from '@effect/data/Predicate'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, Scope } from '@typed/fx/internal/externals'

export const skipAfter: {
  <R, E, A>(self: Fx<R, E, A>, predicate: Predicate<A>): Fx<R, E, A>
  <A>(predicate: Predicate<A>): <R, E>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, predicate: Predicate<A>) =>
      new SkipAfterFx(self, predicate).traced(trace),
)

export class SkipAfterFx<R, E, A> extends BaseFx<R, E, A> {
  readonly name = 'SkipAfter' as const

  constructor(readonly self: Fx<R, E, A>, readonly prediate: Predicate<A>) {
    super()
  }

  run(sink: Sink<E, A>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return Effect.suspend(() => this.self.run(new SkipAfterSink(sink, this.prediate)))
  }
}

export class SkipAfterSink<E, A> implements Sink<E, A> {
  protected running = true

  constructor(readonly sink: Sink<E, A>, readonly predicate: Predicate<A>) {}

  event = (a: A) => {
    const passed = this.predicate(a)

    if (this.running) {
      if (passed) {
        this.running = false
      } else {
        return this.sink.event(a)
      }
    }

    return Effect.unit()
  }

  error: Sink<E, A>['error'] = this.sink.error
  end = this.sink.end
}
