import { getOption } from "@typed/context"
import { Equivalence } from "effect"
import type { Duration, Exit } from "effect"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Effectable from "effect/Effectable"
import * as Equal from "effect/Equal"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Fiber from "effect/Fiber"
import * as FiberSet from "effect/FiberSet"
import * as Option from "effect/Option"
import * as Ref from "effect/Ref"
import * as Scope from "effect/Scope"
import * as SynchronizedRef from "effect/SynchronizedRef"
import * as TestClock from "effect/TestClock"
import type { FlattenStrategy, FxFork, ScopedFork } from "../Fx.js"
import type * as Sink from "../Sink.js"

export function withBuffers<A, E, R>(size: number, sink: Sink.Sink<A, E, R>) {
  const buffers: Array<Array<A>> = Array.from({ length: size }, () => [])
  const finished = new Set<number>()
  let currentIndex = 0

  const drainBuffer = (index: number): Effect.Effect<void, never, R> => {
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

export const withScope = <A, E, R>(
  f: (scope: Scope.CloseableScope) => Effect.Effect<A, E, R>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
): Effect.Effect<A, E, R | Scope.Scope> =>
  Effect.acquireUseRelease(Effect.scopeWith((scope) => Scope.fork(scope, executionStrategy)), f, Scope.close)

export const getExitEquivalence = <E, A>(A: Equivalence.Equivalence<A>) =>
  Equivalence.make<Exit.Exit<A, E>>((a, b) => {
    if (a._tag === "Failure") {
      return b._tag === "Failure" && Equal.equals(a.cause, b.cause)
    } else {
      return b._tag === "Success" && A(a.value, b.value)
    }
  })

export function withScopedFork<A, E, R>(
  f: (fork: ScopedFork, scope: Scope.CloseableScope) => Effect.Effect<A, E, R>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
): Effect.Effect<A, E, R | Scope.Scope> {
  return withScope((scope) => f(makeForkInScope(scope), scope), executionStrategy)
}

export function makeForkInScope(scope: Scope.Scope) {
  return <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    matchEffectPrimitive<A, E, R, Effect.Effect<Fiber.Fiber<A, E>, never, R>>(effect, {
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
      None: (e) => Effect.succeed(Fiber.fail(e)),
      Otherwise: (eff) => Effect.forkIn(eff, scope)
    })
}

export function withSwitchFork<A, E, R>(
  f: (fork: FxFork, scope: Scope.CloseableScope) => Effect.Effect<A, E, R>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
) {
  return withScopedFork(
    (fork, scope) =>
      Effect.flatMap(
        SynchronizedRef.make<Fiber.Fiber<unknown>>(Fiber.unit),
        (ref) => runSwitchFork(ref, fork, scope, f)
      ),
    executionStrategy
  )
}

export function runSwitchFork<A, E, R>(
  ref: SynchronizedRef.SynchronizedRef<Fiber.Fiber<unknown>>,
  fork: ScopedFork,
  scope: Scope.CloseableScope,
  f: (fork: FxFork, scope: Scope.CloseableScope) => Effect.Effect<A, E, R>
) {
  return Effect.zipRight(
    f(
      (effect) =>
        SynchronizedRef.updateEffect(
          ref,
          (fiber) =>
            Effect.zipRight(
              Fiber.interrupt(fiber),
              fork(effect)
            )
        ),
      scope
    ),
    Effect.flatMap(SynchronizedRef.get(ref), Fiber.join)
  )
}

export function withExhaustFork<A, E, R>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<A, E, R>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
) {
  return withScopedFork((fork, scope) => {
    return Effect.flatMap(
      SynchronizedRef.make<Fiber.Fiber<void> | null>(null),
      (ref) =>
        Effect.flatMap(
          f((effect) =>
            SynchronizedRef.updateEffect(
              ref,
              (fiber) =>
                fiber
                  ? Effect.succeed(fiber)
                  : fork(
                    Effect.onExit(
                      effect,
                      () => Ref.set(ref, null)
                    )
                  )
            ), scope),
          () => Effect.flatMap(Ref.get(ref), (fiber) => fiber ? Fiber.join(fiber) : Effect.unit)
        )
    )
  }, executionStrategy)
}

export function withExhaustLatestFork<A, E, R>(
  f: (exhaustLatestFork: FxFork, scope: Scope.Scope) => Effect.Effect<A, E, R>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
) {
  return withScopedFork((fork, scope) =>
    Effect.flatMap(
      Effect.zip(
        Ref.make<Fiber.Fiber<void> | void>(undefined),
        Ref.make<Option.Option<Effect.Effect<void, never, any>>>(Option.none())
      ),
      ([ref, nextEffect]) => {
        const reset = Ref.set(ref, undefined)

        // Wait for the current fiber to finish
        const awaitNext = Effect.flatMap(Ref.get(ref), (fiber) => fiber ? Fiber.join(fiber) : Effect.unit)

        // Run the next value that's be saved for replay if it exists

        const runNext: Effect.Effect<void, never, any> = Effect.flatMap(
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

        const exhaustLatestFork = <R2>(eff: Effect.Effect<void, never, R2>) =>
          Effect.flatMap(Ref.get(ref), (currentFiber) =>
            currentFiber
              ? Ref.set(nextEffect, Option.some(eff))
              : Effect.flatMap(
                fork(
                  Effect.ensuring(
                    eff,
                    Effect.zip(reset, runNext)
                  )
                ),
                (fiber) => Ref.set(ref, fiber)
              ))

        return Effect.zip(f(exhaustLatestFork, scope), awaitNext)
      }
    ), executionStrategy)
}

export function withUnboundedFork<A, E, R>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<A, E, R>
) {
  return Effect.scopeWith((scope) =>
    Effect.flatMap(
      FiberSet.make<void, never>(),
      (set) =>
        Effect.flatMap(
          f((effect) => FiberSet.run(set, effect), scope),
          () => Fiber.joinAll(set)
        )
    )
  )
}

export function withBoundedFork(capacity: number) {
  return <A, E, R>(
    f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<A, E, R>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) => {
    return withScopedFork((fork, scope) =>
      Effect.flatMap(
        Ref.make<Set<Fiber.Fiber<void>>>(new Set()).pipe(Effect.zip(Effect.makeSemaphore(capacity))),
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
): <A, E, R>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<A, E, R>,
  executionStrategy: ExecutionStrategy.ExecutionStrategy
) => Effect.Effect<void, E, R | Scope.Scope> {
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

export function matchEffectPrimitive<A, E, R, Z>(
  effect: Effect.Effect<A, E, R>,
  matchers: {
    Success: (a: A) => Z
    Failure: (e: Cause.Cause<E>) => Z
    Sync: (f: () => A) => Z
    Left: (e: E) => Z
    Right: (a: A) => Z
    Some: (a: A) => Z
    None: (e: E) => Z
    Otherwise: (effect: Effect.Effect<A, E, R>) => Z
  }
): Z {
  const eff = effect as any

  switch (eff._tag) {
    case "Success":
      return matchers.Success(eff.value)
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
      return matchers.None(new Cause.NoSuchElementException() as E)
    default:
      return matchers.Otherwise(effect)
  }
}

export function adjustTime(input: Duration.DurationInput = 1) {
  return Effect.flatMap(
    Effect.context<never>(),
    Effect.unifiedFn((ctx) => {
      const testClock = getOption(ctx, TestClock.TestClock)

      if (Option.isSome(testClock)) {
        return testClock.value.adjust(input)
      } else {
        return Effect.sleep(input)
      }
    })
  )
}

export function tupleSink<A extends ReadonlyArray<any>, E, R, B, E2, R2>(
  sink: Sink.Sink<A, E, R>,
  f: (sink: (index: number, value: A[number]) => Effect.Effect<unknown, never, R>) => Effect.Effect<B, E2, R2>,
  expected: number
) {
  return Effect.suspend(() => {
    const values = new Map<number, A[number]>()

    const getValues = () => Array.from({ length: expected }, (_, i) => values.get(i)!) as any as A

    return f((index: number, value: A[number]) => {
      values.set(index, value)

      if (values.size === expected) {
        return sink.onSuccess(getValues())
      } else {
        return Effect.unit
      }
    })
  })
}

export function withDebounceFork<A, E, R>(
  f: (fork: FxFork, scope: Scope.Scope) => Effect.Effect<A, E, R>,
  duration: Duration.DurationInput
): Effect.Effect<unknown, E, R | Scope.Scope> {
  return withScopedFork(
    (fork, scope) =>
      Effect.flatMap(
        SynchronizedRef.make(Option.none<Fiber.Fiber<void>>()),
        (ref) =>
          Effect.flatMap(
            f(
              (effect) =>
                SynchronizedRef.updateEffect(
                  ref,
                  Option.match({
                    onNone: () => Effect.asSome(fork(Effect.delay(effect, duration))),
                    onSome: (fiber) =>
                      Fiber.interrupt(fiber).pipe(Effect.zipRight(fork(Effect.delay(effect, duration))), Effect.asSome)
                  })
                ),
              scope
            ),
            () =>
              SynchronizedRef.get(ref).pipe(Effect.flatMap(Option.match({
                onNone: () => Effect.unit,
                onSome: Fiber.join
              })))
          )
      ),
    ExecutionStrategy.sequential
  )
}

export class RingBuffer<A> {
  constructor(
    readonly capacity: number
  ) {
    this._buffer = Array(this.capacity)
  }

  private _buffer: Array<A>
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

  forEach<B, E2, R2>(
    f: (a: A, i: number) => Effect.Effect<B, E2, R2>
  ) {
    switch (this._size) {
      case 0:
        return Effect.unit
      case 1:
        return f(this._buffer[0], 0)
      case 2:
        return Effect.zipRight(f(this._buffer[0], 0), f(this._buffer[1], 1))
      case 3:
        return Effect.zipRight(
          f(this._buffer[0], 0),
          Effect.zipRight(f(this._buffer[1], 1), f(this._buffer[2], 2))
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

  clear() {
    this._buffer = Array(this.capacity)
    this._size = 0
  }
}

export function awaitScopeClose(scope: Scope.Scope) {
  return Effect.asyncEffect<unknown, never, never, void, never, never>((cb) =>
    Scope.addFinalizerExit(scope, () => Effect.sync(() => cb(Effect.unit)))
  )
}

export class MulticastEffect<A, E, R> extends Effectable.Class<A, E, R> {
  private _fiber: Fiber.Fiber<A, E> | null = null

  constructor(
    readonly effect: Effect.Effect<A, E, R>
  ) {
    super()
  }

  commit() {
    return Effect.suspend(() => {
      if (this._fiber) {
        return Fiber.join(this._fiber)
      } else {
        return Effect.forkDaemon(this.effect).pipe(
          Effect.tap((fiber) => Effect.sync(() => this._fiber = fiber)),
          Effect.flatMap((fiber) =>
            Effect.ensuring(Fiber.join(fiber), Effect.sync(() => this._fiber === fiber ? this._fiber = null : null))
          )
        )
      }
    })
  }

  interrupt() {
    return Effect.suspend(() => {
      if (this._fiber) {
        return Fiber.interruptFork(this._fiber)
      } else {
        return Effect.unit
      }
    })
  }
}
