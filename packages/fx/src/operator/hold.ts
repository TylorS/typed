import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import type * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import type { Scope } from '@effect/io/Scope'

import type { Fx } from '../Fx.js'
import { Mutable } from '../_internal/Mutable.js'

import { MulticastFx } from './multicast.js'

export function hold<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return new HoldFx(fx, Mutable(Option.none()))
}

export function hold_<R, E, A>(fx: Fx<R, E, A>, value: Mutable<Option.Option<A>>) {
  return new HoldFx(fx, value)
}

export class HoldFx<R, E, A> extends MulticastFx<R, E, A> implements Fx<R, E, A> {
  protected pendingSinks: Array<readonly [Fx.Sink<any, E, A>, A[]]> = []
  protected scheduledFiber: Fiber.RuntimeFiber<any, any> | undefined = undefined

  constructor(readonly fx: Fx<R, E, A>, readonly current: Mutable<Option.Option<A>>) {
    super(fx)

    this.event = this.event.bind(this)
    this.error = this.error.bind(this)
  }

  run<R2>(sink: Fx.Sink<R2, E, A>): Effect.Effect<Scope | R | R2, never, void> {
    return Effect.suspend(() => {
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
    return Effect.suspend(() => {
      this.addValue(a)

      return pipe(
        this.flushPending(),
        Effect.flatMap(() => super.event(a)),
      )
    })
  }

  error(cause: Cause.Cause<E>) {
    return Effect.suspend(() =>
      pipe(
        this.flushPending(),
        Effect.flatMap(() => super.error(cause)),
      ),
    )
  }

  get end() {
    return Effect.suspend(() =>
      pipe(
        this.flushPending(),
        Effect.flatMap(() => super.end),
      ),
    )
  }

  protected scheduleFlush(sink: Fx.Sink<any, E, A>) {
    return Effect.suspend(() => {
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
        Effect.forkScoped,
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
