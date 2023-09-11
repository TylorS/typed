import * as Option from "@effect/data/Option"
import type { Concurrency } from "@effect/io/Concurrency"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Ref from "@effect/io/Ref"
import * as Scope from "@effect/io/Scope"
import * as SynchronizedRef from "@effect/io/SynchronizedRef"
import type { WithContext } from "@typed/fx/internal/sink"
import type { FlattenStrategy } from "@typed/fx/internal/strategies"

export type ScopedFork = <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R, never, Fiber.Fiber.Runtime<E, A>>

export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.Scope) => Effect.Effect<R, E, A>
): Effect.Effect<R, E, A> {
  return Effect.acquireUseRelease(
    Scope.make(),
    (scope) => f((effect) => Effect.forkIn(Effect.interruptible(effect), scope), scope),
    Scope.close
  )
}

export type FxFork = <R>(
  effect: Effect.Effect<R, never, void>
) => Effect.Effect<R, never, void>

export function withSwitchFork<R, E, A>(
  f: (fork: FxFork) => Effect.Effect<R, E, A>
) {
  return withScopedFork((fork) =>
    Effect.flatMap(
      SynchronizedRef.make<Fiber.Fiber<never, void>>(Fiber.unit),
      (ref) =>
        Effect.flatMap(
          f((effect) =>
            SynchronizedRef.updateAndGetEffect(
              ref,
              (fiber) => Effect.flatMap(Fiber.interrupt(fiber), () => fork(effect))
            )
          ),
          () => Effect.flatMap(SynchronizedRef.get(ref), Fiber.join)
        )
    )
  )
}

export function withExhaustFork<R, E, A>(
  f: (fork: FxFork) => Effect.Effect<R, E, A>
) {
  return withScopedFork((fork) =>
    Effect.flatMap(
      SynchronizedRef.make<Fiber.Fiber<never, void> | null>(null),
      (ref) =>
        Effect.flatMap(
          f((effect) =>
            SynchronizedRef.updateEffect(
              ref,
              (fiber) => fiber ? Effect.succeed(fiber) : fork(Effect.onExit(effect, () => Ref.set(ref, null)))
            )
          ),
          () => Effect.flatMap(Ref.get(ref), (fiber) => fiber ? Fiber.join(fiber) : Effect.unit)
        )
    )
  )
}

export function withExhaustLatestFork<R, E, A>(
  f: (exhaustLatestFork: FxFork) => Effect.Effect<R, E, A>
) {
  return withScopedFork((fork) =>
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

        return Effect.zip(f(exhaustLatestFork), awaitNext)
      }
    )
  )
}

export function withUnboundedFork<R, E, A>(
  f: (fork: FxFork) => Effect.Effect<R, E, A>
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
            )
          ),
          () => Effect.flatMap(Ref.get(ref), (fibers) => fibers.size > 0 ? Fiber.joinAll(fibers) : Effect.unit)
        )
    )
  )
}

export function withBoundedFork(capacity: number) {
  return <R, E, A>(
    f: (fork: FxFork) => Effect.Effect<R, E, A>
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
              )
            ),
            () => Effect.flatMap(Ref.get(ref), (fibers) => fibers.size > 0 ? Fiber.joinAll(fibers) : Effect.unit)
          )
      )
    )
  }
}

export function withFlattenStrategy(strategy: FlattenStrategy) {
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
      this._buffer[this._size] = a
      this._size++
    } else {
      this._buffer.shift()
      this._buffer.push(a)
    }
  }

  forEach<R2, E2, B>(
    f: (a: A, i: number) => Effect.Effect<R2, E2, B>,
    options?: {
      readonly concurrency?: Concurrency
      readonly batching?: boolean | "inherit"
      readonly discard?: false
    }
  ) {
    return Effect.forEach(
      Array.from({ length: this._size }, (_, i) => this._buffer[i]),
      f,
      options
    )
  }
}

export interface EarlyExitSink<R, E, A> extends WithContext<R, E, A> {
  readonly end: Effect.Effect<never, never, void>
}

export function withEarlyExit<R, E, A, R2, B>(
  sink: WithContext<R, E, A>,
  f: (sink: EarlyExitSink<R, E, A>) => Effect.Effect<R2, E, B>
): Effect.Effect<R | R2, never, void> {
  return Effect.asyncEffect<never, never, void, R | R2, never, void>((resume) => {
    const earlyExit: EarlyExitSink<R, E, A> = {
      ...sink,
      end: Effect.sync(() => resume(Effect.unit))
    }

    return f(earlyExit).pipe(
      Effect.matchCauseEffect({
        onFailure: sink.onFailure,
        onSuccess: () => earlyExit.end
      })
    )
  })
}

export function withBuffers<R, E, A>(count: number, sink: WithContext<R, E, A>) {
  return Effect.sync(() => {
    const buffers = Array(count).fill([] as Array<A>)
    const finished = new Set<number>()
    let currentIndex = 0

    const drainBuffer = (index: number): Effect.Effect<R, never, void> => {
      const effect = Effect.forEach(buffers[index], sink.onSuccess)
      buffers[index] = []
      return Effect.flatMap(effect, () => finished.has(index) ? onEnd(index) : Effect.unit)
    }

    const onSuccess = (index: number, value: A) =>
      Effect.sync(() => {
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
        }
      })

    const onEnd = (index: number) =>
      Effect.suspend(() => {
        finished.add(index)

        if (index === currentIndex) {
          return drainBuffer(++currentIndex)
        } else {
          return Effect.unit
        }
      })

    return {
      onSuccess,
      onEnd
    }
  })
}
