import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import { dual } from "effect/Function"
import * as MutableRef from "effect/MutableRef"
import * as Option from "effect/Option"
import type { Fx } from "../Fx"
import type { Subject } from "../Subject"
import { withScopedFork } from "./core"
import { makeHoldSubject, makeReplaySubject, makeSubject } from "./core-subject"
import { ToFx } from "./fx-primitive"
import { run } from "./run"

export function share<R, E, A, R2>(
  fx: Fx<R, E, A>,
  subject: Subject<R2, E, A>
): Fx<R | R2, E, A> {
  return new Share(fx, subject)
}

class RefCounter {
  #refCount: MutableRef.MutableRef<number> = MutableRef.make(0)

  increment() {
    return MutableRef.updateAndGet(this.#refCount, (n) => n + 1)
  }

  decrement() {
    return MutableRef.updateAndGet(this.#refCount, (n) => Math.max(0, n - 1))
  }
}

export class Share<R, E, A, R2> extends ToFx<R | R2, E, A> {
  _FxFiber: MutableRef.MutableRef<Option.Option<Fiber.Fiber<never, unknown>>> = MutableRef.make(Option.none())
  _RefCount = new RefCounter()

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Subject<R2, E, A>
  ) {
    super(i0, i1)
  }

  toFx(): Fx<R | R2, E, A> {
    return withScopedFork(({ fork, sink }) =>
      Effect.flatMap(
        fork(
          Effect.onExit(run(this.i1, sink), () => this._RefCount.decrement() === 0 ? this.interrupt() : Effect.unit)
        ),
        () => this.initialize()
      )
    )
  }

  private initialize(): Effect.Effect<R | R2, never, unknown> {
    return Effect.suspend(() => {
      if (this._RefCount.increment() === 1) {
        return run(this.i0, this.i1).pipe(
          Effect.onExit(() => Effect.sync(() => MutableRef.set(this._FxFiber, Option.none()))),
          Effect.interruptible,
          Effect.forkDaemon,
          Effect.tap((fiber) => Effect.sync(() => MutableRef.set(this._FxFiber, Option.some(fiber)))),
          Effect.flatMap(Fiber.join)
        )
      } else {
        return Option.match(
          MutableRef.get(this._FxFiber),
          {
            onNone: () => Effect.unit,
            onSome: Fiber.join
          }
        )
      }
    })
  }

  private interrupt(): Effect.Effect<R | R2, never, void> {
    return Effect.suspend(() => {
      const fiber = Option.getOrNull(MutableRef.getAndSet(this._FxFiber, Option.none()))

      return fiber ? Effect.zip(Fiber.interrupt(fiber), this.i1.interrupt) : this.i1.interrupt
    })
  }
}

export function multicast<R, E, A>(
  fx: Fx<R, E, A>
): Fx<R, E, A> {
  return new Share(fx, makeSubject<E, A>())
}

export function hold<R, E, A>(
  fx: Fx<R, E, A>
): Fx<R, E, A> {
  return new Share(fx, makeHoldSubject<E, A>())
}

export const replay: {
  (capacity: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, capacity: number): Fx<R, E, A>
} = dual(2, function replay<R, E, A>(
  fx: Fx<R, E, A>,
  capacity: number
): Fx<R, E, A> {
  return new Share(fx, makeReplaySubject<E, A>(capacity))
})
