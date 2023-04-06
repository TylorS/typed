import { dualWithTrace, methodWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import type * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import type { Scope } from '@effect/io/Scope'

import { MulticastFx } from './multicast.js'

import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Mutable } from '@typed/fx/internal/Mutable'
import { asap } from '@typed/fx/internal/RefCounter'

export const hold: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>) =>
      new HoldFx(fx, Mutable(Option.none()), 'Hold', false).traced(trace),
)

export const hold_: {
  <R, E, A>(fx: Fx<R, E, A>, value: Mutable<Option.Option<A>>): Fx<R, E, A>
  <A>(value: Mutable<Option.Option<A>>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>, value: Mutable<Option.Option<A>>): Fx<R, E, A> =>
      new HoldFx(fx, value, 'Hold', false).traced(trace),
)

export class HoldFx<R, E, A, Tag extends string>
  extends MulticastFx<R, E, A, Tag>
  implements Fx<R, E, A>
{
  protected pendingSinks: Array<readonly [Sink<E, A>, Array<A>]> = []
  protected scheduledFiber: Fiber.RuntimeFiber<any, any> | undefined = undefined

  constructor(
    readonly fx: Fx<R, E, A>,
    readonly current: Mutable<Option.Option<A>>,
    readonly tag: Tag,
    readonly sync: boolean,
  ) {
    super(fx, tag, sync)

    this.event = this.event.bind(this)
    this.error = this.error.bind(this)
    this.end = this.end.bind(this)
  }

  run(sink: Sink<E, A>): Effect.Effect<Scope | R, never, void> {
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

  end() {
    return Effect.suspend(() =>
      pipe(
        this.flushPending(),
        Effect.flatMap(() => super.end()),
      ),
    )
  }

  protected scheduleFlush(sink: Sink<E, A>) {
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
        this.sync ? Effect.forkScoped : Effect.scheduleForked(asap),
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

  protected findObserver(sink: Sink<E, A>) {
    return this.observers.find((x) => x.sink === sink)
  }

  protected addValue(a: A) {
    this.current.set(Option.some(a))
    this.pendingSinks.forEach(([, events]) => events.push(a))
  }
}
