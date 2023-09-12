import "./module-agumentation"

import * as Equal from "@effect/data/Equal"
import { dual, identity } from "@effect/data/Function"
import * as Hash from "@effect/data/Hash"
import * as Option from "@effect/data/Option"
import { type Pipeable, pipeArguments } from "@effect/data/Pipeable"
import * as Cause from "@effect/io/Cause"
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"
import type * as Exit from "@effect/io/Exit"
import * as Fiber from "@effect/io/Fiber"
import type * as Layer from "@effect/io/Layer"
import * as Ref from "@effect/io/Ref"
import type * as Scope from "@effect/io/Scope"
import * as SynchronizedRef from "@effect/io/SynchronizedRef"

import * as Schedule from "@effect/io/Schedule"
import { type Context } from "@typed/context"
import {
  compileCauseEffectOperatorSink,
  compileEffectLoop,
  compileEffectOperatorSink,
  type EffectOperator,
  FilterEffect,
  FilterMapEffect,
  fuseEffectOperators,
  liftSyncOperator,
  MapEffect,
  TapEffect
} from "@typed/fx/internal/effect-operator"
import type { FxFork } from "@typed/fx/internal/helpers"
import * as helpers from "@typed/fx/internal/helpers"
import * as Provide from "@typed/fx/internal/provide"
import * as Sink from "@typed/fx/internal/sink"
import * as strategies from "@typed/fx/internal/strategies"
import {
  compileSyncLoop,
  compileSyncOperatorFailureSink,
  compileSyncOperatorSink,
  Filter,
  FilterMap,
  fuseSyncOperators,
  Map,
  type SyncOperator
} from "@typed/fx/internal/sync-operator"

import type { DurationInput } from "@effect/data/Duration"
import type { Equivalence } from "@effect/data/Equivalence"
import { type Bounds, boundsFrom, mergeBounds } from "@typed/fx/internal/bounds"
import { matchEffectPrimitive } from "@typed/fx/internal/effect-primitive"
import type { InternalEffect } from "@typed/fx/internal/effect-primitive"

export const TypeId = Symbol.for("@typed/Fx/TypeId")
export type TypeId = typeof TypeId

export const ConstructorTypeId = Symbol.for("@typed/Fx/ConstructorTypeId")
export type ConstructorTypeId = typeof ConstructorTypeId

export const OperatorTypeId = Symbol.for("@typed/Fx/OperatorTypeId")
export type OperatorTypeId = typeof OperatorTypeId

export interface Fx<R, E, A> extends Fx.Variance<R, E, A>, Pipeable {}

export interface Subject<R, E, A> extends Fx<R, E, A>, Sink.Sink<E, A> {}

const Variance: Fx<any, any, any>[TypeId] = {
  _R: identity,
  _E: identity,
  _A: identity
}

export abstract class FxProto<R, E, A> implements Fx<R, E, A> {
  abstract readonly _fxTag: string
  readonly [TypeId]: Fx<R, E, A>[TypeId] = Variance

  constructor(
    readonly i0?: unknown,
    readonly i1?: unknown,
    readonly i2?: unknown
  ) {
  }

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  pipe() {
    return pipeArguments(this, arguments)
  }
}

export namespace Fx {
  export type Context<T> = T extends Fx<infer R, infer _E, infer _A> ? R : never
  export type Error<T> = T extends Fx<infer _R, infer E, infer _A> ? E : never
  export type Success<T> = T extends Fx<infer _R, infer _E, infer A> ? A : never

  export interface Variance<R, E, A> {
    readonly [TypeId]: {
      readonly _R: (_: never) => R
      readonly _E: (_: never) => E
      readonly _A: (_: never) => A
    }
  }
}

export type Primitive =
  | Empty
  | Fail<unknown>
  | FromEffect<unknown, unknown, unknown>
  | FromIterable<unknown>
  | FromSink<unknown, unknown, unknown>
  | Never
  | Succeed<unknown>
  | Suspend<unknown, unknown, unknown>
  | Sync<unknown>
  | ToFx<unknown, unknown, unknown>
  | Transformer<unknown, unknown, unknown>
  | TransformerCause<unknown, unknown, unknown>
  | TransformerCauseEffect<unknown, unknown, unknown>
  | TransformerEffect<unknown, unknown, unknown>
  | WithEarlyExit<unknown, unknown, unknown>
  | WithFlattenStrategy<unknown, unknown, unknown>
  | WithScopedFork<unknown, unknown, unknown>

export abstract class ToFx<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "ToFx"

  protected abstract toFx(): Fx<R, E, A>

  #fx: Fx<R, E, A> | undefined
  get fx(): Fx<R, E, A> {
    // Memoize the constructed Fx
    if (this.#fx === undefined) {
      return (this.#fx = this.toFx())
    } else {
      return this.#fx
    }
  }
}

export class Empty extends FxProto<never, never, never> {
  readonly _fxTag = "Empty"
}

export class Fail<E> extends FxProto<never, E, never> {
  readonly _fxTag = "Fail"

  constructor(readonly i0: Cause.Cause<E>) {
    super(i0)
  }
}

export class FromIterable<A> extends FxProto<never, never, A> {
  readonly _fxTag = "FromIterable"

  constructor(readonly i0: Iterable<A>) {
    super(i0)
  }
}

export class FromEffect<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "FromEffect"

  constructor(readonly i0: Effect.Effect<R, E, A>) {
    super(i0)
  }
}

export class FromSink<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "FromSink"

  constructor(readonly i0: (sink: Sink.Sink<E, A>) => Effect.Effect<R, never, unknown>) {
    super(i0)
  }
}

export class Merge<R, E, A> extends ToFx<R, E, A> {
  constructor(readonly i0: ReadonlyArray<Fx<R, E, A>>, readonly i1: strategies.MergeStrategy) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: ReadonlyArray<Fx<R, E, A>>, strategy: strategies.MergeStrategy): Fx<R, E, A> {
    // TODO: Flatten nested Merges

    if (fx.length === 0) return empty
    const nonEmptyFx = fx.filter((fx) => !(fx instanceof Empty))

    if (nonEmptyFx.length === 0) return empty
    if (nonEmptyFx.length === 1) return nonEmptyFx[0]

    const neverIndex = nonEmptyFx.findIndex((fx) => fx instanceof Never)

    if (neverIndex === -1) return new Merge(nonEmptyFx, strategy)

    switch (strategy._tag) {
      case "Switch":
      case "Ordered":
        // Will only emit up to the first Never
        return new Merge(nonEmptyFx.slice(0, neverIndex + 1), strategy)
      // No use creating fibers for Fx that don't emit
      case "Unordered":
        return new Merge(nonEmptyFx.filter((fx) => !(fx instanceof Never)), strategy)
    }
  }

  toFx(): Fx<R, E, A> {
    const { i0, i1 } = this

    switch (i1._tag) {
      case "Ordered": {
        const concurrency = i1.concurrency === Infinity ? "unbounded" : i1.concurrency

        return fromSink((sink) => (
          Effect.flatMap(helpers.withBuffers(i0.length, sink), (buffers) =>
            Effect.all(
              i0.map((fx, i) =>
                Effect.flatMap(
                  run(
                    fx,
                    Sink.WithContext(
                      sink.onFailure,
                      (a) => buffers.onSuccess(i, a)
                    )
                  ),
                  () => buffers.onEnd(i)
                )
              ),
              {
                concurrency
              }
            ))
        ))
      }
      case "Switch":
        return fromSink((sink) => Effect.all(i0.map((fx) => run(fx, sink)), { concurrency: 1 }))
      case "Unordered":
        return fromSink((sink) =>
          Effect.all(i0.map((fx) => run(fx, sink)), {
            concurrency: i1.concurrency === Infinity ? "unbounded" : i1.concurrency
          })
        )
    }
  }
}

export class Never extends FxProto<never, never, never> {
  readonly _fxTag = "Never"
}

export class Succeed<A> extends FxProto<never, never, A> {
  readonly _fxTag = "Succeed"

  constructor(readonly i0: A) {
    super(i0)
  }
}

export class Sync<A> extends FxProto<never, never, A> {
  readonly _fxTag = "Sync"

  constructor(readonly i0: () => A) {
    super(i0)
  }
}

export class Suspend<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "Suspend"

  constructor(readonly i0: () => Fx<R, E, A>) {
    super(i0)
  }
}

export type WithFlattenStrategyParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: FxFork
  readonly scope: Scope.Scope
}

export class WithFlattenStrategy<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "WithFlattenStrategy"

  constructor(
    readonly i0: (options: WithFlattenStrategyParams<E, A>) => Effect.Effect<R, never, unknown>,
    readonly i1: strategies.FlattenStrategy
  ) {
    super(i0, i1)
  }
}

export type WithEarlyExitParams<E, A> = {
  readonly sink: Sink.WithEarlyExit<E, A>
  readonly fork: helpers.ScopedFork
  readonly scope: Scope.Scope
}

export class WithEarlyExit<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "WithEarlyExit"

  constructor(
    readonly i0: (options: WithEarlyExitParams<E, A>) => Effect.Effect<R, never, unknown>
  ) {
    super(i0)
  }
}

export type WithScopedForkParams<E, A> = {
  readonly sink: Sink.Sink<E, A>
  readonly fork: helpers.ScopedFork
  readonly scope: Scope.Scope
}

export class WithScopedFork<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "WithScopedFork"

  constructor(
    readonly i0: (options: WithScopedForkParams<E, A>) => Effect.Effect<R, never, unknown>
  ) {
    super(i0)
  }
}

export class Transformer<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "Transformer"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: SyncOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: SyncOperator): Fx<R, E, A> {
    if (fx instanceof Transformer) {
      return new Transformer(fx.i0, fuseSyncOperators(fx.i1, operator))
    } else {
      return new Transformer<R, E, A>(fx, operator)
    }
  }
}

export class TransformerCause<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "TransformerCause"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: SyncOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: SyncOperator): Fx<R, E, A> {
    if (fx instanceof TransformerCause) {
      return new TransformerCause(fx.i0, fuseSyncOperators(fx.i1, operator))
    } else {
      return new TransformerCause<R, E, A>(fx, operator)
    }
  }
}

export class TransformerEffect<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "TransformerEffect"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: EffectOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: EffectOperator): Fx<R, E, A> {
    if (fx instanceof Transformer) {
      return new TransformerEffect(fx.i0, fuseEffectOperators(liftSyncOperator(fx.i1), operator))
    } else if (fx instanceof TransformerEffect) {
      // All EffectOperators can be fused together
      return new TransformerEffect(fx.i0, fuseEffectOperators(fx.i1, operator))
    } else {
      return new TransformerEffect<R, E, A>(fx, operator)
    }
  }
}

export class TransformerCauseEffect<R, E, A> extends FxProto<R, E, A> {
  readonly _fxTag = "TransformerCauseEffect"

  constructor(
    readonly i0: Fx<unknown, unknown, unknown>,
    readonly i1: EffectOperator
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<unknown, unknown, unknown>, operator: EffectOperator): Fx<R, E, A> {
    if (fx instanceof TransformerCause) {
      return new TransformerCauseEffect(fx.i0, fuseEffectOperators(liftSyncOperator(fx.i1), operator))
    } else if (fx instanceof TransformerCauseEffect) {
      // All EffectOperators can be fused together
      return new TransformerCauseEffect(fx.i0, fuseEffectOperators(fx.i1, operator))
    } else {
      return new TransformerCauseEffect<R, E, A>(fx, operator)
    }
  }
}

export class Slice<R, E, A> extends ToFx<R, E, A> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Bounds
  ) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: Fx<R, E, A>, bounds: Bounds): Fx<R, E, A> {
    if (fx instanceof Slice) {
      return new Slice(fx.i0, mergeBounds(fx.i1, bounds))
    } else if (fx instanceof Transformer && fx.i1._tag === "Map") {
      return new Transformer(Slice.make(fx.i0, bounds), fx.i1)
    } else {
      return new Slice(fx, bounds)
    }
  }

  toFx(): Fx<R, E, A> {
    const fx = this.i0
    const { max, min } = this.i1

    return withEarlyExit(({ sink }) =>
      Effect.suspend(() => {
        let toSkip = min
        let toTake = max

        return run(
          fx,
          Sink.WithContext(sink.onFailure, (a) =>
            Effect.suspend(() => {
              if (toSkip > 0) {
                toSkip -= 1
                return Effect.unit
              } else if (toTake > 0) {
                toTake -= 1
                return Effect.flatMap(sink.onSuccess(a), () => toTake <= 0 ? sink.earlyExit : Effect.unit)
              } else {
                return sink.earlyExit
              }
            }))
        )
      })
    )
  }
}

export class Loop<R, E, A, B, C> extends ToFx<R, E, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (b: B, a: A) => readonly [C, B],
    readonly i2: B
  ) {
    super(i0, i1, i2)
  }

  static make<R, E, A, B, C>(fx: Fx<R, E, A>, b: B, f: (b: B, a: A) => readonly [C, B]): Fx<R, E, C> {
    if (fx instanceof Transformer) {
      return new FilterMapLoop(fx.i0 as Fx<R, E, any>, b, compileSyncLoop(fx.i1, f))
    } else if (fx instanceof TransformerEffect) {
      return new FilterMapLoopEffect(
        fx.i0 as Fx<R, E, any>,
        b,
        compileEffectLoop(fx.i1, (b: B, a: A) => Effect.sync(() => f(b, a)))
      )
    } else {
      return new Loop(fx, f, b)
    }
  }

  toFx(): Fx<R, E, C> {
    return fromSink((sink) =>
      Effect.suspend(() => {
        let acc = this.i2

        return run(
          this.i0,
          Sink.WithContext(
            sink.onFailure,
            (a) =>
              Effect.suspend(() => {
                const [c, b] = this.i1(acc, a)

                acc = b

                return sink.onSuccess(c)
              })
          )
        )
      })
    )
  }
}

export class FilterMapLoop<R, E, A, B, C> extends ToFx<R, E, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: B,
    readonly i2: (b: B, a: A) => Option.Option<readonly [C, B]>
  ) {
    super(i0, i1, i2)
  }

  toFx(): Fx<R, E, C> {
    return fromSink((sink) =>
      Effect.suspend(() => {
        let acc = this.i1

        return run(
          this.i0,
          Sink.WithContext(
            sink.onFailure,
            (a) =>
              Effect.suspend(() => {
                const optionCB = this.i2(acc, a)

                if (Option.isNone(optionCB)) return Effect.unit

                const [c, b] = optionCB.value
                acc = b

                return sink.onSuccess(c)
              })
          )
        )
      })
    )
  }
}

export class LoopEffect<R, E, A, R2, E2, B, C> extends ToFx<R | R2, E | E2, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
    readonly i2: B
  ) {
    super(i0, i1, i2)
  }

  static make<R, E, A, R2, E2, B, C>(
    fx: Fx<R, E, A>,
    f: (b: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>,
    b: B
  ): Fx<R | R2, E | E2, C> {
    if (fx instanceof TransformerEffect) {
      return new FilterMapLoopEffect(fx.i0 as Fx<R, E, any>, b, compileEffectLoop(fx.i1, f))
    } else if (fx instanceof Transformer) {
      return new FilterMapLoopEffect(fx.i0 as Fx<R, E, any>, b, compileEffectLoop(liftSyncOperator(fx.i1), f))
    } else {
      return new LoopEffect(fx, f, b)
    }
  }

  toFx(): Fx<R | R2, E | E2, C> {
    const { i0, i1, i2 } = this

    return fromSink((sink) =>
      Effect.flatMap(SynchronizedRef.make(i2), (ref) =>
        run(
          i0,
          Sink.WithContext(sink.onFailure, (a) =>
            SynchronizedRef.updateEffect(ref, (b) =>
              Effect.matchCauseEffect(i1(b, a), {
                onFailure: (cause) => Effect.as(sink.onFailure(cause), b),
                onSuccess: ([c, b2]: readonly [C, B]) => Effect.as(sink.onSuccess(c), b2)
              })))
        ))
    )
  }
}

export class FilterMapLoopEffect<R, E, A, R2, E2, B, C> extends ToFx<R | R2, E | E2, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: B,
    readonly i2: (b: B, a: A) => Effect.Effect<R2, E2, Option.Option<readonly [C, B]>>
  ) {
    super(i0, i1, i2)
  }

  toFx(): Fx<R | R2, E | E2, C> {
    return fromSink((sink) =>
      Effect.suspend(() => {
        let acc = this.i1

        return run(
          this.i0,
          Sink.WithContext(
            sink.onFailure,
            (a) =>
              this.i2(acc, a).pipe(
                Effect.matchCauseEffect({
                  onFailure: sink.onFailure,
                  onSuccess: (optionCB) =>
                    Effect.suspend(() => {
                      if (Option.isNone(optionCB)) return Effect.unit

                      const [c, b] = optionCB.value
                      acc = b

                      return sink.onSuccess(c)
                    })
                })
              )
          )
        )
      })
    )
  }
}

export class FxProvide<R, E, A, R2, E2, B> extends ToFx<Exclude<R, B> | R2, E | E2, A> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Provide.Provide<R2, E2, B>
  ) {
    super(i0, i1)
  }

  static make<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    provide: Provide.Provide<R2, E2, B>
  ): Fx<Exclude<R, B> | R2, E | E2, A> {
    if (fx instanceof FxProvide) {
      return new FxProvide(fx.i0, Provide.merge(fx.i1, provide))
    } else {
      return new FxProvide(fx, provide)
    }
  }

  protected toFx(): Fx<R2 | Exclude<R, B>, E | E2, A> {
    return fromSink((sink) =>
      Effect.catchAllCause(Provide.provideToEffect(run(this.i0, sink), this.i1), sink.onFailure)
    )
  }
}

export class Snapshot<R, E, A, R2, E2, B, R3, E3, C> extends ToFx<R | R2 | R3, E | E2 | E3, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: Fx<R2, E2, B>,
    readonly i2: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ) {
    super(i0, i1, i2)
  }

  toFx(): Fx<R | R2 | R3, E | E2 | E3, C> {
    return matchFxKind<R, E, A, Fx<R | R2 | R3, E | E2 | E3, C>>(this.i0, {
      Fx: (fx) =>
        matchFxKind(this.i1, {
          Fx: (fx2) => this.#runScoped(fx, fx2, this.i2),
          Effect: (effect2) => mapEffect(fx, (a) => Effect.flatMap(effect2, (b) => this.i2(a, b))),
          Cause: (cause) => this.#runScoped(fx, this.i1, () => Effect.failCause(cause))
        }),
      Effect: (effect) =>
        matchFxKind(this.i1, {
          Fx: (fx2) => this.#runScoped(effect, fx2, this.i2),
          Effect: (effect2) => Effect.flatMap(effect, (a) => Effect.flatMap(effect2, (b) => this.i2(a, b))),
          Cause: (cause2) =>
            Effect.matchCauseEffect(effect, {
              onFailure: (cause) => Effect.failCause(Cause.sequential(cause, cause2)),
              onSuccess: () => Effect.failCause(cause2)
            })
        }),
      Cause: (cause) =>
        matchFxKind(this.i1, {
          Fx: () => cause,
          Effect: () => cause,
          Cause: (cause2) => Cause.sequential(cause, cause2)
        })
    })
  }

  #runScoped<R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    fx2: Fx<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, C> {
    return withScopedFork(({ fork, sink }) =>
      Effect.flatMap(Ref.make(Option.none<B>()), (ref) =>
        Effect.flatMap(
          fork(run(
            fx2,
            Sink.WithContext(
              sink.onFailure,
              (b) => Ref.set(ref, Option.some(b))
            )
          )),
          () =>
            run(
              fx,
              Sink.WithContext(
                sink.onFailure,
                (a) =>
                  Ref.get(ref).pipe(
                    Effect.flatten,
                    Effect.flatMap((b) => Effect.matchCauseEffect(f(a, b), sink)),
                    Effect.optionFromOptional
                  )
              )
            )
        ))
    )
  }
}

export class Middleware<R, R2, E, A> extends ToFx<R2, E, A> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ) {
    super(i0, i1)
  }

  static make<R, R2, E, A>(
    fx: Fx<R, E, A>,
    middleware: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): Fx<R2, E, A> {
    if (fx instanceof Middleware) {
      return new Middleware(fx.i0 as Fx<R, E, any>, (effect, sink) => middleware(fx.i1(effect, sink), sink))
    } else {
      return new Middleware(fx, middleware)
    }
  }

  protected toFx(): Fx<R2, E, A> {
    return fromSink((sink) => this.i1(run(this.i0, sink), sink))
  }
}

export function run<R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchFxKind(fx, {
    Fx: (fx) => runFxPrimitive<R, E, A, R2>(fx, sink),
    Effect: (effect) => runEffect<R, E, A, R2>(effect, sink),
    Cause: (cause) => sink.onFailure(cause)
  })
}

function matchFxKind<R, E, A, B>(
  fx: Fx<R, E, A>,
  matchers: {
    readonly Fx: (fx: Fx<R, E, A>) => B
    readonly Effect: (effect: Effect.Effect<R, E, A>) => B
    readonly Cause: (cause: Cause.Cause<E>) => B
  }
): B {
  if (TypeId in fx) {
    return matchers.Fx(fx as any)
  } else if (Effect.EffectTypeId in fx) {
    return matchers.Effect(fx as any)
  } else if (Cause.CauseTypeId in fx) {
    return matchers.Cause(fx as any)
  } else {
    throw new TypeError(`Unknown Fx type: ${fx}`)
  }
}

function matchFxPrimitive<R, E, A, B>(
  fx: Fx<R, E, A> & Primitive,
  matchers: {
    readonly Empty: (fx: Empty) => B
    readonly Fail: (fx: Fail<E>) => B
    readonly FromEffect: (fx: FromEffect<R, E, A>) => B
    readonly FromIterable: (fx: FromIterable<A>) => B
    readonly FromSink: (fx: FromSink<R, E, A>) => B
    readonly Never: (fx: Never) => B
    readonly Succeed: (fx: Succeed<A>) => B
    readonly Suspend: (fx: Suspend<R, E, A>) => B
    readonly Sync: (fx: Sync<A>) => B
    readonly ToFx: (fx: ToFx<R, E, A>) => B
    readonly WithEarlyExit: (fx: WithEarlyExit<R, E, A>) => B
    readonly WithScopedFork: (fx: WithScopedFork<R, E, A>) => B
    readonly WithFlattenStrategy: (fx: WithFlattenStrategy<R, E, A>) => B
    readonly Transformer: (fx: Transformer<R, E, A>) => B
    readonly TransformerEffect: (fx: TransformerEffect<R, E, A>) => B
    readonly TransformerCause: (fx: TransformerCause<R, E, A>) => B
    readonly TransformerCauseEffect: (fx: TransformerCauseEffect<R, E, A>) => B
  }
): B {
  return matchers[fx._fxTag](fx as any)
}

function runFxPrimitive<R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchFxPrimitive<R, E, A, Effect.Effect<R | R2, never, unknown>>(fx as Fx<R, E, A> & Primitive, {
    Empty: constUnit,
    Fail: (fx) => sink.onFailure(fx.i0),
    FromEffect: (fx) => runEffect(fx.i0, sink),
    FromIterable: (fx) => Effect.forEach(fx.i0, sink.onSuccess),
    FromSink: (fx) => Effect.contextWithEffect((ctx: Context<R | R2>) => fx.i0(Sink.provide(sink, ctx))),
    Never: () => Effect.never,
    Succeed: (fx) => sink.onSuccess(fx.i0),
    Suspend: (fx) => Effect.suspend(() => run(fx.i0(), sink)),
    Sync: (fx) => Effect.suspend(() => sink.onSuccess(fx.i0())),
    ToFx: ({ fx }) => run(fx, sink),
    WithEarlyExit: (fx) =>
      Effect.contextWithEffect((ctx) =>
        helpers.withScopedFork((fork, scope) =>
          helpers.withEarlyExit(Sink.provide(sink, ctx), (sink) => fx.i0({ sink, fork, scope }))
        )
      ),
    WithScopedFork: (fx) =>
      Effect.contextWithEffect((ctx) =>
        helpers.withScopedFork((fork, scope) => fx.i0({ sink: Sink.provide(sink, ctx), fork, scope }))
      ),
    WithFlattenStrategy: (fx) =>
      Effect.contextWithEffect((ctx) =>
        helpers.withFlattenStrategy(fx.i1)((fork, scope) => fx.i0({ sink: Sink.provide(sink, ctx), fork, scope }))
      ),
    Transformer: (transformer) => runTransformer(transformer, sink),
    TransformerEffect: (transformer) => runTransformerEffect(transformer, sink),
    TransformerCause: (transformer) => runTransformerCause(transformer, sink),
    TransformerCauseEffect: (transformer) => runTransformerCauseEffect(transformer, sink)
  })
}

function runTransformer<R, E, A, R2>(
  fx: Transformer<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return run(fx.i0 as Fx<R, E, A>, compileSyncOperatorSink(fx.i1, sink))
}

function runTransformerEffect<R, E, A, R2>(
  fx: TransformerEffect<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return run(fx.i0 as Fx<R, E, A>, compileEffectOperatorSink(fx.i1, sink))
}

function runTransformerCause<R, E, A, R2>(
  fx: TransformerCause<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return run(fx.i0 as Fx<R, E, A>, compileSyncOperatorFailureSink(fx.i1, sink))
}

function runTransformerCauseEffect<R, E, A, R2>(
  fx: TransformerCauseEffect<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
) {
  return run(fx.i0 as Fx<R, E, A>, compileCauseEffectOperatorSink(fx.i1, sink))
}

function runEffect<R, E, A, R2>(
  effect: Effect.Effect<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchEffectPrimitive(effect as InternalEffect, {
    Success: (success) => sink.onSuccess(success.i0 as A),
    Failure: (failure) => sink.onFailure(failure.i0 as Cause.Cause<E>),
    Sync: (sync) => Effect.suspend(() => sink.onSuccess(sync.i0() as A)),
    Left: (left) => sink.onFailure(Cause.fail(left.left as E)),
    Right: (right) => sink.onSuccess(right.right as A),
    Some: (some) => sink.onSuccess(some.value as A),
    None: () => sink.onFailure(Cause.fail(Cause.NoSuchElementException() as E)),
    Otherwise: () => Effect.matchCauseEffect(effect, sink)
  })
}

export function succeed<A>(value: A): Fx<never, never, A> {
  return new Succeed(value)
}

export function fromIterable<A>(iterable: Iterable<A>): Fx<never, never, A> {
  return new FromIterable(iterable)
}

export const map: {
  <A, B>(f: (a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B>
} = dual(2, function map<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B) {
  return Transformer.make<R, E, B>(fx, Map(f))
})

export const filter: {
  <A, B extends A>(f: (a: A) => a is B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <A>(f: (a: A) => boolean): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A, B extends A>(fx: Fx<R, E, A>, f: (a: A) => a is B): Fx<R, E, B>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: A) => boolean): Fx<R, E, A>
} = dual(2, function map<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => boolean) {
  return Transformer.make<R, E, B>(fx, Filter(f))
})

export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B>
} = dual(2, function map<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>) {
  return Transformer.make<R, E, B>(fx, FilterMap(f))
})

export const mapErrorCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Cause.Cause<E2>): Fx<R, E2, A>
} = dual(2, function map<R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Cause.Cause<E2>) {
  return TransformerCause.make<R, E2, A>(fx, Map(f))
})

export const mapError: {
  <E, E2>(f: (a: E) => E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: E) => E2): Fx<R, E2, A>
} = dual(2, function map<R, E, A, E2>(fx: Fx<R, E, A>, f: (a: E) => E2) {
  return TransformerCause.make<R, E2, A>(fx, Map(Cause.map(f)))
})

export const filterCause: {
  <E, E2 extends E>(f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <E>(f: (a: Cause.Cause<E>) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, E2 extends E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => a is Cause.Cause<E2>): Fx<R, E2, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => boolean): Fx<R, E, A>
} = dual(2, function map<R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => boolean) {
  return TransformerCause.make<R, E2, A>(fx, Filter(f))
})

export const filterMapCause: {
  <E, E2>(f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>): Fx<R, E2, A>
} = dual(2, function map<R, E, A, E2>(fx: Fx<R, E, A>, f: (a: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>) {
  return TransformerCause.make<R, E2, A>(fx, FilterMap(f))
})

export function observe<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  onSuccees: (a: A) => Effect.Effect<R2, E2, unknown>
): Effect.Effect<R | R2, E | E2, void> {
  return helpers.withScopedFork((fork) =>
    Effect.flatMap(Deferred.make<E | E2, void>(), (deferred) =>
      run(
        fx,
        Sink.WithContext(
          (cause) => Deferred.failCause(deferred, cause),
          (a) => Effect.catchAllCause(onSuccees(a), (cause) => Deferred.failCause(deferred, cause))
        )
      ).pipe(
        Effect.intoDeferred(deferred),
        fork,
        Effect.flatMap(() => Deferred.await(deferred))
      ))
  )
}

const constUnit = () => Effect.unit

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, void> {
  return observe(fx, constUnit)
}

export function toArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, Array<A>> {
  return Effect.suspend(() => {
    const array: Array<A> = []

    return Effect.as(
      observe(fx, (a) => Effect.sync(() => array.push(a))),
      array
    )
  })
}

export function toReadonlyArray<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, ReadonlyArray<A>> {
  return toArray(fx)
}

export const flatMapWithStrategy: {
  <A, R2, E2, B>(
    f: (a: A) => Fx<R2, E2, B>,
    strategy: strategies.FlattenStrategy
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    strategy: strategies.FlattenStrategy
  ): Fx<R | R2, E | E2, B>
} = dual(
  3,
  function flatMapWithStrategy<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    strategy: strategies.FlattenStrategy
  ): Fx<R | R2, E | E2, B> {
    return new WithFlattenStrategy(
      ({ fork, sink }) => run(fx, Sink.WithContext(sink.onFailure, (a) => fork(run(f(a), sink)))),
      strategy
    )
  }
)

export const switchMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function switchMap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Switch)
  }
)

export const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function exhaustmap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Exhaust)
  }
)

export const exhaust = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => exhaustMap(fx, identity)

export const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function exhaustMapLatest<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.ExhaustLatest)
  }
)

export const exhaustLatest = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => exhaustMapLatest(fx, identity)

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function flatMap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Unbounded)
  }
)

export const flatten = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => flatMap(fx, identity)

export const flatMapConcurrently: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>, concurrency: number): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>, concurrency: number): Fx<R | R2, E | E2, B>
} = dual(
  3,
  function flatMapConcurrently<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
    concurrency: number
  ): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Bounded(concurrency))
  }
)

export const concatMap: {
  <A, R2, E2, B>(f: (a: A) => Fx<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Fx<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function concatMap<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return flatMapConcurrently(fx, f, 1)
  }
)

export const acquireUseRelease: {
  <A, R2, E2, B, R3, E3>(
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): <R, E>(acquire: Effect.Effect<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, B>

  <R, E, A, R2, E2, B, R3, E3>(
    acquire: Effect.Effect<R, E, A>,
    use: (a: A) => Fx<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): Fx<R | R2 | R3, E | E2 | E3, B>
} = dual(3, function acquireUseRelease<R, E, A, R2, E2, B, R3, E3>(
  acquire: Effect.Effect<R, E, A>,
  use: (a: A) => Fx<R2, E2, B>,
  release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
): Fx<R | R2 | R3, E | E2 | E3, B> {
  return fromSink((sink) =>
    Effect.catchAllCause(
      Effect.acquireUseRelease(
        acquire,
        (a) => run(use(a), sink),
        (a, exit) => Effect.catchAllCause(release(a, exit), sink.onFailure)
      ),
      sink.onFailure
    )
  )
})

export function combine<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  {
    readonly [K in keyof FX]: Fx.Success<FX[K]>
  }
> {
  return fromSink((sink) =>
    Effect.suspend(() => {
      const values = new globalThis.Map<number, any>()
      const total = fxs.length

      const sample = () =>
        Array.from({ length: total }, (_, i) => values.get(i)) as {
          readonly [K in keyof FX]: Fx.Success<FX[K]>
        }

      const emitIfReady = (value: any, index: number) =>
        Effect.suspend(() => {
          values.set(index, value)
          if (values.size === total) {
            return sink.onSuccess(sample())
          } else {
            return Effect.unit
          }
        })

      return Effect.all(
        fxs.map((fx, index) => run(fx, Sink.WithContext(sink.onFailure, (a) => emitIfReady(a, index)))),
        { concurrency: "unbounded" }
      )
    })
  )
}

export function merge<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Unordered(Infinity))
}

export const mergeConcurrently: {
  (concurrency: number): <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = dual(2, function mergeConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Unordered(concurrency))
})

export function mergeBuffer<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Ordered(Infinity))
}

export const mergeBufferConcurrently: {
  (concurrency: number): <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX
  ) => Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  <const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fxs: FX,
    concurrency: number
  ): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
} = dual(2, function mergeConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX,
  concurrency: number
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return Merge.make(fxs, strategies.Ordered(concurrency))
})

export const mergeSwitch = <const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> => Merge.make(fxs, strategies.Switch)

export function race<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return fromSink((sink) =>
    Effect.suspend(() => {
      const fibers: Array<Fiber.Fiber<any, any>> = []
      let winnerFound = -1

      return Effect.all(fxs.map((fx, i) => run(fx, raceSink(i))), { concurrency: "unbounded" })

      function raceSink(
        i: number
      ): Sink.WithContext<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> {
        return Sink.WithContext(
          (cause) => raceEvent(i, cause, sink.onFailure),
          (a) => raceEvent(i, a, sink.onSuccess)
        )
      }

      function raceEvent<A>(i: number, value: A, f: (a: A) => Effect.Effect<Fx.Context<FX[number]>, never, unknown>) {
        // We found a winner!
        if (winnerFound === -1) {
          // Remove winner from the list of fibers to interrupt
          fibers.splice(winnerFound = i, 1)

          // Interrupt fibers and emit value
          return Fiber.interruptAll(fibers).pipe(
            Effect.flatMap(() => f(value))
          )
        } else {
          // Emit only if the value is from the winning fiber
          return i === winnerFound ? f(value) : Effect.unit
        }
      }
    })
  )
}

export const empty: Fx<never, never, never> = new Empty()

export const never: Fx<never, never, never> = new Never()

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> => new Fail(cause)

export const fail = <E>(e: E): Fx<never, E, never> => failCause(Cause.fail(e))

export const fromSink = <R, E, A>(
  f: (sink: Sink.Sink<E, A>) => Effect.Effect<R, E, unknown>
): Fx<R, E, A> => new FromSink((sink) => Effect.catchAllCause(f(sink), sink.onFailure))

export const suspend = <R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> => new Suspend(f)

export const sync = <A>(f: () => A): Fx<never, never, A> => new Sync(f)

export const slice: {
  (skip: number, take: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A>
} = dual(3, function slice<R, E, A>(fx: Fx<R, E, A>, skip: number, take: number): Fx<R, E, A> {
  return Slice.make(fx, boundsFrom(skip, take))
})

export const take: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, function take<R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> {
  return slice(fx, 0, n)
})

export const drop: {
  (n: number): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A>
} = dual(2, function drop<R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> {
  return slice(fx, n, Infinity)
})

export const takeWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function takeWhile<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return withEarlyExit(({ sink }) =>
      run(
        fx,
        Sink.WithContext(sink.onFailure, (a) =>
          Effect.matchCauseEffect(predicate(a), {
            onFailure: sink.onFailure,
            onSuccess: (b) => b ? sink.onSuccess(a) : sink.earlyExit
          }))
      )
    )
  }
)

export const takeUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function takeUntil<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return takeWhile(fx, (a) => Effect.map(predicate(a), (x) => !x))
  }
)

export const dropWhile: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function dropWhile<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return withEarlyExit(({ sink }) =>
      Effect.suspend(() => {
        let isDropping = true

        return run(
          fx,
          Sink.WithContext(sink.onFailure, (a) =>
            isDropping ?
              Effect.matchCauseEffect(predicate(a), {
                onFailure: sink.onFailure,
                onSuccess: (b) => {
                  if (b) {
                    return Effect.unit
                  } else {
                    isDropping = false
                    return sink.onSuccess(a)
                  }
                }
              }) :
              sink.onSuccess(a))
        )
      })
    )
  }
)

export const dropUntil: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function dropUntil<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return dropWhile(fx, (a) => Effect.map(predicate(a), (x) => !x))
  }
)

export const dropAfter: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function dropAfter<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    return fromSink((sink) =>
      Effect.suspend(() => {
        let isDropping = false

        return run(
          fx,
          Sink.WithContext(sink.onFailure, (a) =>
            isDropping ?
              Effect.unit :
              Effect.matchCauseEffect(predicate(a), {
                onFailure: sink.onFailure,
                onSuccess: (b) => {
                  if (b) {
                    isDropping = true
                    return Effect.unit
                  } else {
                    return sink.onSuccess(a)
                  }
                }
              }))
        )
      })
    )
  }
)

export const continueWith: {
  <R2, E2, A>(f: () => Fx<R2, E2, A>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, R2, E2, A>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, A>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function continueWith<R, E, R2, E2, A>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, A>): Fx<R | R2, E | E2, A> {
    return fromSink((sink) => Effect.flatMap(run(fx, sink), () => run(f(), sink)))
  }
)

export const recoverWith: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, A>): Fx<R | R2, E2, A | B>
} = dual(
  2,
  function recoverWith<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
  ): Fx<R | R2, E2, A | B> {
    return fromSink((sink) => Effect.catchAllCause(observe(fx, sink.onSuccess), (cause) => run(f(cause), sink)))
  }
)

export const mapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function mapEffect<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return TransformerEffect.make(fx, MapEffect(f))
  }
)

export const tap: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function tap<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return TransformerEffect.make(fx, TapEffect(f))
  }
)

export const filterEffect: {
  <A, R2, E2>(predicate: (a: A) => Effect.Effect<R2, E2, boolean>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, predicate: (a: A) => Effect.Effect<R2, E2, boolean>): Fx<R | R2, E | E2, A>
} = dual(2, function filterEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  predicate: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> {
  return TransformerEffect.make(fx, FilterEffect(predicate))
})

export const filterMapEffect: {
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E | E2, B>
} = dual(2, function filterEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Fx<R | R2, E | E2, A> {
  return TransformerEffect.make(fx, FilterMapEffect(f))
})

export const middleware: {
  <R, E, A, R2>(
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): (fx: Fx<R, E, A>) => Fx<R | R2, E, A>

  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
  ): Fx<R | R2, E, A>
} = dual(2, function middleware<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (effect: Effect.Effect<R, never, unknown>, sink: Sink.Sink<E, A>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return Middleware.make(fx, (effect, sink) => Effect.catchAllCause(f(effect, sink), sink.onFailure))
})

export const loop: {
  <A, B, C>(seed: B, f: (acc: B, a: A) => readonly [C, B]): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, C>
  <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C>
} = dual(3, function loop<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => readonly [C, B]
): Fx<R, E, C> {
  return Loop.make(fx, seed, f)
})

export const loopEffect: {
  <B, A, R2, E2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, C>

  <R, E, A, B, R2, E2, C>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
  ): Fx<R | R2, E | E2, C>
} = dual(3, function loopEffect<R, E, A, B, R2, E2, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
): Fx<R | R2, E | E2, C> {
  return LoopEffect.make(fx, f, seed)
})

export const startWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = dual(2, function startWith<R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B> {
  return fromSink((sink) => Effect.flatMap(sink.onSuccess(value), () => run(fx, sink)))
})

export const endWith: {
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
} = dual(2, function endWith<R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B> {
  return fromSink((sink) => Effect.flatMap(run(fx, sink), () => sink.onSuccess(value)))
})

export const scan: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Fx<R, E, B>
} = dual(3, function loop<R, E, A, B>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => B
): Fx<R, E, B> {
  return continueWith(
    new Succeed(seed),
    () =>
      Loop.make(fx, seed, (b, a) => {
        const b2 = f(b, a)

        return [b2, b2]
      })
  )
})

export const scanEffect: {
  <A, B, R2, E2>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, B>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, B, R2, E2>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(3, function loopEffect<R, E, A, B, R2, E2>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R2, E2, B>
): Fx<R | R2, E | E2, B> {
  return continueWith(
    new Succeed(seed),
    () => LoopEffect.make(fx, (b, a) => Effect.map(f(b, a), (b2) => [b2, b2]), seed)
  )
})

export const flatMapCauseWithStrategy: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    strategy: strategies.FlattenStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    strategy: strategies.FlattenStrategy
  ): Fx<R | R2, E2, A | B>
} = dual(3, function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  strategy: strategies.FlattenStrategy
): Fx<R | R2, E2, A | B> {
  return new WithFlattenStrategy(
    ({ fork, sink }) => run(fx, Sink.WithContext((cause) => fork(run(f(cause), sink)), sink.onSuccess)),
    strategy
  )
})

export const flatMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Unbounded)
})

export const flatMapCauseConcurrently: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    concurrency: number
  ): Fx<R | R2, E2, A | B>
} = dual(3, function flatMapCauseConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  concurrency: number
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Bounded(concurrency))
})

export const switchMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function switchMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Switch)
})

export const exhaustMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Exhaust)
})

export const exhaustMapLatestCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function exhaustMapLatestCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.ExhaustLatest)
})

export const matchCauseWithStrategy: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    strategy: strategies.FlattenStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    strategy: strategies.FlattenStrategy
  ): Fx<R | R2, E2 | E3, B | C>
} = dual(4, function flatMapCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
  strategy: strategies.FlattenStrategy
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new WithFlattenStrategy(
    ({ fork, sink }) => run(fx, Sink.WithContext((cause) => fork(run(f(cause), sink)), (a) => fork(run(g(a), sink)))),
    strategy
  )
})

export const matchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, strategies.Unbounded)
})

export const matchCauseConcurrently: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    concurrency: number
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>,
    concurrency: number
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(4, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
  concurrency: number
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, strategies.Bounded(concurrency))
})

export const switchMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, strategies.Switch)
})

export const exhaustMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, strategies.Exhaust)
})

export const exhaustLatestMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    g: (a: A) => Fx<R3, E3, C>
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(3, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, f, g, strategies.ExhaustLatest)
})

export const withEarlyExit = <R, E, A>(
  f: (params: WithEarlyExitParams<E, A>) => Effect.Effect<R, never, unknown>
): Fx<R, E, A> => new WithEarlyExit(f)

export const withScopedFork = <R, E, A>(
  f: (params: WithScopedForkParams<E, A>) => Effect.Effect<R, never, unknown>
): Fx<R, E, A> => new WithScopedFork(f)

export const during: {
  <R2, E2, R3, E3>(
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, A>

  <R, E, A, R2, E2, R3, E3>(
    fx: Fx<R, E, A>,
    window: Fx<R2, E2, Fx<R3, E3, unknown>>
  ): Fx<R | R2 | R3, E | E2 | E3, A>
} = dual(2, function during<R, E, A, R2, E2, R3, E3>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, Fx<R3, E3, unknown>>
): Fx<R | R2 | R3, E | E2 | E3, A> {
  return withEarlyExit(({ fork, sink }) =>
    Effect.suspend(() => {
      let taking = false

      return Effect.flatMap(
        fork(run(
          take(window, 1),
          Sink.WithContext(sink.onFailure, (nested) => {
            taking = true
            return fork(run(take(nested, 1), Sink.WithContext(sink.onFailure, () => sink.earlyExit)))
          })
        )),
        () =>
          run(
            fx,
            Sink.Sink(
              sink.onFailure,
              (a) => taking ? sink.onSuccess(a) : Effect.unit
            )
          )
      )
    })
  )
})

export const since: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = dual(2, function since<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, unknown>
): Fx<R | R2, E | E2, A> {
  return during(fx, switchMap(take(window, 1), () => never))
})

export const until: {
  <R2, E2>(window: Fx<R2, E2, unknown>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, window: Fx<R2, E2, unknown>): Fx<R | R2, E | E2, A>
} = dual(2, function until<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, unknown>
): Fx<R | R2, E | E2, A> {
  return during(fx, succeed(window))
})

export const fromScheduled: {
  <R2>(scheduled: Schedule.Schedule<R2, unknown, unknown>): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R | R2, E, A>
  <R, E, A, R2>(fx: Effect.Effect<R, E, A>, scheduled: Schedule.Schedule<R2, unknown, unknown>): Fx<R | R2, E, A>
} = dual(2, function fromScheduled<R, E, A, R2>(
  fx: Effect.Effect<R, E, A>,
  scheduled: Schedule.Schedule<R2, unknown, unknown>
): Fx<R | R2, E, A> {
  return fromSink((sink) =>
    Effect.catchAllCause(Effect.repeat(Effect.matchCauseEffect(fx, sink), scheduled), sink.onFailure)
  )
})

export const periodic: {
  (duration: DurationInput): <R, E, A>(fx: Effect.Effect<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Effect.Effect<R, E, A>, duration: DurationInput): Fx<R, E, A>
} = dual(2, function periodic<R, E, A>(
  fx: Effect.Effect<R, E, A>,
  duration: DurationInput
): Fx<R, E, A> {
  return fromScheduled(fx, Schedule.spaced(duration))
})

export const provideContext: {
  <R>(context: Context<R>): <E, A>(fx: Fx<R, E, A>) => Fx<never, E, A>
  <R, E, A>(fx: Fx<R, E, A>, context: Context<R>): Fx<never, E, A>
} = dual(2, function provideContext<R, E, A>(
  fx: Fx<R, E, A>,
  context: Context<R>
): Fx<never, E, A> {
  return FxProvide.make(fx, Provide.ProvideContext(context))
})

export const provideSomeContext: {
  <R2>(context: Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Context<R2>): Fx<Exclude<R, R2>, E, A>
} = dual(2, function provideSomeContext<R, E, A, R2>(
  fx: Fx<R, E, A>,
  context: Context<R2>
): Fx<Exclude<R, R2>, E, A> {
  return FxProvide.make(fx, Provide.ProvideSomeContext(context))
})

export const provideLayer: {
  <R2, E2, R>(layer: Layer.Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E | E2, A>
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, R>): Fx<R2, E | E2, A>
} = dual(2, function provideLayer<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, R>
): Fx<R2, E | E2, A> {
  return FxProvide.make(fx, Provide.ProvideLayer(layer))
})

export const provideSomeLayer: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<R2 | Exclude<R, S>, E | E2, A>
} = dual(2, function provideSomeLayer<R, E, A, R2, E2, S>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, R>
): Fx<Exclude<R, S> | R2, E | E2, A> {
  return FxProvide.make(fx, Provide.ProvideSomeLayer(layer))
})

export const skipRepeatsWith: {
  <A>(eq: Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A>
} = dual(2, function skipRepeatsWith<R, E, A>(
  fx: Fx<R, E, A>,
  eq: Equivalence<A>
): Fx<R, E, A> {
  return new FilterMapLoop(fx, Option.none<A>(), (previous, a) =>
    Option.match(previous, {
      onNone: () => Option.some([a, Option.some(a)]),
      onSome: (prev) => eq(a, prev) ? Option.none() : Option.some([a, Option.some(a)])
    }))
})

export const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = (fx) => skipRepeatsWith(fx, Equal.equals)
