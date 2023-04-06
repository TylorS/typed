import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Effect, Scope } from '@typed/fx/internal/_externals'

export const mapAccum: {
  <R, E, A, B, C>(fx: Fx<R, E, A>, initial: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
  <A, B, C>(initial: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(
    fx: Fx<R, E, A>,
  ) => Fx<R, E, C>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, B, C>(fx: Fx<R, E, A>, initial: B, f: (acc: B, a: A) => readonly [C, B]) =>
      new MapAccumFx(fx, initial, f).traced(trace),
)

export class MapAccumFx<R, E, A, B, C> extends BaseFx<R, E, C> {
  readonly name = 'MapAccum'

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly initial: B,
    readonly f: (acc: B, a: A) => readonly [C, B],
  ) {
    super()
  }

  run(sink: Sink<E, C>): Effect.Effect<R | Scope.Scope, never, unknown> {
    return Effect.suspend(() => this.fx.run(new MapAccumSink(sink, this.initial, this.f)))
  }
}

export class MapAccumSink<E, A, B, C> implements Sink<E, A> {
  protected acc: B = this.initial

  constructor(
    readonly sink: Sink<E, C>,
    readonly initial: B,
    readonly f: (acc: B, a: A) => readonly [C, B],
  ) {}

  event(value: A) {
    return Effect.suspend(() => {
      const [c, b] = this.f(this.acc, value)
      this.acc = b
      return this.sink.event(c)
    })
  }

  error: Sink<E, A>['error'] = this.sink.error
  end = this.sink.end
}
