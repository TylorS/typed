import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref/Synchronized'
import * as Schedule from '@effect/io/Schedule'
import { Scope } from '@effect/io/Scope'
import { millis } from '@fp-ts/data/Duration'
import { pipe } from '@fp-ts/data/Function'

const asap = pipe(
  Schedule.once(),
  Schedule.delayed(() => millis(0)),
)

export class RefCounter {
  protected count = Ref.unsafeMake(this.initial)
  protected fiber: Fiber.RuntimeFiber<never, void> | undefined

  constructor(readonly initial: number, readonly deferred: Deferred.Deferred<never, void>) {}

  readonly get = Ref.get(this.count)

  readonly increment = pipe(
    this.count,
    Ref.updateAndGetEffect((x) => Effect.sync(() => x + 1)),
  )

  readonly decrement = pipe(
    this.count,
    Ref.updateEffect((x) => Effect.sync(() => Math.max(0, x - 1))),
    Effect.tap(() => this.checkShouldClose),
  )

  readonly wait = Deferred.await(this.deferred)

  private checkShouldClose = Effect.suspendSucceed(() => {
    const interrupt = this.fiber ? Fiber.interrupt(this.fiber) : Effect.unit()

    return pipe(
      interrupt,
      Effect.flatMap(() => Ref.get(this.count)),
      Effect.flatMap((x) =>
        Effect.sync(() => {
          if (x === 0) Deferred.unsafeDone(Effect.unit())(this.deferred)
        }),
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
  f: (counter: RefCounter) => Effect.Effect<R, E, A>,
  onEnd: Effect.Effect<R2, E2, B>,
): Effect.Effect<R | R2 | Scope, E | E2, B> {
  return Effect.gen(function* ($) {
    const deferred = yield* $(Deferred.make<never, void>())
    const counter = new RefCounter(initialCount, deferred)

    yield* $(Effect.forkScoped(f(counter)))

    yield* $(counter.wait)

    return yield* $(onEnd)
  })
}
