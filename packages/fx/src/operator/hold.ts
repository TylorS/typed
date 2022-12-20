import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as MutableRef from '@fp-ts/data/MutableRef'
import * as Option from '@fp-ts/data/Option'
import { pipe } from 'node_modules/@fp-ts/data/Function.js'

import { Fx } from '../Fx.js'
import { asap } from '../_internal/RefCounter.js'

import { MulticastFx } from './multicast.js'

export function hold<R, E, A>(fx: Fx<R, E, A>) {
  return new HoldFx(fx, MutableRef.make(Option.none))
}

export function hold_<R, E, A>(fx: Fx<R, E, A>, value: MutableRef.MutableRef<Option.Option<A>>) {
  return new HoldFx(fx, value)
}

export class HoldFx<R, E, A> extends MulticastFx<R, E, A> implements Fx<R, E, A> {
  protected pendingSinks: Array<readonly [Fx.Sink<any, E, A>, A[]]> = []
  protected scheduledFiber: Fiber.RuntimeFiber<any, any> | undefined = undefined

  constructor(readonly fx: Fx<R, E, A>, readonly value: MutableRef.MutableRef<Option.Option<A>>) {
    super(fx)

    this.event = this.event.bind(this)
    this.error = this.error.bind(this)
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    const option = this.value.get()

    if (Option.isSome(option)) {
      return pipe(
        this.scheduleFlush(sink, option.value),
        Effect.flatMap(() => super.run(sink)),
      )
    }

    return super.run(sink)
  }

  event(a: A) {
    this.addValue(a)

    return pipe(
      this.flushPending(),
      Effect.flatMap(() => super.event(a)),
    )
  }

  error(cause: Cause.Cause<E>) {
    return pipe(
      this.flushPending(),
      Effect.flatMap(() => super.error(cause)),
    )
  }

  get end() {
    return pipe(
      this.flushPending(),
      Effect.flatMap(() => super.end),
    )
  }

  protected shouldScheduleFlush() {
    return Option.isSome(this.value.get())
  }

  protected scheduleFlush(sink: Fx.Sink<any, E, A>, value: A) {
    this.pendingSinks.push([sink, [value]])

    const interrupt = this.scheduledFiber ? Fiber.interrupt(this.scheduledFiber) : Effect.unit()

    this.scheduledFiber = undefined

    return pipe(
      interrupt,
      Effect.flatMap(() =>
        pipe(
          this.flushPending(),
          Effect.scheduleForked(asap),
          Effect.tap((f) =>
            Effect.sync(() => {
              this.scheduledFiber = f
            }),
          ),
        ),
      ),
    )
  }

  protected flushPending() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    return Effect.gen(function* ($) {
      if (that.pendingSinks.length === 0) {
        return
      }

      for (const [sink, events] of that.pendingSinks) {
        const observer = that.findObserver(sink)

        if (!observer) continue

        for (const event of events) {
          yield* $(that.runEvent(event, observer))
        }
      }

      that.pendingSinks = []
    })
  }

  protected findObserver(sink: Fx.Sink<any, E, A>) {
    return this.observers.find((x) => x.sink === sink)
  }

  protected addValue(a: A) {
    this.value.set(Option.some(a))
    this.pendingSinks.forEach(([, events]) => events.push(a))
  }
}
