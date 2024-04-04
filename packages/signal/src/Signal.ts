import * as AsyncData from "@typed/async-data/AsyncData"
import * as Context from "@typed/context"
import type { Fiber, Types } from "effect"
import { Effect, Effectable, FiberRef, Ref, Scope } from "effect"
import { equals } from "effect/Equal"
import { constant } from "effect/Function"
import { Signals } from "./Signals.js"

// TODO: schedule to run updates
// TODO: Need a way to track current signal for dependencies/dependents

export const SignalTypeId = Symbol.for("@typed/signal/Signal")
export type SignalTypeId = typeof SignalTypeId

export interface Signal<A, E = never, R = never> extends Effect.Effect<A, E | AsyncData.Loading, R> {
  readonly [SignalTypeId]: Signal.Variance<A, E, R>
  readonly data: Effect.Effect<AsyncData.AsyncData<A, E>, never, R>

  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<B, E | AsyncData.Loading, R>

  readonly modifyEffect: <B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ) => Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2>

  readonly runUpdate: <R2>(effect: Effect.Effect<A, E, R2>) => Effect.Effect<A, E, R2>
}

export namespace Signal {
  export type Any = Signal<any, any, any>

  export interface Variance<A, E, R> {
    readonly _A: Types.Invariant<A>
    readonly _E: Types.Invariant<E>
    readonly _R: Types.Covariant<R>
  }
}

export function make<A, E, R>(
  initial: Effect.Effect<A, E, R>
): Effect.Effect<Signal<A, E>, never, R | Scope.Scope | Signals> {
  return Effect.contextWithEffect((ctx) =>
    Effect.map(FiberRef.get(shouldAwaitLoading), (shouldAwait) => {
      const [signals, scope] = Context.getMany(
        ctx,
        Signals,
        Scope.Scope
      )
      const ref = Ref.unsafeMake(AsyncData.noData<A, E>())
      const signal: Signal<A, E> = new SignalImpl(
        Effect.provide(initial, ctx),
        ref,
        signals,
        scope,
        shouldAwait
      )

      return signal
    })
  )
}

function incrementSignalVersion(signals: Signals, signal: Signal.Any): void {
  const version = signals.versions.get(signal) ?? -1
  signals.versions.set(signal, version + 1)
}

const variance: Signal.Variance<any, any, any> = {
  _A: (_) => _,
  _E: (_) => _,
  _R: (_) => _
}

class SignalImpl<A, E, R> extends Effectable.StructuralClass<A, E | AsyncData.Loading, R> implements Signal<A, E, R> {
  readonly [SignalTypeId]: Signal.Variance<A, E, R> = variance

  readonly updateLock = Effect.unsafeMakeSemaphore(1).withPermits(1)
  readonly data: Effect.Effect<AsyncData.AsyncData<A, E>, never, never>
  readonly commit: () => Effect.Effect<A, E | AsyncData.Loading, R>

  private _get: Effect.Effect<A, E | AsyncData.Loading, R>
  private _fiber: Fiber.Fiber<A, E> | null = null

  constructor(
    readonly initial: Effect.Effect<A, E, R>,
    readonly ref: Ref.Ref<AsyncData.AsyncData<A, E>>,
    readonly signals: Signals,
    readonly scope: Scope.Scope,
    readonly shouldAwait: boolean
  ) {
    super()

    this.data = Ref.get(ref)
    this._get = shouldAwait ? this._getAwait : this._getBackgroundInit
    this.commit = constant(this._get)
  }

  modify<B>(f: (a: A) => readonly [B, A]): Effect.Effect<B, E | AsyncData.Loading, R> {
    return this.updateLock(
      Effect.flatMap(this._get, (a) => {
        const [b, a_] = f(a)

        if (!equals(a, a_)) {
          incrementSignalVersion(this.signals, this)
        }

        return Effect.as(Ref.set(this.ref, AsyncData.success(a_)), b)
      })
    )
  }

  modifyEffect<B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R | R2> {
    return this.updateLock(
      Effect.flatMap(
        this._get,
        (a) =>
          Effect.flatMap(f(a), ([b, a_]) => {
            if (!equals(a, a_)) {
              incrementSignalVersion(this.signals, this)
            }
            return Effect.as(Ref.set(this.ref, AsyncData.success(a_)), b)
          })
      )
    )
  }

  runUpdate<R2>(effect: Effect.Effect<A, E, R2>): Effect.Effect<A, E, R2> {
    return Effect.flatMap(Ref.get(this.ref), (current) => {
      return Ref.update(this.ref, AsyncData.startLoading).pipe(
        Effect.zipRight(effect),
        Effect.onExit((exit) => {
          const updated = AsyncData.fromExit(exit)

          if (!AsyncData.dataEqual(current, updated)) {
            incrementSignalVersion(this.signals, this)
          }

          return Ref.set(this.ref, updated)
        }),
        Effect.onInterrupt(() => Ref.update(this.ref, AsyncData.stopLoading)),
        this.updateLock
      )
    })
  }

  private _getBackgroundInit = Effect.gen(this, function*(_) {
    const current = yield* _(Ref.get(this.ref))

    if (AsyncData.isSuccess(current) || AsyncData.isOptimistic(current)) {
      return current.value
    } else if (AsyncData.isNoData(current)) {
      // Load the initial value
      const loading = AsyncData.loading()
      // Set ref to loading synchronously, and we don't need to keep track of any fibers because the state will be Loading
      yield* _(Ref.set(this.ref, loading))
      yield* _(Effect.forkIn(this._backgroundInit(this.initial), this.scope))
      return yield* _(loading)
    } else if (AsyncData.isLoading(current)) {
      return yield* _(current)
    } else {
      return yield* _(Effect.failCause(current.cause))
    }
  })

  private _backgroundInit = (initial: Effect.Effect<A, E, R>) =>
    initial.pipe(
      Effect.exit,
      Effect.flatMap((exit) => Ref.set(this.ref, AsyncData.fromExit(exit))),
      Effect.tap(() => incrementSignalVersion(this.signals, this)),
      Effect.onInterrupt(() => Ref.set(this.ref, AsyncData.noData()))
    )

  private _getAwait = Effect.gen(this, function*(_) {
    const current = yield* _(Ref.get(this.ref))

    if (AsyncData.isSuccess(current) || AsyncData.isOptimistic(current)) {
      return current.value
    } else if (AsyncData.isNoData(current)) {
      return yield* _(this._init(this.initial))
    } else if (AsyncData.isLoading(current)) {
      return yield* _(current)
    } else {
      return yield* _(Effect.failCause(current.cause))
    }
  })

  private _init = (initial: Effect.Effect<A, E, R>) =>
    Effect.suspend(() => {
      if (this._fiber) {
        return Effect.fromFiber(this._fiber)
      } else {
        return initial.pipe(
          Effect.interruptible,
          Effect.onExit((exit) => Ref.set(this.ref, AsyncData.fromExit(exit))),
          Effect.tap(() => {
            incrementSignalVersion(this.signals, this)
            this._fiber = null
          }),
          Effect.onInterrupt(() => {
            this._fiber = null
            return Ref.set(this.ref, AsyncData.noData())
          }),
          Effect.forkIn(this.scope),
          Effect.tap((fiber) => {
            this._fiber = fiber
          }),
          Effect.uninterruptible,
          Effect.fromFiberEffect
        )
      }
    })
}

export const shouldAwaitLoading: FiberRef.FiberRef<boolean> = FiberRef.unsafeMake(false)
