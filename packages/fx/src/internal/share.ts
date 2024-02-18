import { ExecutionStrategy, type Scope } from "effect"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import { dual } from "effect/Function"
import * as MutableRef from "effect/MutableRef"
import * as Option from "effect/Option"
import type { Fx } from "../Fx.js"
import type { Sink } from "../Sink.js"
import * as Subject from "../Subject.js"
import { withScopedFork } from "./helpers.js"
import { FxBase } from "./protos.js"

export function share<A, E, R, R2>(
  fx: Fx<A, E, R>,
  subject: Subject.Subject<A, E, R2>
): Fx<A, E, R | R2 | Scope.Scope> {
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

export class Share<A, E, R, R2> extends FxBase<A, E, R | R2 | Scope.Scope> {
  _FxFiber: MutableRef.MutableRef<Option.Option<Fiber.Fiber<unknown>>> = MutableRef.make(Option.none())
  _RefCount = new RefCounter()

  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: Subject.Subject<A, E, R2>
  ) {
    super()
  }

  run<R3>(sink: Sink<A, E, R3>): Effect.Effect<unknown, never, R | R2 | R3 | Scope.Scope> {
    return withScopedFork(
      (fork) =>
        Effect.flatMap(
          fork(
            Effect.onExit(this.i1.run(sink), () => this._RefCount.decrement() === 0 ? this.interrupt() : Effect.unit)
          ),
          () => this.initialize()
        ),
      ExecutionStrategy.sequential
    )
  }

  private initialize(): Effect.Effect<unknown, never, R | R2> {
    return Effect.suspend(() => {
      if (this._RefCount.increment() === 1) {
        return this.i0.run(this.i1).pipe(
          Effect.onExit(() =>
            Effect.suspend(() => {
              MutableRef.set(this._FxFiber, Option.none())
              return this.i1.interrupt
            })
          ),
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

  private interrupt(): Effect.Effect<void, never, R | R2> {
    return Effect.suspend(() => {
      const fiber = Option.getOrNull(MutableRef.getAndSet(this._FxFiber, Option.none()))

      return fiber ? Effect.zip(Fiber.interrupt(fiber), this.i1.interrupt) : this.i1.interrupt
    })
  }
}

export function multicast<A, E, R>(
  fx: Fx<A, E, R>
): Fx<A, E, R | Scope.Scope> {
  return new Share(fx, Subject.unsafeMake<A, E>(0))
}

export function hold<A, E, R>(
  fx: Fx<A, E, R>
): Fx<A, E, R | Scope.Scope> {
  return new Share(fx, Subject.unsafeMake<A, E>(1))
}

export const replay: {
  (capacity: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>
  <A, E, R>(fx: Fx<A, E, R>, capacity: number): Fx<A, E, R>
} = dual(2, function replay<A, E, R>(
  fx: Fx<A, E, R>,
  capacity: number
): Fx<A, E, R | Scope.Scope> {
  return new Share(fx, Subject.unsafeMake<A, E>(capacity))
})
