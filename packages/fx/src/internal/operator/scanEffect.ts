import { dualWithTrace } from '@effect/data/Debug'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import type { Context, Scope } from '@typed/fx/internal/externals'
import { Effect, pipe } from '@typed/fx/internal/externals'

export const scanEffect: {
  <R, E, A, B, R2, E2>(
    self: Fx<R, E, A>,
    initial: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, B>

  <A, B, R2, E2>(initial: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, B>
} = dualWithTrace(
  3,
  (trace) =>
    function scanEffect<R, E, A, B, R2, E2>(
      self: Fx<R, E, A>,
      initial: B,
      f: (acc: B, a: A) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, B> {
      return new ScanEffectFx<R, E, A, B, R2, E2>(self, initial, f).traced(trace)
    },
)

export class ScanEffectFx<R, E, A, B, R2, E2> extends BaseFx<R | R2, E | E2, B> {
  readonly name = 'ScanEffect'

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly initial: B,
    readonly f: (acc: B, a: A) => Effect.Effect<R2, E2, B>,
  ) {
    super()
  }

  run(sink: Sink<E | E2, B>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return Effect.contextWithEffect((ctx: Context.Context<R | R2 | Scope.Scope>) => {
      // Use Semaphore to ensure that only one effect is running at a time
      const lock = Effect.unsafeMakeSemaphore(1).withPermits(1)

      return this.fx.run(
        new ScanEffectSink<E | E2, A, B>(sink, this.initial, (b, a) =>
          Effect.provideContext(lock(this.f(b, a)), ctx),
        ),
      )
    })
  }
}

export class ScanEffectSink<E, A, B> implements Sink<E, A> {
  protected acc: B = this.initial

  constructor(
    readonly sink: Sink<E, B>,
    readonly initial: B,
    readonly f: (acc: B, a: A) => Effect.Effect<never, E, B>,
  ) {}

  event(value: A) {
    return pipe(
      this.f(this.acc, value),
      Effect.matchCauseEffect(this.sink.error, (b) => this.sink.event((this.acc = b))),
    )
  }

  error: Sink<E, A>['error'] = this.sink.error
  end = this.sink.end
}
