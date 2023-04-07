import { millis } from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref'
import * as Schedule from '@effect/io/Schedule'

import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Cause, Scope } from '@typed/fx/internal/externals'

const zero = millis(0)
export const asap = Schedule.delayed(Schedule.once(), () => zero)

export class RefCounter {
  protected count = Ref.unsafeMake(this.initial)
  protected fiber: Fiber.RuntimeFiber<never, void> | undefined

  constructor(readonly initial: number, readonly deferred: Deferred.Deferred<never, void>) {}

  readonly get = Ref.get(this.count)

  readonly increment = pipe(
    this.count,
    Ref.updateAndGet((x) => x + 1),
  )

  readonly decrement = pipe(
    this.count,
    Ref.updateAndGet((x) => Math.max(0, x - 1)),
    Effect.tap(() => this.checkShouldClose),
  )

  readonly wait = Deferred.await(this.deferred)

  readonly refCounted = <R, E, A, R2, B>(
    fx: Fx<R, E, A>,
    sink: Sink<E, A>,
    onComplete: () => Effect.Effect<R2, never, B>,
  ): Effect.Effect<R | R2 | Scope.Scope, never, unknown> =>
    Effect.scopeWith((scope) =>
      pipe(
        fx.observe(sink.event),
        Effect.matchCauseEffect(
          (cause) =>
            Cause.isInterruptedOnly(cause)
              ? Effect.provideService(
                  Effect.zipRight(onComplete(), this.decrement),
                  Scope.Scope,
                  scope,
                )
              : sink.error(cause),
          () =>
            Effect.provideService(
              Effect.zipRight(onComplete(), this.decrement),
              Scope.Scope,
              scope,
            ),
        ),
      ),
    )

  private checkShouldClose = Effect.suspend(() => {
    const interrupt = this.fiber ? Fiber.interrupt(this.fiber) : Effect.unit()

    this.fiber = undefined

    return pipe(
      interrupt,
      Effect.zipParRight(Ref.get(this.count)),
      Effect.flatMap((x) =>
        x === 0 ? Effect.intoDeferred(Effect.unit(), this.deferred) : Effect.unit(),
      ),
      Effect.scheduleForked(asap),
      Effect.tap((fiber) =>
        Effect.sync(() => {
          this.fiber = fiber
        }),
      ),
    )
  })
}

export function withRefCounter<R, E, A, R2, E2, B>(
  initialCount: number,
  f: (counter: RefCounter, scope: Scope.Scope) => Effect.Effect<R, E, A>,
  onEnd: () => Effect.Effect<R2, E2, B>,
): Effect.Effect<R | R2 | Scope.Scope, E | E2, B> {
  return Effect.gen(function* ($) {
    const scope = yield* $(Effect.scope())
    const deferred = yield* $(Deferred.make<never, void>())
    const counter = new RefCounter(initialCount, deferred)

    const fiber = yield* $(Effect.forkScoped(f(counter, scope)))

    yield* $(counter.wait)

    yield* $(Fiber.interrupt(fiber))

    return yield* $(onEnd())
  })
}
