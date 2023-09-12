import { dual } from "@effect/data/Function"
import * as MutableRef from "@effect/data/MutableRef"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import { makeHoldSubject, makeReplaySubject, makeSubject } from "@typed/fx/internal/core-subject"
import { fromSink, type Fx, run, type Subject, ToFx } from "@typed/fx/internal/core2"
import { withScopedFork } from "@typed/fx/internal/helpers"

export function share<R, E, A, R2>(
  fx: Fx<R, E, A>,
  subject: Subject<R2, E, A>
): Fx<R | R2, E, A> {
  return new Share(fx, subject)
}

class RefCounter {
  private refCount: MutableRef.MutableRef<number> = MutableRef.make(0)

  increment() {
    return MutableRef.updateAndGet(this.refCount, (n) => n + 1)
  }

  decrement() {
    return MutableRef.updateAndGet(this.refCount, (n) => Math.max(0, n - 1))
  }
}

// TODO: We should keep track of a Set of Scope's to enable use to close them all when the

export class Share<R, E, A, R2> extends ToFx<R | R2, E, A> {
  private fxFiber: MutableRef.MutableRef<Option.Option<Fiber.Fiber<never, unknown>>> = MutableRef.make(Option.none())
  private refCount = new RefCounter()

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Subject<R2, E, A>
  ) {
    super(i0, i1)
  }

  toFx(): Fx<R | R2, E, A> {
    return fromSink((sink) =>
      withScopedFork((fork) => {
        return Effect.onExit(
          Effect.flatMap(fork(run(this.i1, sink)), () => this.initialize()),
          () => Effect.suspend(() => this.refCount.decrement() === 0 ? this.interrupt() : Effect.unit)
        )
      })
    )
  }

  private initialize(): Effect.Effect<R, never, unknown> {
    return Effect.suspend(() => {
      if (this.refCount.increment() === 1) {
        return run(this.i0, this.i1).pipe(
          Effect.onExit(() => Effect.sync(() => MutableRef.set(this.fxFiber, Option.none()))),
          Effect.interruptible,
          Effect.forkDaemon,
          Effect.tap((fiber) => Effect.sync(() => MutableRef.set(this.fxFiber, Option.some(fiber)))),
          Effect.flatMap(Fiber.join)
        )
      } else {
        return Fiber.join(Option.getOrThrow(MutableRef.get(this.fxFiber)))
      }
    })
  }

  private interrupt(): Effect.Effect<R, never, void> {
    return Effect.suspend(() => {
      const fiber = Option.getOrNull(MutableRef.get(this.fxFiber))

      return fiber ? Fiber.interrupt(fiber) : Effect.unit
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
