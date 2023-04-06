import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, Scope } from '@typed/fx/internal/_externals'

export const scan: {
  <R, E, A, B>(fx: Fx<R, E, A>, initial: B, f: (acc: B, a: A) => B): Fx<R, E, B>
  <A, B>(initial: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
} = dualWithTrace(
  3,
  (trace) =>
    function scan<R, E, A, B>(fx: Fx<R, E, A>, initial: B, f: (acc: B, a: A) => B): Fx<R, E, B> {
      return new ScanFx(fx, initial, f).traced(trace)
    },
)

export class ScanFx<R, E, A, B> extends BaseFx<R, E, B> {
  readonly name = 'Scan'

  constructor(readonly fx: Fx<R, E, A>, readonly initial: B, readonly f: (acc: B, a: A) => B) {
    super()
  }

  run(sink: Sink<E, B>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return Effect.suspend(() => this.fx.run(new ScanSink(sink, this.initial, this.f)))
  }
}

export class ScanSink<E, A, B> implements Sink<E, A> {
  protected acc: B = this.initial

  constructor(readonly sink: Sink<E, B>, readonly initial: B, readonly f: (acc: B, a: A) => B) {}

  event(value: A) {
    return Effect.suspend(() => this.sink.event((this.acc = this.f(this.acc, value))))
  }

  error: Sink<E, A>['error'] = this.sink.error
  end = this.sink.end
}
