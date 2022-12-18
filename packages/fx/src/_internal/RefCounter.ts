import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Ref from '@effect/io/Ref'
import { pipe } from '@fp-ts/data/Function'
import { Scope } from 'node_modules/@effect/io/Scope.js'

export class RefCounter {
  protected count = Ref.unsafeMake(this.initial)

  constructor(readonly initial: number, readonly deferred: Deferred.Deferred<never, void>) {}

  readonly get = Ref.get(this.count)

  readonly increment = pipe(
    this.count,
    Ref.updateAndGet((x) => x + 1),
  )

  readonly decrement = pipe(
    this.count,
    Ref.updateAndGet((x) => Math.max(0, x - 1)),
    Effect.tap((x) =>
      Effect.sync(() => {
        if (x === 0) Deferred.unsafeDone(Effect.unit())(this.deferred)
      }),
    ),
  )

  readonly wait = Deferred.await(this.deferred)
}

export function withRefCounter<R, E, A, R2, E2, B>(
  initialCount: number,
  f: (counter: RefCounter) => Effect.Effect<R, E, A>,
  onEnd: () => Effect.Effect<R2, E2, B>,
): Effect.Effect<R | R2 | Scope, E | E2, B> {
  return Effect.gen(function* ($) {
    const deferred = yield* $(Deferred.make<never, void>())
    const counter = new RefCounter(initialCount, deferred)
    const fiber = yield* $(Effect.forkScoped(f(counter)))

    yield* $(counter.wait)
    yield* $(Fiber.interrupt(fiber))

    return yield* $(onEnd())
  })
}
