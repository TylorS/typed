import type * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import type { Scope } from '@effect/io/Scope'
import { pipe } from '@fp-ts/core/Function'
import * as Option from '@fp-ts/core/Option'
import * as MutableRef from '@fp-ts/data/MutableRef'

import type { Fx } from '../Fx.js'
import { asap } from '../_internal/RefCounter.js'

import { MulticastFx } from './multicast.js'

export function hold<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return new HoldFx(fx, MutableRef.make(Option.none()))
}

export function hold_<R, E, A>(fx: Fx<R, E, A>, value: MutableRef.MutableRef<Option.Option<A>>) {
  return new HoldFx(fx, value)
}

export class HoldFx<R, E, A> extends MulticastFx<R, E, A> implements Fx<R, E, A> {
  protected pendingSinks: Array<readonly [Fx.Sink<any, E, A>, A[]]> = []
  protected scheduledFiber: Fiber.RuntimeFiber<any, any> | undefined = undefined

  constructor(
    readonly fx: Fx<R, E, A>,
    protected current: MutableRef.MutableRef<Option.Option<A>>,
  ) {
    super(fx)

    this.event = this.event.bind(this)
    this.error = this.error.bind(this)
  }

  run<R2>(sink: Fx.Sink<R2, E, A>): Effect.Effect<Scope | R | R2, never, void> {
    return Effect.suspendSucceed(() => {
      if (Option.isSome(this.current.get())) {
        return pipe(
          this.scheduleFlush(sink),
          Effect.flatMap(() => super.run(sink)),
        )
      }

      return super.run(sink)
    })
  }

  event(a: A) {
    return Effect.suspendSucceed(() => {
      this.addValue(a)

      return pipe(
        this.flushPending(),
        Effect.flatMap(() => super.event(a)),
      )
    })
  }

  error(cause: Cause.Cause<E>) {
    return Effect.suspendSucceed(() =>
      pipe(
        this.flushPending(),
        Effect.flatMap(() => super.error(cause)),
      ),
    )
  }

  get end() {
    return Effect.suspendSucceed(() =>
      pipe(
        this.flushPending(),
        Effect.flatMap(() => super.end),
      ),
    )
  }

  protected scheduleFlush(sink: Fx.Sink<any, E, A>) {
    return Effect.suspendSucceed(() => {
      this.pendingSinks.push([
        sink,
        pipe(
          this.current.get(),
          Option.match(
            () => [],
            (a) => [a],
          ),
        ),
      ])

      const interrupt = this.scheduledFiber
        ? Fiber.interruptFork(this.scheduledFiber)
        : Effect.unit()

      this.scheduledFiber = undefined

      return pipe(
        interrupt,
        Effect.flatMap(() => this.flushPending()),
        Effect.scheduleForked(asap),
        Effect.tap((f) =>
          Effect.sync(() => {
            this.scheduledFiber = f
          }),
        ),
      )
    })
  }

  protected flushPending() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    if (this.pendingSinks.length === 0) {
      return Effect.unit()
    }

    const pendingSinks = this.pendingSinks

    this.pendingSinks = []

    return Effect.gen(function* ($) {
      for (const [sink, events] of pendingSinks) {
        const observer = that.findObserver(sink)

        if (!observer) continue

        for (const event of events) {
          yield* $(that.runEvent(event, observer))
        }
      }
    })
  }

  protected findObserver(sink: Fx.Sink<any, E, A>) {
    return this.observers.find((x) => x.sink === sink)
  }

  protected addValue(a: A) {
    this.current.set(Option.some(a))
    this.pendingSinks.forEach(([, events]) => events.push(a))
  }
}
