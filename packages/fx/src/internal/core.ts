import type { Exit } from "effect"
import {
  Cause,
  Chunk,
  Deferred,
  Effect,
  Effectable,
  Either,
  Equal,
  Fiber,
  Layer,
  Option,
  Ref,
  Scope,
  Stream,
  SynchronizedRef
} from "effect"

import { dual, identity } from "effect/Function"

import { type Context, isContext, type Tag } from "@typed/context"
import {
  compileEffectLoop,
  FilterEffect,
  FilterMapEffect,
  liftSyncOperator,
  MapEffect,
  TapEffect
} from "@typed/fx/internal/effect-operator"
import * as helpers from "@typed/fx/internal/helpers"
import * as Provide from "@typed/fx/internal/provide"
import * as strategies from "@typed/fx/internal/strategies"
import { compileSyncReducer, Filter, FilterMap, Map } from "@typed/fx/internal/sync-operator"
import * as Schedule from "effect/Schedule"

import * as Emitter from "@typed/fx/Emitter"
import type {
  FlattenStrategy,
  Fx,
  FxInput,
  MergeStrategy,
  WithEarlyExitParams,
  WithFlattenStrategyParams,
  WithScopedForkParams
} from "@typed/fx/Fx"
import { type Bounds, boundsFrom, mergeBounds } from "@typed/fx/internal/bounds"
import { type InternalEffect, matchEffectPrimitive } from "@typed/fx/internal/effect-primitive"
import {
  Empty,
  Fail,
  FromIterable,
  FromSink,
  Never,
  Succeed,
  Suspend,
  Sync,
  ToFx,
  Transformer,
  TransformerCause,
  TransformerEffect,
  WithEarlyExit,
  WithFlattenStrategy,
  WithScopedFork
} from "@typed/fx/internal/fx-primitive"
import { adjustTime } from "@typed/fx/internal/helpers"
import { matchFxInput } from "@typed/fx/internal/matchers"
import { OnceEffect } from "@typed/fx/internal/protos"
import * as Sink from "@typed/fx/Sink"
import type { DurationInput } from "effect/Duration"
import type { Equivalence } from "effect/Equivalence"
import type { Runtime } from "effect/Runtime"
import { run } from "./run"

const constUnit = () => Effect.unit

class Merge<R, E, A> extends ToFx<R, E, A> {
  constructor(readonly i0: ReadonlyArray<Fx<R, E, A>>, readonly i1: MergeStrategy) {
    super(i0, i1)
  }

  static make<R, E, A>(fx: ReadonlyArray<Fx<R, E, A>>, strategy: MergeStrategy): Fx<R, E, A> {
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
        return new Merge(nonEmptyFx, strategy)
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
                      (cause) => Cause.isInterruptedOnly(cause) ? Effect.unit : sink.onFailure(cause),
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

class Slice<R, E, A> extends ToFx<R, E, A> {
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

class Loop<R, E, A, B, C> extends ToFx<R, E, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (b: B, a: A) => readonly [C, B],
    readonly i2: B
  ) {
    super(i0, i1, i2)
  }

  static make<R, E, A, B, C>(fx: Fx<R, E, A>, b: B, f: (b: B, a: A) => readonly [C, B]): Fx<R, E, C> {
    if (fx instanceof Transformer) {
      return FilterMapLoop.make(fx.i0 as Fx<R, E, any>, b, compileSyncReducer(fx.i1, f))
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

class FilterMapLoop<R, E, A, B, C> extends ToFx<R, E, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: B,
    readonly i2: (b: B, a: A) => Option.Option<readonly [C, B]>
  ) {
    super(i0, i1, i2)
  }

  static make<R, E, A, B, C>(
    fx: Fx<R, E, A>,
    b: B,
    f: (b: B, a: A) => Option.Option<readonly [C, B]>
  ): Fx<R, E, C> {
    return new FilterMapLoop(fx, b, f)
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

class LoopEffect<R, E, A, R2, E2, B, C> extends ToFx<R | R2, E | E2, C> {
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

class FilterMapLoopEffect<R, E, A, R2, E2, B, C> extends ToFx<R | R2, E | E2, C> {
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

class FxProvide<R, E, A, R2, E2, B> extends ToFx<Exclude<R, B> | R2, E | E2, A> {
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

class Snapshot<R, E, A, R2, E2, B, R3, E3, C> extends ToFx<R | R2 | R3, E | E2 | E3, C> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: FxInput<R2, E2, B>,
    readonly i2: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ) {
    super(i0, i1, i2)
  }

  toFx(): Fx<R | R2 | R3, E | E2 | E3, C> {
    return matchFxInput(this.i1, {
      RefSubject: (fx2) => this.runScoped(this.i0, fx2, this.i2),
      Fx: (fx2) => this.runScoped(this.i0, fx2, this.i2),
      Stream: (stream2) => this.runScoped(this.i0, fromStream(stream2), this.i2),
      Effect: (effect2) => mapEffect(this.i0, (a) => Effect.flatMap(effect2, (b) => this.i2(a, b))),
      Cause: (cause2) =>
        matchCause(this.i0, {
          onFailure: (cause1) => Effect.failCause(Cause.sequential(cause1, cause2)),
          onSuccess: () => Effect.failCause(cause2)
        }),
      Iterable: (iterable) =>
        withEarlyExit(({ sink }) => {
          const iterator = iterable[Symbol.iterator]()

          return run(
            this.i0,
            Sink.WithContext(sink.onFailure, (a) => {
              const result = iterator.next()
              if (result.done) {
                return sink.earlyExit
              } else {
                return Effect.matchCauseEffect(this.i2(a, result.value), sink)
              }
            })
          )
        }),
      Otherwise: (b) => mapEffect(this.i0, (a) => this.i2(a, b))
    })
  }

  private runScoped<R, E, A, R2, E2, B, R3, E3, C>(
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
            adjustTime(0).pipe(Effect.zipRight(run(
              fx,
              Sink.WithContext(
                sink.onFailure,
                (a: A) =>
                  Effect.flatten(Ref.get(ref)).pipe(
                    Effect.flatMap((b: B) => Effect.matchCauseEffect(f(a, b), sink)),
                    Effect.optionFromOptional,
                    Effect.asUnit
                  )
              )
            )))
        ))
    )
  }
}

class Middleware<R, E, A, R2, R3> extends ToFx<R2 | R3, E, A> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R2, never, unknown>,
    readonly i2: (sink: Sink.Sink<E, A>) => Sink.Sink<E, A>
  ) {
    super(i0, i1)
  }

  static make<R, R2, E, A>(
    fx: Fx<R, E, A>,
    middleware: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R2, never, unknown>,
    mapSink: (sink: Sink.Sink<E, A>) => Sink.Sink<E, A>
  ): Fx<R2, E, A> {
    if (fx instanceof Middleware) {
      return new Middleware(fx.i0 as Fx<R, E, any>, (effect) => middleware(fx.i1(effect)), (s) => fx.i2(mapSink(s)))
    } else {
      return new Middleware(fx, middleware, mapSink)
    }
  }

  protected toFx(): Fx<R2, E, A> {
    return fromSink((sink) => this.i1(run(this.i0, this.i2(sink))))
  }
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

export const mapBoth: {
  <E, E2, A, B>(
    options: {
      readonly onFailure: (e: E) => E2
      readonly onSuccess: (a: A) => B
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R, E2, B>

  <R, E, A, E2, B>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (e: E) => E2
      readonly onSuccess: (a: A) => B
    }
  ): Fx<R, E2, B>
} = dual(2, function mapBoth<R, E, A, E2, B>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (e: E) => E2
    readonly onSuccess: (a: A) => B
  }
) {
  return map(mapError(fx, options.onFailure), options.onSuccess)
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

export const compact = <R, E, A>(fx: Fx<R, E, Option.Option<A>>): Fx<R, E, A> => filterMap(fx, identity)

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

export const filterError: {
  <E, E2 extends E>(f: (a: E) => a is E2): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <E>(f: (a: E) => boolean): <R, A>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, E2 extends E, A>(fx: Fx<R, E, A>, f: (a: E) => a is E2): Fx<R, E2, A>
  <R, E, A>(fx: Fx<R, E, A>, f: (a: E) => boolean): Fx<R, E, A>
} = dual(2, function map<R, E, A>(fx: Fx<R, E, A>, f: (a: E) => boolean) {
  return filterMapCause(fx, (cause) =>
    Cause.failureOrCause(cause).pipe(
      Either.match({
        onLeft: (e) => f(e) ? Option.some(Cause.fail(e)) : Option.none(),
        onRight: Option.some
      })
    ))
})

export const filterMapError: {
  <E, E2>(f: (a: E) => Option.Option<E2>): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(fx: Fx<R, E, A>, f: (a: E) => Option.Option<E2>): Fx<R, E2, A>
} = dual(2, function map<R, E, A, E2>(fx: Fx<R, E, A>, f: (a: E) => Option.Option<E2>) {
  return filterMapCause(fx, (cause) =>
    Cause.failureOrCause(cause).pipe(
      Either.match({
        onLeft: (e) => Option.map(f(e), Cause.fail),
        onRight: Option.some
      })
    ))
})

export const filterMapErrorEffect: {
  <E, R2, E2, B>(f: (e: E) => Effect.Effect<R2, E2, Option.Option<B>>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2 | B, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, Option.Option<B>>): Fx<R | R2, E2 | B, A>
} = dual(2, <R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Effect.Effect<R2, E2, Option.Option<B>>
): Fx<R | R2, B | E2, A> => {
  return fromSink((sink) =>
    run(
      fx,
      Sink.WithContext(
        (cause) =>
          Either.match(Cause.failureOrCause(cause), {
            onLeft: (e) =>
              Effect.matchCauseEffect(f(e), {
                onFailure: sink.onFailure,
                onSuccess: Option.match({
                  onNone: () => Effect.unit,
                  onSome: (b) => sink.onFailure(Cause.fail(b))
                })
              }),
            onRight: sink.onFailure
          }),
        sink.onSuccess
      )
    )
  )
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
    f: (a: A) => FxInput<R2, E2, B>,
    strategy: FlattenStrategy
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => FxInput<R2, E2, B>,
    strategy: FlattenStrategy
  ): Fx<R | R2, E | E2, B>
} = dual(
  3,
  function flatMapWithStrategy<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => FxInput<R2, E2, B>,
    strategy: FlattenStrategy
  ): Fx<R | R2, E | E2, B> {
    return new WithFlattenStrategy(
      ({ fork, sink }) => run(fx, Sink.WithContext(sink.onFailure, (a) => fork(run(from(f(a)), sink)))),
      strategy
    )
  }
)

export const switchMap: {
  <A, R2, E2, B>(f: (a: A) => FxInput<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function switchMap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Switch)
  }
)

export const exhaustMap: {
  <A, R2, E2, B>(f: (a: A) => FxInput<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function exhaustmap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Exhaust)
  }
)

export const exhaust = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => exhaustMap(fx, identity)

export const exhaustMapLatest: {
  <A, R2, E2, B>(f: (a: A) => FxInput<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function exhaustMapLatest<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => FxInput<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.ExhaustLatest)
  }
)

export const exhaustLatest = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => exhaustMapLatest(fx, identity)

export const flatMap: {
  <A, R2, E2, B>(f: (a: A) => FxInput<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function flatMap<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Unbounded)
  }
)

export const flatten = <R, E, R2, E2, A>(fx: Fx<R, E, Fx<R2, E2, A>>) => flatMap(fx, identity)

export const flatMapConcurrently: {
  <A, R2, E2, B>(f: (a: A) => FxInput<R2, E2, B>, concurrency: number): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>, concurrency: number): Fx<R | R2, E | E2, B>
} = dual(
  3,
  function flatMapConcurrently<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => FxInput<R2, E2, B>,
    concurrency: number
  ): Fx<R | R2, E | E2, B> {
    return flatMapWithStrategy(fx, f, strategies.Bounded(concurrency))
  }
)

export const concatMap: {
  <A, R2, E2, B>(f: (a: A) => FxInput<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => FxInput<R2, E2, B>): Fx<R | R2, E | E2, B>
} = dual(
  2,
  function concatMap<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => FxInput<R2, E2, B>
  ): Fx<R | R2, E | E2, B> {
    return flatMapConcurrently(fx, f, 1)
  }
)

export const acquireUseRelease: {
  <A, R2, E2, B, R3, E3>(
    use: (a: A) => FxInput<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): <R, E>(acquire: Effect.Effect<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, B>

  <R, E, A, R2, E2, B, R3, E3>(
    acquire: Effect.Effect<R, E, A>,
    use: (a: A) => FxInput<R2, E2, B>,
    release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
  ): Fx<R | R2 | R3, E | E2 | E3, B>
} = dual(3, function acquireUseRelease<R, E, A, R2, E2, B, R3, E3>(
  acquire: Effect.Effect<R, E, A>,
  use: (a: A) => FxInput<R2, E2, B>,
  release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, unknown>
): Fx<R | R2 | R3, E | E2 | E3, B> {
  return fromSink((sink) =>
    Effect.catchAllCause(
      Effect.acquireUseRelease(
        acquire,
        (a) => run(from(use(a)), sink),
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

export function struct<const FX extends Readonly<Record<PropertyKey, Fx<any, any, any>>>>(
  fxs: FX
): Fx<
  Fx.Context<FX[string]>,
  Fx.Error<FX[string]>,
  {
    readonly [K in keyof FX]: Fx.Success<FX[K]>
  }
> {
  return map(combine(Reflect.ownKeys(fxs).map((k) => map(fxs[k], (a) => [k, a] as const))), Object.fromEntries)
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
  if (fxs.length === 0) return empty
  if (fxs.length === 1) return fxs[0]

  return withScopedFork(({ fork, sink }) =>
    Effect.asyncEffect<
      never,
      never,
      readonly [
        number,
        Array<Fiber.Fiber<never, unknown>>
      ],
      Fx.Context<FX[number]>,
      never,
      unknown
    >((resume) =>
      Effect.gen(function*(_) {
        let winningIndex = -1
        const fibers: Array<Fiber.Fiber<never, unknown>> = yield* _(
          Effect.forEach(fxs, (fx, i) =>
            fork(
              run(
                fx,
                Sink.Sink(
                  (cause) => Effect.suspend(() => pickWinner(i) ? sink.onFailure(cause) : Effect.unit),
                  (a) => Effect.suspend(() => pickWinner(i) ? sink.onSuccess(a) : Effect.unit)
                )
              )
            ))
        )

        function pickWinner(i: number) {
          if (winningIndex === -1) {
            winningIndex = i
            resume(Effect.succeed([i, fibers]))
          }

          return winningIndex === i
        }
      })
    ).pipe(
      Effect.flatMap(([winningIndex, fibers]) =>
        Effect.suspend(() => {
          const [winner] = fibers.splice(winningIndex, 1)

          return Effect.flatMap(Fiber.interruptAll(fibers), () => Fiber.join(winner))
        })
      )
    )
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
  <R2, E2, B>(f: () => Fx<R2, E2, B>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, B>): Fx<R | R2, E | E2, A | B>
} = dual(
  2,
  function continueWith<R, E, R2, E2, A>(fx: Fx<R, E, A>, f: () => Fx<R2, E2, A>): Fx<R | R2, E | E2, A> {
    return fromSink((sink) => Effect.flatMap(run(fx, sink), () => run(f(), sink)))
  }
)

export const recoverWith: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => Fx<R2, E2, A>): Fx<R | R2, E2, A | B>
} = dual(
  2,
  function recoverWith<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
  ): Fx<R | R2, E2, A | B> {
    return fromSink((sink) => Effect.catchAllCause(observe(fx, sink.onSuccess), (cause) => run(from(f(cause)), sink)))
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
  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2, E | E2, A>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, B>): Fx<R | R2, E | E2, A>
} = dual(
  2,
  function tap<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Fx<R | R2, E | E2, A> {
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
    f: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R2, never, unknown>,
    g?: (sink: Sink.Sink<E, A>) => Sink.Sink<E, A>
  ): (fx: Fx<R, E, A>) => Fx<R2, E, A>

  <R, E, A, R2>(
    fx: Fx<R, E, A>,
    f: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R2, never, unknown>,
    g?: (sink: Sink.Sink<E, A>) => Sink.Sink<E, A>
  ): Fx<R2, E, A>
} = dual((args) => args.length === 3 || typeof args[0] !== "function", function middleware<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R2, never, unknown>,
  g?: (sink: Sink.Sink<E, A>) => Sink.Sink<E, A>
): Fx<R2, E, A> {
  return Middleware.make(fx, f, g ?? identity)
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
    f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>,
    strategy: FlattenStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>,
    strategy: FlattenStrategy
  ): Fx<R | R2, E2, A | B>
} = dual(3, function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>,
  strategy: FlattenStrategy
): Fx<R | R2, E2, A | B> {
  return new WithFlattenStrategy(
    ({ fork, sink }) => run(fx, Sink.WithContext((cause) => fork(run(from(f(cause)), sink)), sink.onSuccess)),
    strategy
  )
})

export const flatMapErrorWithStrategy: {
  <E, R2, E2, B>(
    f: (error: E) => FxInput<R2, E2, B>,
    strategy: FlattenStrategy
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (error: E) => FxInput<R2, E2, B>,
    strategy: FlattenStrategy
  ): Fx<R | R2, E2, A | B>
} = dual(3, function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => FxInput<R2, E2, B>,
  strategy: FlattenStrategy
): Fx<R | R2, E2, A | B> {
  return new WithFlattenStrategy(
    ({ fork, sink }) =>
      run(
        fx,
        Sink.WithContext((cause) =>
          fork(run(
            from(cause.pipe(
              Cause.failureOrCause,
              Either.match({
                onLeft: f,
                onRight: failCause
              })
            )),
            sink
          )), sink.onSuccess)
      ),
    strategy
  )
})

export const flatMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Unbounded)
})

export const flatMapError: {
  <E, R2, E2, B>(f: (error: E) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function flatMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, strategies.Unbounded)
})

export const flatMapCauseConcurrently: {
  <E, R2, E2, B>(
    f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>,
    concurrency: number
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>,
    concurrency: number
  ): Fx<R | R2, E2, A | B>
} = dual(3, function flatMapCauseConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>,
  concurrency: number
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Bounded(concurrency))
})

export const flatMapErrorConcurrently: {
  <E, R2, E2, B>(
    f: (error: E) => FxInput<R2, E2, B>,
    concurrency: number
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (error: E) => FxInput<R2, E2, B>,
    concurrency: number
  ): Fx<R | R2, E2, A | B>
} = dual(3, function flatMapCauseConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => FxInput<R2, E2, B>,
  concurrency: number
): Fx<R | R2, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, strategies.Bounded(concurrency))
})

export const switchMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function switchMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Switch)
})

export const switchMapError: {
  <E, R2, E2, B>(f: (error: E) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function switchMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, strategies.Switch)
})

export const exhaustMapCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.Exhaust)
})

export const exhaustMapError: {
  <E, R2, E2, B>(f: (error: E) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function switchMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, strategies.Exhaust)
})

export const exhaustMapLatestCause: {
  <E, R2, E2, B>(f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function exhaustMapLatestCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, strategies.ExhaustLatest)
})

export const exhaustMapLatestError: {
  <E, R2, E2, B>(f: (error: E) => FxInput<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (error: E) => FxInput<R2, E2, B>): Fx<R | R2, E2, A | B>
} = dual(2, function switchMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => FxInput<R2, E2, B>
): Fx<R | R2, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, strategies.ExhaustLatest)
})

export const matchCauseWithStrategy: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly strategy: FlattenStrategy
    }
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly strategy: FlattenStrategy
    }
  ): Fx<R | R2, E2 | E3, B | C>
} = dual(2, function flatMapCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    readonly strategy: FlattenStrategy
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new WithFlattenStrategy(
    ({ fork, sink }) =>
      run(
        fx,
        Sink.WithContext((cause) => fork(run(from(options.onFailure(cause)), sink)), (a) =>
          fork(run(from(options.onSuccess(a)), sink)))
      ),
    options.strategy
  )
})

export const matchErrorWithStrategy: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly strategy: FlattenStrategy
    }
  ): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly strategy: FlattenStrategy
    }
  ): Fx<R | R2, E2 | E3, B | C>
} = dual(2, function flatMapCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (error: E) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    readonly strategy: FlattenStrategy
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return new WithFlattenStrategy(
    ({ fork, sink }) =>
      run(
        fx,
        Sink.WithContext((cause) =>
          fork(run(
            from(cause.pipe(
              Cause.failureOrCause,
              Either.match({
                onLeft: options.onFailure,
                onRight: failCause
              })
            )),
            sink
          )), (a) => fork(run(from(options.onSuccess(a)), sink)))
      ),
    options.strategy
  )
})

export const matchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, {
    ...options,
    strategy: strategies.Unbounded
  })
})

export const match: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (error: E) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchErrorWithStrategy(
    fx,
    { ...options, strategy: strategies.Unbounded }
  )
})

export const matchCauseConcurrently: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly concurrency: number
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly concurrency: number
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    readonly concurrency: number
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, {
    onFailure: options.onFailure,
    onSuccess: options.onSuccess,
    strategy: strategies.Bounded(options.concurrency)
  })
})

export const matchErrorConcurrently: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly concurrency: number
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
      readonly concurrency: number
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchErrorConcurrently<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (error: E) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    readonly concurrency: number
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchErrorWithStrategy(
    fx,
    { ...options, strategy: strategies.Bounded(options.concurrency) }
  )
})

export const switchMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, {
    ...options,
    strategy: strategies.Switch
  })
})

export const switchMatch: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (error: E) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchErrorWithStrategy(
    fx,
    { ...options, strategy: strategies.Switch }
  )
})

export const exhaustMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, {
    ...options,
    strategy: strategies.Exhaust
  })
})

export const exhaustMatch: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (error: E) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchErrorWithStrategy(
    fx,
    { ...options, strategy: strategies.Exhaust }
  )
})

export const exhaustLatestMatchCause: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (cause: Cause.Cause<E>) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchCauseWithStrategy(fx, {
    ...options,
    strategy: strategies.ExhaustLatest
  })
})

export const exhaustLatestMatch: {
  <E, R2, E2, B, A, R3, E3, C>(
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): <R>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E2 | E3, B | C>

  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    options: {
      readonly onFailure: (error: E) => FxInput<R2, E2, B>
      readonly onSuccess: (a: A) => FxInput<R3, E3, C>
    }
  ): Fx<R | R2 | R3, E2 | E3, B | C>
} = dual(2, function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  options: {
    readonly onFailure: (error: E) => FxInput<R2, E2, B>
    readonly onSuccess: (a: A) => FxInput<R3, E3, C>
  }
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return matchErrorWithStrategy(
    fx,
    { ...options, strategy: strategies.ExhaustLatest }
  )
})

export const withEarlyExit = <R, E, A>(
  f: (params: WithEarlyExitParams<E, A>) => Effect.Effect<R, never, unknown>
): Fx<R, E, A> => new WithEarlyExit(f)

export const withScopedFork = <R, E, A>(
  f: (params: WithScopedForkParams<E, A>) => Effect.Effect<R, never, unknown>
): Fx<R, E, A> => new WithScopedFork(f)

export const withFlattenStrategy = <R, E, A>(
  f: (params: WithFlattenStrategyParams<E, A>) => Effect.Effect<R, never, unknown>,
  strategy: FlattenStrategy
): Fx<R, E, A> => new WithFlattenStrategy(f, strategy)

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
          adjustTime(0).pipe(Effect.zipRight(run(
            fx,
            Sink.Sink(
              sink.onFailure,
              (a) => taking ? sink.onSuccess(a) : Effect.unit
            )
          )))
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
  return during(fx, map(window, () => never))
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

export const provide: {
  <R2, E2, S>(layer: Layer.Layer<R2, E2, S>): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, S>, E | E2, A>
  <R2>(runtime: Runtime<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R2>(context: Context<R2>): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2, E2, S>(fx: Fx<R, E, A>, layer: Layer.Layer<R2, E2, S>): Fx<Exclude<R, S> | R2, E | E2, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, runtime: Runtime<R2>): Fx<Exclude<R, R2>, E, A>
  <R, E, A, R2>(fx: Fx<R, E, A>, context: Context<R2>): Fx<Exclude<R, R2>, E, A>
} = dual(2, function provideContext<R, E, A, R2, E2, S>(
  fx: Fx<R, E, A>,
  context: Context<S> | Layer.Layer<R2, E2, S> | Runtime<S>
): Fx<R2 | Exclude<R, S>, E, A> {
  if (Layer.isLayer(context)) {
    return FxProvide.make(fx, Provide.ProvideLayer(context)) as any
  } else if (isContext(context)) {
    return FxProvide.make(fx, Provide.ProvideContext(context as Context<S>))
  } else {
    return FxProvide.make(fx, Provide.ProvideRuntime(context as Runtime<S>))
  }
})

export const provideService: {
  <I, S>(tag: Tag<I, S>, service: S): <R, E, A>(fx: Fx<R, E, A>) => Fx<Exclude<R, I>, E, A>
  <R, E, A, I, S>(fx: Fx<R, E, A>, tag: Tag<I, S>, service: S): Fx<Exclude<R, I>, E, A>
} = dual(3, function provideService<R, E, A, I, S>(
  fx: Fx<R, E, A>,
  tag: Tag<I, S>,
  service: S
): Fx<Exclude<R, I>, E, A> {
  return FxProvide.make(fx, Provide.ProvideService(tag, service))
})

export const provideServiceEffect: {
  <I, S, R2, E2>(
    tag: Tag<I, S>,
    service: Effect.Effect<R2, E2, S>
  ): <R, E, A>(fx: Fx<R, E, A>) => Fx<R2 | Exclude<R, I>, E, A>
  <R, E, A, I, S, R2, E2>(
    fx: Fx<R, E, A>,
    tag: Tag<I, S>,
    service: Effect.Effect<R2, E2, S>
  ): Fx<R2 | Exclude<R, I>, E, A>
} = dual(3, function provideService<R, E, A, I, S, R2, E2>(
  fx: Fx<R, E, A>,
  tag: Tag<I, S>,
  service: Effect.Effect<R2, E2, S>
): Fx<Exclude<R, I> | R2, E | E2, A> {
  return FxProvide.make(fx, Provide.ProvideServiceEffect(tag, service))
})

export const skipRepeatsWith: {
  <A>(eq: Equivalence<A>): <R, E>(fx: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(fx: Fx<R, E, A>, eq: Equivalence<A>): Fx<R, E, A>
} = dual(2, function skipRepeatsWith<R, E, A>(
  fx: Fx<R, E, A>,
  eq: Equivalence<A>
): Fx<R, E, A> {
  return FilterMapLoop.make(fx, Option.none<A>(), (previous, a) =>
    Option.match(previous, {
      onNone: () => Option.some([a, Option.some(a)]),
      onSome: (prev) => eq(a, prev) ? Option.none() : Option.some([a, Option.some(a)])
    }))
})

export const skipRepeats: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A> = (fx) => skipRepeatsWith(fx, Equal.equals)

class Reduce<R, E, A, B> extends Effectable.Class<R, E, B> {
  constructor(readonly fx: Fx<R, E, A>, readonly seed: B, readonly f: (acc: B, a: A) => B) {
    super()
  }

  static make<R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B> {
    if (fx instanceof Transformer) {
      return FilterMapReduce.make<R, E, A, B>(fx.i0 as Fx<R, E, any>, seed, compileSyncReducer(fx.i1, f))
    }

    return new Reduce(fx, seed, f)
  }

  private cached: Effect.Effect<R, E, B> | null = null

  commit() {
    return (this.cached ||= Effect.suspend(() => {
      let acc = this.seed

      return Effect.map(observe(this.fx, (a) => Effect.sync(() => acc = this.f(acc, a))), () => acc)
    }))
  }
}

class FilterMapReduce<R, E, A, B> extends Effectable.Class<R, E, B> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: B,
    readonly i2: (b: B, a: A) => Option.Option<B>
  ) {
    super()
  }

  static make<R, E, A, B>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (b: B, a: A) => Option.Option<B>
  ): Effect.Effect<R, E, B> {
    if (fx instanceof FromIterable) {
      if (Array.isArray(fx.i0)) {
        return new OnceEffect(Effect.sync(() => reduceFilterArray(fx.i0 as Array<A>, seed, f)))
      } else {
        return Effect.sync(() => reduceFilterIterable(fx.i0, seed, f))
      }
    }

    return new FilterMapReduce(fx, seed, f)
  }

  private cached: Effect.Effect<R, E, B> | null = null

  commit(): Effect.Effect<R, E, B> {
    return this.cached ||= Effect.suspend(() => {
      let acc = this.i1

      return Effect.map(
        observe(this.i0, (a) =>
          Option.match(this.i2(acc, a), {
            onNone: () => Effect.unit,
            onSome: (b) => Effect.succeed(acc = b)
          })),
        () => acc
      )
    })
  }
}

function reduceFilterIterable<A, B>(
  iterable: Iterable<A>,
  seed: B,
  f: (acc: B, a: A) => Option.Option<B>
): B {
  const iterator = iterable[Symbol.iterator]()
  let acc = seed
  let result = iterator.next()
  let option: Option.Option<B> = Option.none()

  while (!result.done) {
    option = f(acc, result.value)
    if (Option.isSome(option)) {
      acc = option.value
    }
    result = iterator.next()
  }

  return acc
}

function reduceFilterArray<A, B>(
  iterable: Array<A>,
  seed: B,
  f: (acc: B, a: A) => Option.Option<B>
): B {
  const length = iterable.length
  let acc = seed
  let option: Option.Option<B> = Option.none()

  for (let i = 0; i < length; i++) {
    option = f(acc, iterable[i])
    if (Option.isSome(option)) {
      acc = option.value
    }
  }

  return acc
}

export const reduce: {
  <A, B>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B>
} = dual(3, function reduce<R, E, A, B>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => B
): Effect.Effect<R, E, B> {
  return Reduce.make(fx, seed, f)
})

export function toChunk<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, Chunk.Chunk<A>> {
  return reduce(fx, Chunk.empty<A>(), Chunk.append<A, A>)
}

export const snapshot: {
  <R2, E2, B, A, R3, E3, C>(
    sampled: FxInput<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): <R, E>(fx: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    fx: Fx<R, E, A>,
    sampled: FxInput<R2, E2, B>,
    f: (a: A, b: B) => Effect.Effect<R3, E3, C>
  ): Fx<R | R2 | R3, E | E2 | E3, C>
} = dual(3, function snapshot<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  sampled: Fx<R2, E2, B>,
  f: (a: A, b: B) => Effect.Effect<R3, E3, C>
): Fx<R | R2 | R3, E | E2 | E3, C> {
  return new Snapshot(fx, sampled, f)
})

export function fromEmitter<R, E, A>(
  f: (emitter: Emitter.Emitter<E, A>) => Effect.Effect<R | Scope.Scope, never, unknown>
): Fx<Exclude<R, Scope.Scope>, E, A> {
  return withEarlyExit(({ scope, sink }) =>
    Effect.zipRight(Effect.provideService(Effect.flatMap(Emitter.make(sink), f), Scope.Scope, scope), Effect.never)
  )
}

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> {
  return matchEffectPrimitive<Fx<R, E, A>>(effect as InternalEffect, {
    Success: (e) => succeed(e.i0 as A),
    Failure: (e) => failCause(e.i0 as Cause.Cause<E>),
    Left: (e) => fail(e.left as E),
    Right: (e) => succeed(e.right as A),
    None: () => fail(new Cause.NoSuchElementException() as E),
    Some: (e) => succeed(e.value),
    Sync: (e) => sync(e.i0 as () => A),
    Otherwise: () => fromSink((sink) => Effect.matchCauseEffect(effect, sink))
  })
}

export function fromStream<R, E, A>(stream: Stream.Stream<R, E, A>, options?: { priority?: number }): Fx<R, E, A> {
  return fromSink<R, E, A>((sink) =>
    Effect.acquireUseRelease<never, never, Scope.CloseableScope, R, never, unknown, never, unknown>(
      Scope.make(),
      (scope) =>
        Effect.gen(function*(_) {
          const pull = Effect.either(yield* _(Stream.toPull(stream), Effect.provideService(Scope.Scope, scope)))

          while (true) {
            const either = yield* _(pull)

            if (Either.isRight(either)) {
              yield* _(Effect.forEach(either.right, sink.onSuccess))
            } else if (Option.isNone(either.left)) {
              return
            } else {
              yield* _(sink.onFailure(Cause.fail(either.left.value)))
            }

            // Schedule subsequent pulls using the current scheduler.
            yield* _(Effect.yieldNow(options))
          }
        }),
      Scope.close
    )
  )
}

const matchers = {
  RefSubject: identity,
  Fx: identity,
  Stream: fromStream,
  Effect: fromEffect,
  Cause: failCause,
  Iterable: fromIterable,
  Otherwise: succeed
}

export function from<A>(input: Iterable<A>): Fx<never, never, A>
export function from<E>(input: Cause.Cause<E>): Fx<never, E, never>
export function from<R, E, A>(input: FxInput<R, E, A>): Fx<R, E, A>
export function from<A>(input: A): Fx<never, never, A>
export function from<R, E, A>(input: FxInput<R, E, A>): Fx<R, E, A> {
  return matchFxInput(input, matchers as any)
}
