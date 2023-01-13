import type { Cause } from '@effect/io/Cause'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import type { RuntimeFiber } from '@effect/io/Fiber'
import type { Scope } from '@effect/io/Scope'
import type { Context } from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'
import { asap } from '../_internal/RefCounter.js'

export const multicast = <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => new MulticastFx(fx)

export class MulticastFx<R, E, A>
  extends Fx.Variance<R, E, A>
  implements Fx<R, E, A>, Fx.Sink<never, E, A>
{
  protected observers: Array<MulticastObserver<any, E, A>> = []
  protected fiber: RuntimeFiber<never, unknown> | undefined

  constructor(readonly fx: Fx<R, E, A>) {
    super()

    this.event = this.event.bind(this)
    this.error = this.error.bind(this)
  }

  run<R2>(sink: Fx.Sink<R2, E, A>): Effect.Effect<R | R2 | Scope, never, void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const { fx, observers } = this

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    return Effect.gen(function* ($) {
      const deferred = yield* $(Deferred.make<never, void>())
      const context = yield* $(Effect.environment<R | R2>())
      const observer: MulticastObserver<R2, E, A> = {
        sink,
        context,
        deferred,
      }

      if (observers.push(observer) === 1) {
        that.fiber = yield* $(pipe(fx.run(that), Effect.scheduleForked(asap)))
      }

      yield* $(Deferred.await(deferred))

      if (observers.length === 0) {
        yield* $(that.cleanup())
      }
    })
  }

  event(a: A) {
    return Effect.suspendSucceed(() =>
      pipe(
        this.observers.slice(),
        Effect.forEachDiscard((observer) => this.runEvent(a, observer)),
      ),
    )
  }

  error(cause: Cause<E>) {
    return Effect.suspendSucceed(() =>
      pipe(
        this.observers.slice(),
        Effect.forEachDiscard((observer) => this.runError(cause, observer)),
        Effect.tap(() => this.cleanup()),
      ),
    )
  }

  get end(): Effect.Effect<never, never, void> {
    return Effect.suspendSucceed(() =>
      pipe(
        this.observers.slice(),
        Effect.forEachDiscard((observer) => this.runEnd(observer)),
        Effect.tap(() => this.cleanup()),
      ),
    )
  }

  protected runEvent(a: A, observer: MulticastObserver<any, E, A>) {
    return pipe(observer.sink.event(a), Effect.provideEnvironment(observer.context))
  }

  protected runError(cause: Cause<E>, observer: MulticastObserver<any, E, A>) {
    return pipe(
      observer.sink.error(cause),
      Effect.provideEnvironment(observer.context),
      Effect.tap(() => Effect.sync(() => this.removeObserver(observer))),
      Effect.intoDeferred(observer.deferred),
    )
  }

  protected runEnd(observer: MulticastObserver<any, E, A>) {
    return pipe(
      observer.sink.end,
      Effect.provideEnvironment(observer.context),
      Effect.tap(() => Effect.sync(() => this.removeObserver(observer))),
      Effect.intoDeferred(observer.deferred),
    )
  }

  protected removeObserver(observer: MulticastObserver<any, E, A>) {
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

export interface MulticastObserver<R, E, A> {
  readonly sink: Fx.Sink<R, E, A>
  readonly context: Context<R>
  readonly deferred: Deferred.Deferred<never, unknown>
}
