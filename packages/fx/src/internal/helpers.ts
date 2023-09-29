import { unsafeGet } from "@typed/context"
import type { FlattenStrategy, FxFork, ScopedFork } from "@typed/fx/Fx"
import type { InternalEffect } from "@typed/fx/internal/effect-primitive"
import { matchEffectPrimitive } from "@typed/fx/internal/effect-primitive"
import type * as Sink from "@typed/fx/Sink"
import { type Cause, NoSuchElementException } from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import * as Option from "effect/Option"
import * as Ref from "effect/Ref"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import * as SynchronizedRef from "effect/SynchronizedRef"

export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
): Effect.Effect<R, E, A> {
  return Effect.acquireUseRelease(
    Scope.make(),
    (scope) => {
      const fork = makeScopedFork(scope)

      return f((effect) => fork(Effect.interruptible(effect)), scope)
    },
    Scope.close
  )
}

function makeScopedFork(scope: Scope.Scope): ScopedFork {
  const forkIn = Effect.forkIn(scope)

  return <R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R, never, Fiber.Fiber<E, A>> => {
    // Convert simple Effects directly into synthetic Fibers to avoid the overhead of constructing a fiber.
    return matchEffectPrimitive(effect as Effect.Effect<R, E, A> & InternalEffect, {
      Success: (e): Effect.Effect<R, never, Fiber.Fiber<E, A>> => Effect.succeed(Fiber.succeed(e.i0 as A)),
      Failure: (e) => Effect.succeed(Fiber.failCause(e.i0 as Cause<E>)),
      Sync: (e) => Effect.sync(() => Fiber.succeed(e.i0() as A)),
      Left: (e) => Effect.succeed(Fiber.fail(e.left as E)),
      Right: (e) => Effect.succeed(Fiber.succeed(e.right as A)),
      None: () => Effect.succeed(Fiber.fail(NoSuchElementException() as E)),
      Some: (e) => Effect.succeed(Fiber.succeed(e.value)),
      Otherwise: (e) => forkIn(e as Effect.Effect<R, E, A>)
    })
  }
}

export function withSwitchFork<R, E, A>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
) {
  return withScopedFork((fork, scope) =>
    Effect.flatMap(
      SynchronizedRef.make<Fiber.Fiber<never, void>>(Fiber.unit),
      (ref) =>
        Effect.flatMap(
          f((effect) =>
            SynchronizedRef.updateAndGetEffect(
              ref,
              (fiber) => Effect.flatMap(Fiber.interrupt(fiber), () => fork(effect))
            ), scope),
          () => Effect.flatMap(SynchronizedRef.get(ref), Fiber.join)
        )
    )
  )
}

export function withExhaustFork<R, E, A>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
) {
  return withScopedFork((fork, scope) =>
    Effect.flatMap(
      SynchronizedRef.make<Fiber.Fiber<never, void> | null>(null),
      (ref) =>
        Effect.flatMap(
          f((effect) =>
            SynchronizedRef.updateEffect(
              ref,
              (fiber) => fiber ? Effect.succeed(fiber) : fork(Effect.onExit(effect, () => Ref.set(ref, null)))
            ), scope),
          () => Effect.flatMap(Ref.get(ref), (fiber) => fiber ? Fiber.join(fiber) : Effect.unit)
        )
    )
  )
}

export function withExhaustLatestFork<R, E, A>(
  f: (exhaustLatestFork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
) {
  return withScopedFork((fork, scope) =>
    Effect.flatMap(
      Effect.zip(
        Ref.make<Fiber.Fiber<never, void> | void>(undefined),
        Ref.make<Option.Option<Effect.Effect<any, never, void>>>(Option.none())
      ),
      ([ref, nextEffect]) => {
        const reset = Ref.set(ref, undefined)

        // Wait for the current fiber to finish
        const awaitNext = Effect.flatMap(Ref.get(ref), (fiber) => fiber ? Fiber.join(fiber) : Effect.unit)

        // Run the next value that's be saved for replay if it exists

        const runNext: Effect.Effect<any, never, void> = Effect.flatMap(
          Ref.get(nextEffect),
          (next) => {
            if (Option.isNone(next)) {
              return Effect.unit
            }

            return Effect.all([
              // Clear the next A to be replayed
              Ref.set(nextEffect, Option.none()),
              // Replay the next A
              exhaustLatestFork(next.value),
              // Ensure we don't close the scope until the last fiber completes
              awaitNext
            ])
          }
        )

        const exhaustLatestFork = <R2>(eff: Effect.Effect<R2, never, void>) =>
          Effect.flatMap(Ref.get(ref), (currentFiber) =>
            currentFiber
              ? Ref.set(nextEffect, Option.some(eff))
              : Effect.flatMap(fork(Effect.ensuring(eff, Effect.zip(reset, runNext))), (fiber) => Ref.set(ref, fiber)))

        return Effect.zip(f(exhaustLatestFork, scope), awaitNext)
      }
    )
  )
}

export function withUnboundedFork<R, E, A>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
) {
  return withScopedFork((fork, scope) =>
    Effect.flatMap(
      Ref.make<Set<Fiber.Fiber<never, void>>>(new Set()),
      (ref) =>
        Effect.flatMap(
          f((effect) =>
            fork(effect).pipe(
              Effect.tap((fiber) => Ref.update(ref, (set) => set.add(fiber))),
              Effect.tap((fiber) =>
                Scope.addFinalizer(
                  scope,
                  Ref.update(ref, (set) => {
                    set.delete(fiber)
                    return set
                  })
                )
              )
            ), scope),
          () => Effect.flatMap(Ref.get(ref), (fibers) => fibers.size > 0 ? Fiber.joinAll(fibers) : Effect.unit)
        )
    )
  )
}

export function withBoundedFork(capacity: number) {
  return <R, E, A>(
    f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
  ) => {
    return withScopedFork((fork, scope) =>
      Effect.flatMap(
        Ref.make<Set<Fiber.Fiber<never, void>>>(new Set()).pipe(Effect.zip(Effect.makeSemaphore(capacity))),
        ([ref, semaphore]) =>
          Effect.flatMap(
            f((effect) =>
              fork(semaphore.withPermits(1)(effect)).pipe(
                Effect.tap((fiber) => Ref.update(ref, (set) => set.add(fiber))),
                Effect.tap((fiber) =>
                  Scope.addFinalizer(
                    scope,
                    Ref.update(ref, (set) => {
                      set.delete(fiber)
                      return set
                    })
                  )
                )
              ), scope),
            () => Effect.flatMap(Ref.get(ref), (fibers) => fibers.size > 0 ? Fiber.joinAll(fibers) : Effect.unit)
          )
      )
    )
  }
}

export function withFlattenStrategy(
  strategy: FlattenStrategy
): <R, E, A>(f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>) => Effect.Effect<R, E, void> {
  switch (strategy._tag) {
    case "Bounded":
      return withBoundedFork(strategy.capacity)
    case "Exhaust":
      return withExhaustFork
    case "ExhaustLatest":
      return withExhaustLatestFork
    case "Switch":
      return withSwitchFork
    case "Unbounded":
      return withUnboundedFork
  }
}

export class RingBuffer<A> {
  constructor(
    readonly capacity: number
  ) {}

  private _buffer: Array<A> = Array(this.capacity)
  private _size = 0

  get size() {
    return this._size
  }

  push(a: A) {
    if (this._size < this.capacity) {
      this._buffer[this._size++] = a
    } else {
      this._buffer.shift()
      this._buffer.push(a)
    }
  }

  forEach<R2, E2, B>(
    f: (a: A, i: number) => Effect.Effect<R2, E2, B>
  ) {
    switch (this._size) {
      case 0:
        return Effect.unit
      case 1:
        return f(this._buffer[0], 0)
      case 2:
        return Effect.flatMap(f(this._buffer[0], 0), () => f(this._buffer[1], 1))
      case 3:
        return Effect.flatMap(
          f(this._buffer[0], 0),
          () => Effect.flatMap(f(this._buffer[1], 1), () => f(this._buffer[2], 2))
        )
      default:
        return Effect.forEach(
          Array.from({ length: this._size }, (_, i) => this._buffer[i]),
          f,
          {
            discard: true
          }
        )
    }
  }
}

export function withEarlyExit<R, E, A, R2, B>(
  sink: Sink.Sink<E, A>,
  f: (sink: Sink.WithEarlyExit<E, A>) => Effect.Effect<R2, E, B>
): Effect.Effect<R | R2, never, void> {
  return Effect.asyncEffect<never, never, void, R | R2, never, void>((resume) => {
    const earlyExit: Sink.WithEarlyExit<E, A> = {
      ...sink,
      earlyExit: Effect.sync(() => resume(Effect.unit))
    }

    return Effect.matchCauseEffect(f(earlyExit), {
      onFailure: sink.onFailure,
      onSuccess: () => earlyExit.earlyExit
    })
  })
}

export function withBuffers<R, E, A>(size: number, sink: Sink.WithContext<R, E, A>) {
  return Effect.sync(() => {
    const buffers: Array<Array<A>> = Array.from({ length: size }, () => [])
    const finished = new Set<number>()
    let currentIndex = 0

    const drainBuffer = (index: number): Effect.Effect<R, never, void> => {
      const effect = Effect.forEach(buffers[index], sink.onSuccess)
      buffers[index] = []

      return Effect.flatMap(effect, () => finished.has(index) ? onEnd(index) : Effect.unit)
    }

    const onSuccess = (index: number, value: A) => {
      if (index === currentIndex) {
        const buffer = buffers[index]

        if (buffer.length === 0) {
          return sink.onSuccess(value)
        } else {
          buffer.push(value)

          return drainBuffer(index)
        }
      } else {
        buffers[index].push(value)

        return Effect.unit
      }
    }

    const onEnd = (index: number) => {
      finished.add(index)

      if (index === currentIndex && ++currentIndex < size) {
        return drainBuffer(currentIndex)
      } else {
        return Effect.unit
      }
    }

    return {
      onSuccess,
      onEnd
    }
  })
}

export type ScopedRuntime<R> = {
  readonly runtime: Runtime.Runtime<R | Scope.Scope>
  readonly scope: Scope.Scope
  readonly run: <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>) => Fiber.Fiber<E, A>
}

export function scopedRuntime<R>(): Effect.Effect<
  R | Scope.Scope,
  never,
  ScopedRuntime<R>
> {
  return Effect.gen(function*(_) {
    const runtime = yield* _(Effect.runtime<R | Scope.Scope>())
    const scope = unsafeGet(runtime.context, Scope.Scope)
    const runFork = Runtime.runFork(runtime)

    const run = <E, A>(effect: Effect.Effect<R | Scope.Scope, E, A>): Fiber.Fiber<E, A> => {
      const fiber: Fiber.Fiber<E, A> = Scope.addFinalizer(
        scope,
        Effect.suspend(() => Fiber.interrupt(fiber))
      ).pipe(
        Effect.zipRight(effect),
        runFork
      )

      return fiber
    }

    return {
      runtime,
      scope,
      run
    } as const
  })
}

export function awaitScopeClose(scope: Scope.Scope) {
  return Effect.asyncEffect<never, never, unknown, never, never, void>((cb) =>
    Scope.addFinalizerExit(scope, () => Effect.sync(() => cb(Effect.unit)))
  )
}
