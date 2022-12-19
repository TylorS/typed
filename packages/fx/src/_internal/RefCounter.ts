import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { FiberRefs } from '@effect/io/FiberRefs'
import * as Ref from '@effect/io/Ref'
import { Scope } from '@effect/io/Scope'
import { pipe } from '@fp-ts/data/Function'

import { forkWithFiberRefs } from './withFiberRefs.js'

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
  f: (counter: RefCounter, refs: FiberRefs) => Effect.Effect<R, E, A>,
  onEnd: Effect.Effect<R2, E2, B>,
): Effect.Effect<R | R2 | Scope, E | E2, B> {
  return Effect.gen(function* ($) {
    const fiberRefs = yield* $(Effect.getFiberRefs())
    const deferred = yield* $(Deferred.make<never, void>())
    const counter = new RefCounter(initialCount, deferred)
    const fiber = yield* $(forkWithFiberRefs(fiberRefs)(f(counter, fiberRefs)))

    yield* $(counter.wait)
    yield* $(Fiber.interrupt(fiber))

    return yield* $(onEnd)
  })
}
