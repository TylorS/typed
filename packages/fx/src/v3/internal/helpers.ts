import type { ExecutionStrategy, Exit } from "effect"
import { Cause, Effect, Equal, Equivalence, Fiber, Option, Ref, Scope, SynchronizedRef } from "effect"
import type { FlattenStrategy, FxFork, ScopedFork } from "../Fx.js"
import type * as Sink from "../Sink.js"

export function withBuffers<R, E, A>(size: number, sink: Sink.Sink<R, E, A>) {
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
  } as const
}

export const withScope = <R, E, A>(
  f: (scope: Scope.CloseableScope) => Effect.Effect<R, E, A>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
): Effect.Effect<R | Scope.Scope, E, A> =>
  Effect.acquireUseRelease(Effect.scopeWith((scope) => Scope.fork(scope, executionStrategy)), f, Scope.close)

export const getExitEquivalence = <E, A>(A: Equivalence.Equivalence<A>) =>
  Equivalence.make<Exit.Exit<E, A>>((a, b) => {
    if (a._tag === "Failure") {
      return b._tag === "Failure" && Equal.equals(a.cause, b.cause)
    } else {
      return b._tag === "Success" && A(a.value, b.value)
    }
  })

export function withScopedFork<R, E, A>(
  f: (fork: ScopedFork, scope: Scope.CloseableScope) => Effect.Effect<R, E, A>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
): Effect.Effect<R | Scope.Scope, E, A> {
  return withScope((scope) => f(makeForkInScope(scope), scope), executionStrategy)
}

function makeForkInScope(scope: Scope.Scope) {
  return <R, E, A>(effect: Effect.Effect<R, E, A>) =>
    matchEffectPrimitive<R, E, A, Effect.Effect<R, never, Fiber.Fiber<E, A>>>(effect, {
      Success: (a) => Effect.succeed(Fiber.succeed(a)),
      Failure: (cause) => Effect.succeed(Fiber.failCause(cause)),
      Sync: (f) =>
        Effect.sync(() => {
          try {
            return Fiber.succeed(f())
          } catch (e) {
            return Fiber.failCause(Cause.die(e))
          }
        }),
      Left: (e) => Effect.succeed(Fiber.fail(e)),
      Right: (a) => Effect.succeed(Fiber.succeed(a)),
      Some: (a) => Effect.succeed(Fiber.succeed(a)),
      None: () => Effect.succeed(Fiber.fail(new Cause.NoSuchElementException() as E)),
      Otherwise: Effect.forkIn(scope)
    })
}

export function withSwitchFork<R, E, A>(
  f: (fork: FxFork, scope: Scope.CloseableScope) => Effect.Effect<R, E, A>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
) {
  return withScopedFork((_, scope) =>
    Effect.flatMap(
      SynchronizedRef.make<Fiber.Fiber<never, void>>(Fiber.unit),
      (ref) => runSwitchFork(ref, scope, f)
    ), executionStrategy)
}

export function runSwitchFork<R, E, A>(
  ref: SynchronizedRef.SynchronizedRef<Fiber.Fiber<never, void>>,
  scope: Scope.CloseableScope,
  f: (fork: FxFork, scope: Scope.CloseableScope) => Effect.Effect<R, E, A>
) {
  return Effect.zipRight(
    f(
      (effect) =>
        SynchronizedRef.updateAndGetEffect(
          ref,
          (fiber) => Effect.zipRight(Fiber.interrupt(fiber), Effect.forkIn(effect, scope))
        ),
      scope
    ),
    Effect.flatMap(SynchronizedRef.get(ref), Fiber.join)
  )
}

export function withExhaustFork<R, E, A>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
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
    ), executionStrategy)
}

export function withExhaustLatestFork<R, E, A>(
  f: (exhaustLatestFork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
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
    ), executionStrategy)
}

export function withUnboundedFork<R, E, A>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
) {
  return withScopedFork((fork, scope) =>
    Effect.flatMap(
      Ref.make<Map<symbol, Fiber.Fiber<never, void>>>(new Map()),
      (ref) =>
        Effect.flatMap(
          f((effect) => {
            const id = Symbol()

            return Effect.tap(
              fork(Effect.onExit(effect, () => Ref.update(ref, (map) => (map.delete(id), map)))),
              (fiber) => {
                if (Fiber.isRuntimeFiber(fiber)) {
                  return Ref.update(ref, (map) => map.set(id, fiber))
                } else {
                  return Effect.unit
                }
              }
            )
          }, scope),
          () => Effect.flatMap(Ref.get(ref), (fibers) => fibers.size > 0 ? Fiber.joinAll(fibers.values()) : Effect.unit)
        )
    ), executionStrategy)
}

export function withBoundedFork(capacity: number) {
  return <R, E, A>(
    f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
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
      ), executionStrategy)
  }
}

export function withFlattenStrategy(
  strategy: FlattenStrategy
): <R, E, A>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<R, E, A>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
) => Effect.Effect<R | Scope.Scope, E, void> {
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

export function matchEffectPrimitive<R, E, A, Z>(
  effect: Effect.Effect<R, E, A>,
  matchers: {
    Success: (a: A) => Z
    Failure: (e: Cause.Cause<E>) => Z
    Sync: (f: () => A) => Z
    Left: (e: E) => Z
    Right: (a: A) => Z
    Some: (a: A) => Z
    None: () => Z
    Otherwise: (effect: Effect.Effect<R, E, A>) => Z
  }
): Z {
  const eff = effect as any

  switch (eff._tag) {
    case "Success":
      return matchers.Success(eff.i0)
    case "Failure":
      return matchers.Failure(eff.cause)
    case "Sync":
      return matchers.Sync(eff.i0)
    case "Left":
      return matchers.Left(eff.left)
    case "Right":
      return matchers.Right(eff.right)
    case "Some":
      return matchers.Some(eff.value)
    case "None":
      return matchers.None()
    default:
      return matchers.Otherwise(effect)
  }
}
