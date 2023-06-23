import type * as Context from '@effect/data/Context'
import type { Trace } from '@effect/data/Debug'
import { identity } from '@effect/data/Function'
import type * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'

import { FxTypeId, Traced } from './Fx.js'
import type { Fx, Sink } from './Fx.js'

export function multicast<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return new MulticastFx(fx)
}

export interface MulticastObserver<R, E, A> {
  readonly sink: Sink<R, E, A>
  readonly context: Context.Context<R>
}

export class MulticastFx<R, E, A> implements Fx<R, E, A>, Sink<never, E, A> {
  readonly [FxTypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }

  /**@internal */
  public observers: Array<MulticastObserver<any, E, A>> = []
  /**@internal */
  public fiber: Fiber.RuntimeFiber<never, void> | undefined

  constructor(readonly fx: Fx<R, E, A>) {
    this.run = this.run.bind(this)
    this.event = this.event.bind(this)
    this.error = this.error.bind(this)
  }

  run<R2>(sink: Sink<R2, E, A>) {
    const { observers } = this

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    return Effect.flatMap(Effect.context<R2>(), (context) =>
      Effect.suspend(() => {
        const observer: MulticastObserver<R2, E, A> = { sink, context }

        const effects: Array<Effect.Effect<R, never, void>> = []

        if (observers.push(observer) === 1) {
          effects.push(Effect.tap(Effect.forkDaemon(that.fx.run(that)), (fiber) => Effect.sync(() => (that.fiber = fiber))))
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        effects.push(Effect.suspend(() => Effect.ensuring(Fiber.await(that.fiber!), that.removeSink(sink))))

        return Effect.all(effects)
      }),
    )
  }

  readonly addTrace = (trace: Trace): Fx<R, E, A> => {
    return Traced<R, E, A>(this.fx, trace)
  }

  event(a: A) {
    if (this.observers.length === 0) {
      return Effect.unit()
    }

    return Effect.suspend(() =>
      Effect.forEachDiscard(this.observers.slice(0), (observer) => this.runEvent(observer, a)),
    )
  }

  error(cause: Cause.Cause<E>) {
    if (this.observers.length === 0) {
      return Effect.unit()
    }

    return Effect.suspend(() =>
      Effect.forEachDiscard(this.observers.slice(0), (observer) => this.runError(observer, cause)),
    )
  }

  protected runEvent<R>(observer: MulticastObserver<R, E, A>, a: A) {
    return Effect.catchAllCause(
      Effect.provideContext(observer.sink.event(a), observer.context),
      () => this.removeSink(observer.sink),
    )
  }

  protected runError<R>(observer: MulticastObserver<R, E, A>, cause: Cause.Cause<E>) {
    return Effect.catchAllCause(
      Effect.provideContext(observer.sink.error(cause), observer.context),
      () => this.removeSink(observer.sink),
    )
  }

  protected removeSink(sink: Sink<any, E, A>) {
    return Effect.suspend(() => {
      const { observers } = this

      if (observers.length === 0) return Effect.unit()

      const index = observers.findIndex((o) => o.sink === sink)

      if (index > -1) {
        observers.splice(index, 1)

        if (observers.length === 0) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const interrupt = Fiber.interrupt(this.fiber!)

          this.fiber = undefined

          return interrupt
        }
      }

      return Effect.unit()
    })
  }
}
