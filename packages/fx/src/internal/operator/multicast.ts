import { methodWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import type { Cause } from '@effect/io/Cause'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import type { RuntimeFiber } from '@effect/io/Fiber'
import type { Scope } from '@effect/io/Scope'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { asap } from '@typed/fx/internal/RefCounter'

export const multicast: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> =>
      new MulticastFx(fx, 'Multicast', false).traced(trace),
)

export class MulticastFx<R, E, A, Name extends string>
  extends BaseFx<R, E, A>
  implements Sink<E, A>
{
  readonly observers: Array<MulticastObserver<E, A>> = []
  protected fiber: RuntimeFiber<never, unknown> | undefined
  protected start: Effect.Effect<R | Scope, never, Fiber.RuntimeFiber<never, unknown>>

  constructor(readonly fx: Fx<R, E, A>, readonly name: Name, readonly sync: boolean) {
    super()
    this.event = this.event.bind(this)
    this.error = this.error.bind(this)
    this.end = this.end.bind(this)

    this.start = sync ? Effect.forkScoped(fx.run(this)) : Effect.scheduleForked(fx.run(this), asap)
  }

  run(sink: Sink<E, A>): Effect.Effect<R | Scope, never, void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const { observers, start } = this

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    return Effect.gen(function* ($) {
      const deferred = yield* $(Deferred.make<never, void>())
      const observer: MulticastObserver<E, A> = {
        sink,
        deferred,
      }

      const total = observers.push(observer)

      if (total === 1) {
        that.fiber = yield* $(start)
      }

      yield* $(Deferred.await(deferred))

      if (observers.length === 0) {
        yield* $(that.cleanup())
      }
    })
  }

  event(a: A) {
    return Effect.suspend(() =>
      Effect.forEachParDiscard(this.observers.slice(0), (observer) => this.runEvent(a, observer)),
    )
  }

  error(cause: Cause<E>) {
    return Effect.suspend(() =>
      pipe(
        Effect.forEachParDiscard(this.observers.slice(0), (observer) =>
          this.runError(cause, observer),
        ),
        Effect.tap(() => this.cleanup()),
      ),
    )
  }

  end() {
    return Effect.suspend(() =>
      pipe(
        Effect.forEachParDiscard(this.observers.slice(0), (observer) => this.runEnd(observer)),
        Effect.tap(() => this.cleanup()),
      ),
    )
  }

  protected runEvent(a: A, observer: MulticastObserver<E, A>) {
    return observer.sink.event(a)
  }

  protected runError(cause: Cause<E>, observer: MulticastObserver<E, A>) {
    return pipe(
      observer.sink.error(cause),
      Effect.tap(() => Effect.sync(() => this.removeObserver(observer))),
      Effect.intoDeferred(observer.deferred),
    )
  }

  protected runEnd(observer: MulticastObserver<E, A>) {
    return pipe(
      observer.sink.end(),
      Effect.tap(() => Effect.sync(() => this.removeObserver(observer))),
      Effect.intoDeferred(observer.deferred),
    )
  }

  protected removeObserver(observer: MulticastObserver<E, A>) {
    const { observers } = this
    const index = observers.indexOf(observer)

    if (index > -1) {
      observers.splice(index, 1)
    }
  }

  protected cleanup() {
    return this.fiber
      ? pipe(
          Fiber.interrupt(this.fiber),
          Effect.tap(() => Effect.sync(() => (this.fiber = undefined))),
        )
      : Effect.unit()
  }
}

export interface MulticastObserver<E, A> {
  readonly sink: Sink<E, A>
  readonly deferred: Deferred.Deferred<never, unknown>
}
