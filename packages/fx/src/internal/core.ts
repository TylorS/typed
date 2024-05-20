import * as Context from "@typed/context"
import { Data, Record } from "effect"
import * as Boolean from "effect/Boolean"
import * as Cause from "effect/Cause"
import * as Clock from "effect/Clock"
import type * as ConfigProvider from "effect/ConfigProvider"
import * as Deferred from "effect/Deferred"
import type * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Equal from "effect/Equal"
import type * as Equivalence from "effect/Equivalence"
import { boolean } from "effect/Equivalence"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import type * as FiberId from "effect/FiberId"
import type * as FiberRef from "effect/FiberRef"
import { constFalse, constTrue } from "effect/Function"
import type * as HashSet from "effect/HashSet"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Predicate from "effect/Predicate"
import type * as Queue from "effect/Queue"
import * as Ref from "effect/Ref"
import type * as Request from "effect/Request"
import type * as Runtime from "effect/Runtime"
import type * as Schedule from "effect/Schedule"
import type * as Scheduler from "effect/Scheduler"
import * as Scope from "effect/Scope"
import * as Tracer from "effect/Tracer"
import * as Unify from "effect/Unify"
import type * as Utils from "effect/Utils"
import type { FlattenStrategy, Fx, FxFork, MergeStrategy } from "../Fx.js"
import * as Sink from "../Sink.js"
import type { Bounds } from "./bounds.js"
import { boundsFrom, isInfiniteBounds, isNilBounds, mergeBounds } from "./bounds.js"
import * as EffectLoopOp from "./effect-loop-operator.js"
import * as EffectOp from "./effect-operator.js"
import * as EffectProducer from "./effect-producer.js"
import {
  adjustTime,
  matchEffectPrimitive,
  tupleSink,
  withBuffers,
  withFlattenStrategy,
  withScopedFork
} from "./helpers.js"
import * as SyncLoopOp from "./loop-operator.js"
import * as Op from "./operator.js"
import { EffectBase, FxBase } from "./protos.js"
import * as Provide from "./provide.js"
import { Bounded, Exhaust, ExhaustLatest, Ordered, Switch, Unbounded, Unordered } from "./strategies.js"
import * as SyncOp from "./sync-operator.js"
import * as SyncProducer from "./sync-producer.js"

const DISCARD = { discard: true } as const
const UNBOUNDED = { concurrency: "unbounded" } as const

// TODO: Optimizations for take/drop and variants
// TODO: Slice optimizations on synchronous producers
// TODO: Error/Cause operator fusion
// TODO: Double-check other optimiation opportunities
// TODO: expose FxBase and FxEffectBase

export function make<A>(
  run: (sink: Sink.Sink<A>) => Effect.Effect<unknown>
): Fx<A>
export function make<A, E>(run: (sink: Sink.Sink<A, E>) => Effect.Effect<unknown>): Fx<A, E>
export function make<A, E, R>(run: (sink: Sink.Sink<A, E>) => Effect.Effect<unknown, never, R>): Fx<A, E, R>
export function make<A, E, R>(run: (sink: Sink.Sink<A, E>) => Effect.Effect<unknown, never, R>): Fx<A, E, R> {
  return new Make(run)
}

class Make<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly _run: Fx<A, E, R>["run"]) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return Effect.contextWithEffect((ctx) => this._run(Sink.provide(sink, ctx)))
  }
}

class Producer<A> extends FxBase<A, never, never> {
  constructor(readonly i0: SyncProducer.SyncProducer<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, never, R2>): Effect.Effect<unknown, never, R2> {
    return SyncProducer.runSink(this.i0, sink)
  }
}
/**
 * @internal
 */
export function isProducer<A, E, R>(fx: Fx<A, E, R>): fx is Producer<A> {
  return fx.constructor === Producer
}

export const succeed = <A>(value: A): Fx<A> => new Producer(SyncProducer.Success(value))

export const fromSync = <A>(f: () => A): Fx<A> => new Producer(SyncProducer.FromSync(f))

export const fromArray = <const A extends ReadonlyArray<any>>(array: A): Fx<A[number]> =>
  new Producer(SyncProducer.FromArray(array))

export const fromIterable = <A>(iterable: Iterable<A>): Fx<A> => new Producer(SyncProducer.FromIterable(iterable))

class ProducerEffect<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: EffectProducer.EffectProducer<A, E, R>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return EffectProducer.runSink(this.i0, sink)
  }
}

/**
 * @internal
 */
export function isProducerEffect<A, E, R>(fx: Fx<A, E, R>): fx is ProducerEffect<A, E, R> {
  return fx.constructor === ProducerEffect
}

export const fromEffect = <A, E, R>(effect: Effect.Effect<A, E, R>): Fx<A, E, R> =>
  matchEffectPrimitive<A, E, R, Fx<A, E, R>>(effect, {
    // Match over Effect primitives and return Fx primitives to allow fusion to take place
    Success: succeed,
    Failure: failCause,
    Sync: fromSync,
    Left: fail,
    Right: succeed,
    Some: succeed,
    None: fail,
    Otherwise: (effect) => new ProducerEffect(EffectProducer.FromEffect(effect))
  })

export const fromScheduled = <R, E, I, R2, O>(
  input: Effect.Effect<I, E, R>,
  schedule: Schedule.Schedule<O, I, R2>
): Fx<O, E, R | R2> => new ProducerEffect(EffectProducer.FromScheduled(input, schedule))

export const schedule = <A, E, R, R2, O>(
  input: Effect.Effect<A, E, R>,
  schedule: Schedule.Schedule<O, unknown, R2>
): Fx<A, E, R | R2> => new ProducerEffect(EffectProducer.Scheduled(input, schedule))

class FailCause<E> extends FxBase<never, E, never> {
  constructor(readonly i0: Cause.Cause<E>) {
    super()
  }

  run<R2>(sink: Sink.Sink<never, E, R2>): Effect.Effect<unknown, never, R2> {
    return sink.onFailure(this.i0)
  }
}

/**
 * @internal
 */
export function isFailCause<A, E, R>(fx: Fx<A, E, R>): fx is FailCause<E> {
  return fx.constructor === FailCause
}

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E> => new FailCause(cause)

export const fail = <E>(error: E): Fx<never, E> => failCause(Cause.fail(error))

export const die = (error: unknown): Fx<never> => failCause(Cause.die(error))

class Transformer<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: Fx<any, E, R>, readonly i1: Op.Operator) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return this.i0.run(Op.compileOperatorSink(this.i1, sink))
  }

  static make<A, E, R, B, E2, R2>(fx: Fx<A, E, R>, operator: Op.Operator): Fx<B, E | E2, R | R2> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else if (isProducer(fx)) {
      return new ProducerSyncTransformer(fx.i0, operator)
    } else if (isTransformer(fx)) {
      return new Transformer(fx.i0, Op.fuseOperators(fx.i1, operator))
    } else if (isProducerSyncTransformer(fx)) {
      return new ProducerSyncTransformer(fx.i0, Op.fuseOperators(fx.i1, operator))
    } else if (isProducerEffect(fx)) {
      return new ProducerEffectTransformer(fx.i0, operator)
    } else if (isProducerEffectTransformer(fx)) {
      return new ProducerEffectTransformer(fx.i0, Op.fuseOperators(fx.i1, operator))
    } else if (isSuspend(fx)) {
      return new SuspendedTransformer(fx.i0, operator)
    } else if (isSuspendedTransformer(fx)) {
      return new SuspendedTransformer(fx.i0, Op.fuseOperators(fx.i1, operator))
    } else if (isFailCause(fx)) {
      return fx
    } else {
      return new Transformer<B, E, R>(fx, operator)
    }
  }
}

/**
 * @internal
 */
export function isTransformer<A, E, R>(fx: Fx<A, E, R>): fx is Transformer<A, E, R> {
  return fx.constructor === Transformer
}

class ProducerSyncTransformer<A, E, R> extends FxBase<A, E, R> implements Fx<A, E, R> {
  constructor(readonly i0: SyncProducer.SyncProducer<any>, readonly i1: Op.Operator) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return SyncProducer.runSink(this.i0, Op.compileOperatorSink(this.i1, sink))
  }
}

/**
 * @internal
 */
export function isProducerSyncTransformer<A, E, R>(fx: Fx<A, E, R>): fx is ProducerSyncTransformer<A, E, R> {
  return fx.constructor === ProducerSyncTransformer
}

export const map = <A, E, R, B>(fx: Fx<A, E, R>, f: (a: A) => B): Fx<B, E, R> => Transformer.make(fx, SyncOp.Map(f))

export const filter = <A, E, R>(fx: Fx<A, E, R>, f: Predicate.Predicate<A>): Fx<A, E, R> =>
  Transformer.make(fx, SyncOp.Filter(f))

export const filterMap = <A, E, R, B>(fx: Fx<A, E, R>, f: (a: A) => Option.Option<B>): Fx<B, E, R> =>
  Transformer.make(fx, SyncOp.FilterMap(f))

export const mapEffect = <A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>
): Fx<B, E | E2, R | R2> => Transformer.make(fx, EffectOp.MapEffect(f))

export const filterMapEffect = <A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
): Fx<B, E | E2, R | R2> => Transformer.make(fx, EffectOp.FilterMapEffect(f))

export const filterEffect = <A, E, R, R2, E2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<boolean, E2, R2>
): Fx<A, E | E2, R | R2> => Transformer.make(fx, EffectOp.FilterEffect(f))

export const tapEffect = <A, E, R, R2, E2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<unknown, E2, R2>
): Fx<A, E | E2, R | R2> => Transformer.make(fx, EffectOp.TapEffect(f))

export const loop = <A, E, R, B, C>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<C, E, R> =>
  Transformer.make(fx, SyncLoopOp.LoopOperator(seed, f))

export const withPrevious = <A, E, R>(fx: Fx<A, E, R>): Fx<readonly [Option.Option<A>, A], E, R> =>
  loop(fx, Option.none<A>(), (acc, a) => [[acc, a], Option.some(a)] as const)

export const filterMapLoop = <A, E, R, B, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (acc: B, a: A) => readonly [Option.Option<C>, B]
): Fx<C, E, R> => Transformer.make(fx, SyncLoopOp.FilterMapLoopOperator(seed, f))

export const loopEffect = <A, E, R, B, E2, R2, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>
): Fx<C, E | E2, R | R2> => Transformer.make(fx, EffectLoopOp.LoopEffectOperator(seed, f))

export const filterMapLoopEffect = <A, E, R, B, E2, R2, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
): Fx<C, E | E2, R | R2> => Transformer.make(fx, EffectLoopOp.FilterMapLoopEffectOperator(seed, f))

export const observe = <A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>
): Effect.Effect<void, E | E2, R | R2> => Observe.make(fx, f)

const constUnit = () => Effect.void

export const drain = <A, E, R>(fx: Fx<A, E, R>): Effect.Effect<void, E, R> => Observe.make(fx, constUnit)

class Observe<A, E, R, B, E2, R2> extends EffectBase<void, E | E2, R | R2> {
  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: (a: A) => Effect.Effect<B, E2, R2>
  ) {
    super()
  }

  toEffect(): Effect.Effect<void, E | E2, R | R2> {
    return Effect.asyncEffect((resume) => {
      const { i0: fx, i1: f } = this
      const onFailure = (cause: Cause.Cause<E | E2>) => Effect.sync(() => resume(Effect.failCause(cause)))

      return Effect.zipRight(
        fx.run(Sink.make(onFailure, (a) => Effect.catchAllCause(f(a), onFailure))),
        Effect.sync(() => resume(Effect.void))
      )
    })
  }

  static make<A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): Effect.Effect<void, E | E2, R | R2> {
    if (isEmpty(fx)) {
      return Effect.void
    } else if (isNever(fx)) {
      return Effect.never
    } else if (isProducer(fx)) {
      return SyncProducer.runEffect(fx.i0, f)
    } else if (isProducerSyncTransformer(fx)) {
      return Op.matchOperator(fx.i1, {
        SyncOperator: (op): Effect.Effect<void, E | E2, R | R2> =>
          SyncOp.matchSyncOperator(op, {
            Map: (op): Effect.Effect<void, E | E2, R | R2> =>
              SyncProducer.effectOnce(() => SyncProducer.runEffect(fx.i0, (a) => f(op.f(a)))),
            Filter: (op) =>
              SyncProducer.effectOnce(() =>
                SyncProducer.runEffect(fx.i0, Unify.unify((a) => op.f(a) ? f(a) : Effect.void))
              ),
            FilterMap: (op) =>
              SyncProducer.effectOnce(() =>
                SyncProducer.runEffect(
                  fx.i0,
                  Unify.unify((a) => Option.match(op.f(a), { onNone: () => Effect.void, onSome: f }))
                )
              )
          }),
        EffectOperator: (op) =>
          EffectOp.matchEffectOperator(op, {
            MapEffect: (op): Effect.Effect<void, E | E2, R | R2> =>
              SyncProducer.runEffect(fx.i0, (a) => Effect.flatMap(op.f(a), f)),
            FilterMapEffect: (op) =>
              SyncProducer.runEffect(fx.i0, (a) =>
                Effect.flatMap(op.f(a), Unify.unify(Option.match({ onNone: () => Effect.void, onSome: f })))),
            FilterEffect: (op) =>
              SyncProducer.runEffect(
                fx.i0,
                Unify.unify((a) =>
                  Effect.flatMap(op.f(a), Unify.unify((b) => b ? f(a) : Effect.void))
                )
              ),
            TapEffect: (op) => SyncProducer.runEffect(fx.i0, (a) => Effect.flatMap(op.f(a), () => f(a)))
          }),
        SyncLoopOperator: (op) =>
          SyncLoopOp.matchSyncLoopOperator(op, {
            Loop: (op) =>
              SyncProducer.effectOnce(() =>
                SyncProducer.runReduceEffect(fx.i0, op.seed, (acc, a) => {
                  const [c, b] = op.f(acc, a)
                  return Effect.as(f(c), b)
                })
              ),
            FilterMapLoop: (op) =>
              SyncProducer.effectOnce(() =>
                SyncProducer.runReduceEffect(fx.i0, op.seed, (acc, a) => {
                  const [c, b] = op.f(acc, a)
                  return Option.match(c, { onNone: () => Effect.succeed(acc), onSome: (c) => Effect.as(f(c), b) })
                })
              )
          }),
        EffectLoopOperator: (op) =>
          EffectLoopOp.matchEffectLoopOperator(op, {
            LoopEffect: (op) =>
              SyncProducer.runReduceEffect(
                fx.i0,
                op.seed,
                (acc, a) => Effect.flatMap(op.f(acc, a), ([c, b]) => Effect.as(f(c), b))
              ),
            FilterMapLoopEffect: (op) =>
              SyncProducer.runReduceEffect(
                fx.i0,
                op.seed,
                (acc, a) =>
                  Effect.flatMap(op.f(acc, a), ([c, b]) =>
                    Option.match(c, {
                      onNone: () => Effect.succeed(b),
                      onSome: (c) => Effect.as(f(c), b)
                    }))
              )
          })
      })
    } else if (isProducerEffect(fx)) {
      return EffectProducer.runEffect(fx.i0, f)
    } else if (isProducerEffectTransformer(fx)) {
      return Op.matchOperator(fx.i1, {
        SyncOperator: (op): Effect.Effect<void, E | E2, R | R2> =>
          SyncOp.matchSyncOperator(op, {
            Map: (op): Effect.Effect<void, E | E2, R | R2> =>
              SyncProducer.effectOnce(() => EffectProducer.runEffect(fx.i0, (a) => f(op.f(a)))),
            Filter: (op) =>
              SyncProducer.effectOnce(() =>
                EffectProducer.runEffect(fx.i0, Unify.unify((a) => op.f(a) ? f(a) : Effect.void))
              ),
            FilterMap: (op) =>
              SyncProducer.effectOnce(() =>
                EffectProducer.runEffect(
                  fx.i0,
                  Unify.unify((a) => Option.match(op.f(a), { onNone: () => Effect.void, onSome: f }))
                )
              )
          }),
        EffectOperator: (op) =>
          EffectOp.matchEffectOperator(op, {
            MapEffect: (op): Effect.Effect<void, E | E2, R | R2> =>
              EffectProducer.runEffect(fx.i0, (a) => Effect.flatMap(op.f(a), f)),
            FilterMapEffect: (op) =>
              EffectProducer.runEffect(fx.i0, (a) =>
                Effect.flatMap(op.f(a), Unify.unify(Option.match({ onNone: () => Effect.void, onSome: f })))),
            FilterEffect: (op) =>
              EffectProducer.runEffect(
                fx.i0,
                Unify.unify((a) =>
                  Effect.flatMap(op.f(a), Unify.unify((b) => b ? f(a) : Effect.void))
                )
              ),
            TapEffect: (op) => EffectProducer.runEffect(fx.i0, (a) => Effect.flatMap(op.f(a), () => f(a)))
          }),
        SyncLoopOperator: (op) =>
          SyncLoopOp.matchSyncLoopOperator(op, {
            Loop: (op) =>
              SyncProducer.effectOnce(() =>
                EffectProducer.runReduceEffect(fx.i0, op.seed, (acc, a) => {
                  const [c, b] = op.f(acc, a)
                  return Effect.as(f(c), b)
                })
              ),
            FilterMapLoop: (op) =>
              SyncProducer.effectOnce(() =>
                EffectProducer.runReduceEffect(fx.i0, op.seed, (acc, a) => {
                  const [c, b] = op.f(acc, a)
                  return Option.match(c, { onNone: () => Effect.succeed(acc), onSome: (c) => Effect.as(f(c), b) })
                })
              )
          }),
        EffectLoopOperator: (op) =>
          EffectLoopOp.matchEffectLoopOperator(op, {
            LoopEffect: (op) =>
              EffectProducer.runReduceEffect(
                fx.i0,
                op.seed,
                (acc, a) => Effect.flatMap(op.f(acc, a), ([c, b]) => Effect.as(f(c), b))
              ),
            FilterMapLoopEffect: (op) =>
              EffectProducer.runReduceEffect(
                fx.i0,
                op.seed,
                (acc, a) =>
                  Effect.flatMap(op.f(acc, a), ([c, b]) =>
                    Option.match(c, {
                      onNone: () => Effect.succeed(b),
                      onSome: (c) => Effect.as(f(c), b)
                    }))
              )
          })
      })
    } else if (isFailCause(fx)) {
      return Effect.failCause(fx.i0)
    } else {
      return new Observe(fx, f)
    }
  }
}

export const reduce = <A, E, R, B>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<B, E, R> =>
  Reduce.make(fx, seed, f)

class Reduce<A, E, R, B> extends EffectBase<B, E, R> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: B, readonly i2: (acc: B, a: A) => B) {
    super()
  }

  toEffect(): Effect.Effect<B, E, R> {
    return Effect.suspend(() => {
      let acc = this.i1

      return Effect.map(
        observe(this.i0, (a) => Effect.sync(() => acc = this.i2(acc, a))),
        () => acc
      )
    })
  }

  static make<A, E, R, B>(fx: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => B) {
    // TODO: optimize Effect trasformers

    if (isEmpty(fx)) return Effect.succeed(seed)
    else if (isProducer(fx)) {
      return SyncProducer.runReduce(fx.i0, seed, f)
    } else if (isProducerSyncTransformer(fx)) {
      return Op.matchOperator(fx.i1, {
        SyncOperator: (op) => SyncProducer.syncOnce(() => SyncOp.runSyncReduce(fx.i0, op, seed, f)),
        EffectOperator: (op) => EffectOp.runSyncReduce(fx.i0, op, seed, f),
        SyncLoopOperator: (op) =>
          SyncLoopOp.matchSyncLoopOperator(op, {
            Loop: (op) =>
              Effect.map(
                SyncProducer.runReduce(fx.i0, [op.seed, seed] as const, ([opAcc, acc], a) => {
                  const [c, b] = op.f(opAcc, a)
                  const newAcc = f(acc, c)
                  return [b, newAcc] as const
                }),
                (x) => x[1]
              ),
            FilterMapLoop: (op) =>
              Effect.map(
                SyncProducer.runReduce(fx.i0, [op.seed, seed] as const, ([opAcc, acc], a) => {
                  const [c, b] = op.f(opAcc, a)
                  const newAcc = Option.match(c, { onNone: () => acc, onSome: (c) => f(acc, c) })

                  return [b, newAcc] as const
                }),
                (x) => x[1]
              )
          }),
        EffectLoopOperator: (op) =>
          EffectLoopOp.matchEffectLoopOperator(op, {
            LoopEffect: (op) =>
              Effect.map(
                SyncProducer.runReduceEffect(fx.i0, [op.seed, seed] as const, ([opAcc, acc], a) => {
                  return Effect.flatMap(op.f(opAcc, a), ([c, b]) => {
                    const newAcc = f(acc, c)
                    return Effect.succeed([b, newAcc] as const)
                  })
                }),
                (x) => x[1]
              ),
            FilterMapLoopEffect: (op) =>
              Effect.map(
                SyncProducer.runReduceEffect(fx.i0, [op.seed, seed] as const, ([opAcc, acc], a) => {
                  return Effect.map(op.f(opAcc, a), ([c, b]) => {
                    const newAcc = Option.match(c, { onNone: () => acc, onSome: () => f(acc, b) })
                    return [b, newAcc] as const
                  })
                }),
                (x) => x[1]
              )
          })
      })
    } else if (isProducerEffect(fx)) {
      return EffectProducer.runReduceEffect(fx.i0, seed, (b, a) => Effect.succeed(f(b, a)))
    } else if (isFailCause(fx)) {
      return Effect.failCause(fx.i0)
    } else {
      return new Reduce(fx, seed, f)
    }
  }
}

export const toReadonlyArray = <A, E, R>(fx: Fx<A, E, R>): Effect.Effect<ReadonlyArray<A>, E, R> =>
  Effect.suspend(() => {
    const init = [] as Array<A>
    return Reduce.make(fx, init, (acc, a) => {
      acc.push(a)
      return acc
    })
  })

export const slice = <A, E, R>(fx: Fx<A, E, R>, drop: number, take: number): Fx<A, E, R> =>
  Slice.make(fx, boundsFrom(drop, take))

export const take = <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R> => slice(fx, 0, n)

export const drop = <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R> => slice(fx, n, Infinity)

class Slice<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Bounds) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return Sink.slice(sink, this.i1, (s) => this.i0.run(s))
  }

  static make<A, E, R>(fx: Fx<A, E, R>, bounds: Bounds): Fx<A, E, R> {
    if (isNilBounds(bounds)) return empty
    if (isInfiniteBounds(bounds)) return fx

    if (isSlice(fx)) {
      return Slice.make(fx.i0, mergeBounds(fx.i1, bounds))
    } else if (isTransformer(fx) && fx.i1._tag === "Map") {
      // Commute map and slice
      return map(Slice.make(fx.i0, bounds), fx.i1.f)
    } else {
      return new Slice(fx, bounds)
    }
  }
}

/**
 * @internal
 */
export function isSlice<A, E, R>(fx: Fx<A, E, R>): fx is Slice<A, E, R> {
  return fx.constructor === Slice
}

export function skipRepeatsWith<A, E, R>(
  fx: Fx<A, E, R>,
  eq: Equivalence.Equivalence<A>
): Fx<A, E, R> {
  return filterMapLoop(fx, Option.none<A>(), (previous, a) => {
    if (Option.isSome(previous) && eq(a, previous.value)) {
      return [Option.none<A>(), Option.some<A>(a)] as const
    } else {
      return [Option.some<A>(a), Option.some<A>(a)] as const
    }
  })
}

const toDeepEquals = (u: unknown): unknown => {
  switch (typeof u) {
    case "object": {
      if (Predicate.isNullable(u)) {
        return u
      } else if (Equal.symbol in u) {
        return u
      } else if (Array.isArray(u)) {
        return Data.tuple(u.map(toDeepEquals))
      } else if (u instanceof Set) {
        return Data.tuple(Array.from(u, toDeepEquals))
      } else if (u instanceof Map) {
        return Data.tuple(Array.from(u, ([k, v]) => Data.tuple([toDeepEquals(k), toDeepEquals(v)])))
      } else if (u instanceof URLSearchParams) {
        return Data.tuple(Array.from(u.keys()).map((key) => Data.tuple([key, toDeepEquals(u.getAll(key))])))
      } else if (Symbol.iterator in u) {
        return Data.tuple(Array.from(u as any, toDeepEquals))
      } else {
        return Data.struct(Record.map(u, toDeepEquals))
      }
    }
    default:
      return u
  }
}

/**
 * @internal
 */
export const deepEquals = (a: unknown, b: unknown) => {
  // Attempt reference equality first for performance
  if (Object.is(a, b)) return true
  return Equal.equals(toDeepEquals(a), toDeepEquals(b))
}

export function skipRepeats<A, E, R>(
  fx: Fx<A, E, R>
): Fx<A, E, R> {
  return skipRepeatsWith(fx, deepEquals)
}

class ProducerEffectTransformer<A, E, R, B, E2, R2> extends FxBase<B, E | E2, R | R2> {
  constructor(readonly i0: EffectProducer.EffectProducer<A, E, R>, readonly i1: Op.Operator) {
    super()
  }

  run<R3>(sink: Sink.Sink<B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return EffectProducer.runSink(this.i0, Op.compileOperatorSink(this.i1, sink))
  }
}

/**
 * @internal
 */
export function isProducerEffectTransformer<A, E, R>(
  fx: Fx<A, E, R>
): fx is ProducerEffectTransformer<A, E, R, A, E, R> {
  return fx.constructor === ProducerEffectTransformer
}

class Empty extends FxBase<never, never, never> {
  run<R2>(): Effect.Effect<unknown, never, R2> {
    return Effect.void
  }
}

/**
 * @internal
 */
export function isEmpty<A, E, R>(fx: Fx<A, E, R>): fx is Empty {
  return fx.constructor === Empty
}

export const empty: Fx<never> = new Empty()

class Never extends FxBase<never, never, never> {
  run<R2>(): Effect.Effect<unknown, never, R2> {
    return Effect.never
  }
}

/**
 * @internal
 */
export function isNever<A, E, R>(fx: Fx<A, E, R>): fx is Never {
  return fx.constructor === Never
}

export const never: Fx<never> = new Never()

export function padWith<A, E, R, B, C>(
  fx: Fx<A, E, R>,
  start: Iterable<B>,
  end: Iterable<C>
): Fx<A | B | C, E, R> {
  return new PadWith(fx, start, end)
}

export function prependAll<A, E, R, B>(
  fx: Fx<A, E, R>,
  start: Iterable<B>
): Fx<A | B, E, R> {
  return new PadWith(fx, start, [])
}

export function appendAll<A, E, R, C>(
  fx: Fx<A, E, R>,
  end: Iterable<C>
): Fx<A | C, E, R> {
  return new PadWith(fx, [], end)
}

export function prepend<A, E, R, B>(fx: Fx<A, E, R>, start: B): Fx<A | B, E, R> {
  return new PadWith(fx, [start], [])
}

export function append<A, E, R, C>(fx: Fx<A, E, R>, end: C): Fx<A | C, E, R> {
  return new PadWith<A, E, R, never, C>(fx, [], [end])
}

export function scan<A, E, R, B>(fx: Fx<A, E, R>, seed: B, f: (b: B, a: A) => B): Fx<B, E, R> {
  return prepend(
    loop(fx, seed, (b, a) => {
      const b2 = f(b, a)
      return [b2, b2] as const
    }),
    seed
  )
}

class PadWith<
  A,
  E,
  R,
  B,
  C
> extends FxBase<A | B | C, E, R> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Iterable<B>, readonly i2: Iterable<C>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A | B | C, E, R2>): Effect.Effect<unknown, never, R | R2> {
    const onSuccess = (a: A | B | C) => sink.onSuccess(a)

    return Effect.forEach(this.i1, onSuccess, DISCARD).pipe(
      Effect.zipRight(this.i0.run(sink)),
      Effect.zipRight(Effect.forEach(this.i2, onSuccess, DISCARD))
    )
  }

  static make<A, E, R, B, C>(
    fx: Fx<A, E, R>,
    start: Iterable<B>,
    end: Iterable<C>
  ): Fx<A | B | C, E, R> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else if (isPadWith(fx)) {
      return new PadWith(fx.i0, concat(start, fx.i1), concat(fx.i2, end))
    } else {
      return new PadWith(fx, start, end)
    }
  }
}

function concat<A, B>(a: Iterable<A>, b: Iterable<B>): Iterable<A | B> {
  return {
    *[Symbol.iterator]() {
      yield* a
      yield* b
    }
  }
}

/**
 * @internal
 */
export function isPadWith<A, E, R>(
  fx: Fx<A, E, R>
): fx is PadWith<A, E, R, A, A> {
  return fx.constructor === PadWith
}

export function flatMapWithStrategy<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Fx<B, E2, R2>,
  strategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy.ExecutionStrategy = ExecutionStrategy.sequential
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return FlatMapWithStrategy.make(fx, f, strategy, executionStrategy)
}

export function switchMap<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMapWithStrategy(fx, f, Switch, executionStrategy)
}

export function switchMapEffect<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return switchMap(fx, (a) => fromEffect(f(a)), executionStrategy)
}

export function exhaustMap<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMapWithStrategy(fx, f, Exhaust, executionStrategy)
}

export function exhaustMapEffect<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return exhaustMap(fx, (a) => fromEffect(f(a)), executionStrategy)
}

export function exhaustMapLatest<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMapWithStrategy(fx, f, ExhaustLatest, executionStrategy)
}

export function exhaustMapLatestEffect<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return exhaustMapLatest(fx, (a) => fromEffect(f(a)), executionStrategy)
}

export function exhaustFilterMapLatestEffect<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return exhaustMapLatest(fx, (a) =>
    fromFxEffect(Effect.map(
      f(a),
      Option.match({
        onNone: () => empty,
        onSome: succeed
      })
    )), executionStrategy)
}

export function flatMapConcurrently<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Fx<B, E2, R2>,
  capacity: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMapWithStrategy(fx, f, Bounded(capacity), executionStrategy)
}

export function concatMap<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMapConcurrently(fx, f, 1, executionStrategy)
}

export function flatMapConcurrentlyEffect<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  capacity: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMapConcurrently(fx, (a) => fromEffect(f(a)), capacity, executionStrategy)
}

export function flatMap<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMapWithStrategy(fx, f, Unbounded, executionStrategy)
}

export function flatMapEffect<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<B, E | E2, R | R2 | Scope.Scope> {
  return flatMap(fx, (a) => fromEffect(f(a)), executionStrategy)
}

class FlatMapWithStrategy<
  A,
  E,
  R,
  R2,
  E2,
  B
> extends FxBase<B, E | E2, R | R2 | Scope.Scope> {
  private withFork: <A, E, R>(
    f: (
      fork: FxFork,
      scope: Scope.Scope
    ) => Effect.Effect<A, E, R>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) => Effect.Effect<void, E, Scope.Scope | R>

  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: (a: A) => Fx<B, E2, R2>,
    readonly i2: FlattenStrategy,
    readonly i3: ExecutionStrategy.ExecutionStrategy
  ) {
    super()

    this.withFork = withFlattenStrategy(i2)
  }

  run<R3>(sink: Sink.Sink<B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3 | Scope.Scope> {
    return this.withFork(
      (fork) =>
        Sink.withEarlyExit(sink, (sink) =>
          this.i0.run(
            Sink.make(
              (cause) => Cause.isInterruptedOnly(cause) ? sink.earlyExit : sink.onFailure(cause),
              (a) => fork(this.i1(a).run(sink))
            )
          )),
      this.i3
    )
  }

  static make<A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    strategy: FlattenStrategy,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) {
    if (isEmpty(fx) || isNever(fx)) return fx
    else if (isProducer(fx)) {
      if (fx.i0._tag === "Success") return f(fx.i0.source)
      if (fx.i0._tag === "FromSync") {
        const producer = fx.i0
        return suspend(() => f(producer.source()))
      }

      const arr = Array.isArray(fx.i0.source) ? fx.i0.source : Array.from(fx.i0.source)
      if (arr.length === 0) return empty
      if (arr.length === 1) return f(arr[0])

      switch (strategy._tag) {
        case "Switch":
          return f(arr[arr.length - 1])
        case "Exhaust":
          return f(arr[0])
        case "ExhaustLatest":
          return arr.length > 1 ? continueWith(f(arr[0]), () => f(arr[arr.length - 1])) : f(arr[0])
        default:
          return new FlatMapWithStrategy(fx, f, strategy, executionStrategy)
      }
    } else if (isProducerEffect(fx) && fx.i0._tag === "FromEffect") {
      return fromFxEffect(Effect.map(fx.i0.source, f))
    } else if (isTransformer(fx) && fx.i1._tag === "Map") {
      const { f: op } = fx.i1
      return new FlatMapWithStrategy(fx.i0, (a) => f(op(a)), strategy, executionStrategy)
    } else {
      return new FlatMapWithStrategy(fx, f, strategy, executionStrategy)
    }
  }
}

export function fromFxEffect<B, E, R, E2, R2>(
  effect: Effect.Effect<Fx<B, E2, R2>, E, R>
): Fx<B, E | E2, R | R2> {
  return new FromFxEffect(effect)
}

class FromFxEffect<
  R,
  E,
  R2,
  E2,
  B
> extends FxBase<B, E | E2, R | R2> {
  constructor(readonly i0: Effect.Effect<Fx<B, E2, R2>, E, R>) {
    super()
  }

  run<R3>(sink: Sink.Sink<B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return Effect.matchCauseEffect(this.i0, {
      onFailure: (cause) => sink.onFailure(cause),
      onSuccess: (fx) => fx.run(sink)
    })
  }
}

export function gen<Y extends Utils.YieldWrap<Effect.Effect<any, any, any>>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
): Fx<
  Fx.Success<FX>,
  YieldWrapError<Y> | Fx.Error<FX>,
  YieldWrapContext<Y> | Fx.Context<FX>
> {
  return fromFxEffect(Effect.gen(f))
}

type YieldWrapError<T> = T extends Utils.YieldWrap<Effect.Effect<infer _, infer E, any>> ? E : never
type YieldWrapContext<T> = T extends Utils.YieldWrap<Effect.Effect<any, any, infer R>> ? R : never

export function genScoped<Y extends Utils.YieldWrap<Effect.Effect<any, any, any>>, FX extends Fx<any, any, any>>(
  f: (_: Effect.Adapter) => Generator<Y, FX, any>
): Fx<
  Fx.Success<FX>,
  YieldWrapError<Y> | Fx.Error<FX>,
  Exclude<YieldWrapContext<Y> | Fx.Context<FX>, Scope.Scope>
> {
  return scoped(fromFxEffect(Effect.gen(f)))
}

export function continueWith<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: () => Fx<B, E2, R2>
): Fx<A | B, E | E2, R | R2> {
  return ContinueWith.make(fx, f)
}

class ContinueWith<
  A,
  E,
  R,
  R2,
  E2,
  B
> extends FxBase<A | B, E | E2, R | R2> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: () => Fx<B, E2, R2>) {
    super()
  }

  run<R3>(sink: Sink.Sink<A | B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return Effect.flatMap(this.i0.run(sink), () => this.i1().run(sink))
  }

  static make<A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: () => Fx<B, E2, R2>
  ): Fx<A | B, E | E2, R | R2> {
    if (isEmpty(fx)) return f()
    else if (isNever(fx)) return fx
    else if (isProducer(fx)) {
      return SyncProducer.matchSyncProducer(fx.i0, {
        Success: (source) => prependAll(f(), [source]),
        FromSync: (source) => suspend(() => prependAll(f(), [source()])),
        FromArray: (source) => prependAll(f(), source),
        FromIterable: (source) => prependAll(f(), source)
      })
    } else {
      return new ContinueWith(fx, f)
    }
  }
}

export function orElseCause<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>
): Fx<A | B, E2, R | R2> {
  return OrElseCause.make(fx, f)
}

class OrElseCause<
  A,
  E,
  R,
  R2,
  E2,
  B
> extends FxBase<A | B, E2, R | R2> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: (cause: Cause.Cause<E>) => Fx<B, E2, R2>) {
    super()
  }

  run<R3>(sink: Sink.Sink<A | B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return Effect.catchAllCause(observe(this.i0, sink.onSuccess), (cause) => this.i1(cause).run(sink))
  }

  static make<A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>
  ): Fx<A | B, E2, R | R2> {
    if (isEmpty(fx)) return fx
    else if (isNever(fx)) return fx
    else {
      return new OrElseCause(fx, f)
    }
  }
}

export function orElse<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (error: E) => Fx<B, E2, R2>
): Fx<A | B, E2, R | R2> {
  return OrElse.make(fx, f)
}

class OrElse<
  A,
  E,
  R,
  R2,
  E2,
  B
> extends FxBase<A | B, E2, R | R2> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: (error: E) => Fx<B, E2, R2>) {
    super()
  }

  run<R3>(sink: Sink.Sink<A | B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return Effect.catchAll(
      Effect.asyncEffect<unknown, E, never, never, never, R | R2 | R3>((resume) =>
        Effect.asVoid(Effect.zipRight(
          this.i0.run(
            Sink.make(
              (cause) =>
                Either.match(Cause.failureOrCause(cause), {
                  onLeft: (e) => Effect.succeed(resume(Effect.fail(e))),
                  onRight: (cause) => sink.onFailure(cause)
                }),
              sink.onSuccess
            )
          ),
          Effect.sync(() => resume(Effect.void))
        ))
      ),
      (error: E) => this.i1(error).run(sink)
    )
  }

  static make<A, E, R, B, E2, R2>(
    fx: Fx<A, E, R>,
    f: (error: E) => Fx<B, E2, R2>
  ): Fx<A | B, E2, R | R2> {
    if (isEmpty(fx)) return fx
    else if (isNever(fx)) return fx
    else {
      return new OrElse(fx, f)
    }
  }
}

export function suspend<A, E, R>(f: () => Fx<A, E, R>): Fx<A, E, R> {
  return new Suspend(f)
}

class Suspend<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: () => Fx<A, E, R>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return this.i0().run(sink)
  }
}

function isSuspend<A, E, R>(fx: Fx<A, E, R>): fx is Suspend<A, E, R> {
  return fx.constructor === Suspend
}

class SuspendedTransformer<A, E, R, B, E2, R2> extends FxBase<B, E2, R | R2> {
  constructor(readonly i0: () => Fx<A, E, R>, readonly i1: Op.Operator) {
    super()
  }

  run<R3>(sink: Sink.Sink<B, E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return this.i0().run(Op.compileOperatorSink(this.i1, sink))
  }
}

function isSuspendedTransformer<A, E, R>(fx: Fx<A, E, R>): fx is SuspendedTransformer<A, E, R, any, any, any> {
  return fx.constructor === SuspendedTransformer
}

export function mergeWithStrategy<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX,
  stategy: MergeStrategy
): Fx<
  Fx.Success<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Context<FX[number]>
> {
  return MergeWithStrategy.make(fx, stategy)
}

export function merge<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  other: Fx<B, E2, R2>
): Fx<A | B, E | E2, R | R2> {
  return mergeWithStrategy([fx, other], Unordered(2))
}

export function mergeAll<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> {
  return mergeWithStrategy(fx, Unordered(Infinity))
}

export function mergeOrdered<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> {
  return mergeOrderedConcurrently(fx, Infinity)
}

export function mergeOrderedConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX,
  concurrency: number
): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> {
  return mergeWithStrategy(fx, Ordered(concurrency))
}

export function mergeSwitch<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Context<FX[number]>> {
  return mergeWithStrategy(fx, Switch)
}

class MergeWithStrategy<
  const FX extends ReadonlyArray<Fx<any, any, any>>
> extends FxBase<
  Fx.Success<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Context<FX[number]>
> {
  constructor(readonly i0: FX, readonly i1: MergeStrategy) {
    super()
  }

  run<R2>(
    sink: Sink.Sink<Fx.Success<FX[number]>, Fx.Error<FX[number]>, R2>
  ): Effect.Effect<unknown, never, Fx.Context<FX[number]> | R2> {
    switch (this.i1._tag) {
      case "Unordered":
        return runUnordered(this.i0, sink, this.i1.concurrency === Infinity ? "unbounded" : this.i1.concurrency)
      case "Ordered":
        return runOrdered(this.i0, sink, this.i1.concurrency === Infinity ? "unbounded" : this.i1.concurrency)
      case "Switch":
        return runSwitch(this.i0, sink)
    }
  }

  static make<const FX extends ReadonlyArray<Fx<any, any, any>>>(
    fx: FX,
    strategy: MergeStrategy
  ): Fx<
    Fx.Success<FX[number]>,
    Fx.Error<FX[number]>,
    Fx.Context<FX[number]>
  > {
    if (fx.length === 0) return empty
    else if (fx.length === 1) return fx[0]
    else return new MergeWithStrategy(fx.filter(Predicate.not(isEmpty)), strategy)
  }
}

function runUnordered<
  const FX extends ReadonlyArray<Fx<any, any, any>>,
  R2
>(
  fx: FX,
  sink: Sink.Sink<any, any, R2>,
  concurrency: number | "unbounded"
): Effect.Effect<unknown, never, R2 | Fx.Context<FX[number]>> {
  return Effect.forEach(fx, (fx) => fx.run(sink), { concurrency, discard: true })
}

function runOrdered<
  const FX extends ReadonlyArray<Fx<any, any, any>>,
  R2
>(
  fx: FX,
  sink: Sink.Sink<any, any, R2>,
  concurrency: number | "unbounded"
): Effect.Effect<unknown, never, R2 | Fx.Context<FX[number]>> {
  return Effect.fiberIdWith(
    (id) => {
      const buffers = withBuffers(fx.length, sink, id)
      return Effect.forEach(
        fx,
        (fx, i) =>
          Effect.flatMap(
            fx.run(
              Sink.make(
                (cause) => Cause.isInterruptedOnly(cause) ? buffers.onEnd(i) : sink.onFailure(cause),
                (a) => buffers.onSuccess(i, a)
              )
            ),
            () => buffers.onEnd(i)
          ),
        {
          concurrency,
          discard: true
        }
      )
    }
  )
}

function runSwitch<
  const FX extends ReadonlyArray<Fx<any, any, any>>,
  R2
>(
  fx: FX,
  sink: Sink.Sink<any, any, R2>
): Effect.Effect<unknown, never, R2 | Fx.Context<FX[number]>> {
  return Effect.forEach(fx, (fx) => fx.run(sink), { concurrency: 1, discard: true })
}

export function takeWhile<A, E, R>(
  fx: Fx<A, E, R>,
  f: Predicate.Predicate<A>
): Fx<A, E, R> {
  return TakeWhile.make(fx, f)
}

export function takeUntil<A, E, R>(
  fx: Fx<A, E, R>,
  f: Predicate.Predicate<A>
): Fx<A, E, R> {
  return TakeWhile.make(fx, Predicate.not(f))
}

class TakeWhile<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Predicate.Predicate<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return Sink.takeWhile(sink, this.i1, (s) => this.i0.run(s))
  }

  static make<A, E, R>(fx: Fx<A, E, R>, predicate: Predicate.Predicate<A>): Fx<A, E, R> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new TakeWhile(fx, predicate)
    }
  }
}

export function dropWhile<A, E, R>(
  fx: Fx<A, E, R>,
  f: Predicate.Predicate<A>
): Fx<A, E, R> {
  return DropUntil.make(fx, f)
}

export function dropUntil<A, E, R>(
  fx: Fx<A, E, R>,
  f: Predicate.Predicate<A>
): Fx<A, E, R> {
  return DropUntil.make(fx, Predicate.not(f))
}

class DropUntil<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Predicate.Predicate<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return this.i0.run(Sink.dropWhile(sink, this.i1))
  }

  static make<A, E, R>(fx: Fx<A, E, R>, predicate: Predicate.Predicate<A>): Fx<A, E, R> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropUntil(fx, predicate)
    }
  }
}

export function dropAfter<A, E, R>(
  fx: Fx<A, E, R>,
  f: Predicate.Predicate<A>
): Fx<A, E, R> {
  return DropAfter.make(fx, f)
}

class DropAfter<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Predicate.Predicate<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return Sink.dropAfter(sink, this.i1, (s) => this.i0.run(s))
  }

  static make<A, E, R>(fx: Fx<A, E, R>, predicate: Predicate.Predicate<A>): Fx<A, E, R> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropAfter(fx, predicate)
    }
  }
}

export function takeWhileEffect<A, E, R, R2, E2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<boolean, E2, R2>
): Fx<A, E | E2, R | R2> {
  return TakeWhileEffect.make(fx, f)
}

export function takeUntilEffect<A, E, R, R2, E2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<boolean, E2, R2>
): Fx<A, E | E2, R | R2> {
  return TakeWhileEffect.make(fx, (a) => Effect.map(f(a), Boolean.not))
}

class TakeWhileEffect<A, E, R, R2, E2> extends FxBase<A, E | E2, R | R2> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: (a: A) => Effect.Effect<boolean, E2, R2>) {
    super()
  }

  run<R3>(sink: Sink.Sink<A, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return Sink.takeWhileEffect(sink, this.i1, (s) => this.i0.run(s))
  }

  static make<A, E, R, R2, E2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Fx<A, E | E2, R | R2> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new TakeWhileEffect(fx, f)
    }
  }
}

export function dropWhileEffect<A, E, R>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<boolean, E, R>
): Fx<A, E, R> {
  return DropWhileEffect.make(fx, f)
}

export function dropUntilEffect<A, E, R>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<boolean, E, R>
): Fx<A, E, R> {
  return DropWhileEffect.make(fx, (a) => Effect.map(f(a), Boolean.not))
}

class DropWhileEffect<A, E, R> extends FxBase<A, E, R> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: (a: A) => Effect.Effect<boolean, E, R>) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2> {
    return this.i0.run(Sink.dropWhileEffect(sink, this.i1))
  }

  static make<A, E, R>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<boolean, E, R>
  ): Fx<A, E, R> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropWhileEffect(fx, f)
    }
  }
}

export function dropAfterEffect<A, E, R, R2, E2>(
  fx: Fx<A, E, R>,
  f: (a: A) => Effect.Effect<boolean, E2, R2>
): Fx<A, E | E2, R | R2> {
  return DropAfterEffect.make(fx, f)
}

class DropAfterEffect<A, E, R, R2, E2> extends FxBase<A, E | E2, R | R2> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: (a: A) => Effect.Effect<boolean, E2, R2>) {
    super()
  }

  run<R3>(sink: Sink.Sink<A, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return this.i0.run(Sink.dropAfterEffect(sink, this.i1))
  }

  static make<A, E, R, R2, E2>(
    fx: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Fx<A, E | E2, R | R2> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropAfterEffect(fx, f)
    }
  }
}

export function during<A, E, R, B, E2, R2, E3, R3>(
  fx: Fx<A, E, R>,
  window: Fx<Fx<B, E3, R3>, E2, R2>
): Fx<A, E | E2 | E3, R | R2 | R3 | Scope.Scope> {
  return During.make(fx, window)
}

export function since<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  window: Fx<B, E2, R2>
): Fx<A, E | E2, R | R2 | Scope.Scope> {
  return During.make(fx, map(window, () => never))
}

export function until<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  window: Fx<B, E2, R2>
): Fx<A, E | E2, R | R2 | Scope.Scope> {
  return During.make(fx, succeed(window))
}

class During<A, E, R, B, E2, R2, E3, R3> extends FxBase<A, E | E2 | E3, R | R2 | R3 | Scope.Scope> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Fx<Fx<B, E3, R3>, E2, R2>) {
    super()
  }

  run<R4>(sink: Sink.Sink<A, E | E2 | E3, R4>): Effect.Effect<unknown, never, R | R2 | R3 | R4 | Scope.Scope> {
    return withScopedFork(
      (fork) =>
        Sink.withEarlyExit(sink, (s) => {
          let taking = false

          const onFailure = (cause: Cause.Cause<E | E2 | E3>) => s.onFailure(cause)

          return Effect.flatMap(
            fork(
              take(this.i1, 1).run(
                Sink.make(onFailure, (nested) => {
                  taking = true
                  return take(nested, 1).run(Sink.make(onFailure, () => s.earlyExit))
                })
              )
            ),
            () =>
              Effect.zipRight(
                // Allow fibers to start
                adjustTime(1),
                this.i0.run(
                  Sink.make(
                    onFailure,
                    (a) => taking ? s.onSuccess(a) : Effect.void
                  )
                )
              )
          )
        }),
      ExecutionStrategy.sequential
    )
  }

  static make<A, E, R, B, E2, R2, E3, R3>(
    fx: Fx<A, E, R>,
    window: Fx<Fx<B, E3, R3>, E2, R2>
  ): Fx<A, E | E2 | E3, R | R2 | R3 | Scope.Scope> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new During(fx, window)
    }
  }
}

export function middleware<A, E, R, R3>(
  fx: Fx<A, E, R>,
  effect: (effect: Effect.Effect<unknown, never, R>) => Effect.Effect<unknown, never, R3>,
  sink?: (sink: Sink.Sink<A, E>) => Sink.Sink<A, E, R>
): Fx<A, E, R3> {
  return new Middleware(fx, effect, sink)
}

export function onExit<A, E, R, R2>(
  fx: Fx<A, E, R>,
  f: (exit: Exit.Exit<unknown>) => Effect.Effect<unknown, never, R2>
): Fx<A, E, R | R2> {
  return middleware(fx, Effect.onExit(f))
}

export function onInterrupt<A, E, R, R2>(
  fx: Fx<A, E, R>,
  f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<unknown, never, R2>
): Fx<A, E, R | R2> {
  return middleware(fx, Effect.onInterrupt(f))
}

export function onError<A, E, R, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<never>) => Effect.Effect<unknown, never, R2>
): Fx<A, E, R | R2> {
  return middleware(fx, Effect.onError(f))
}

export const scoped = <A, E, R>(fx: Fx<A, E, R>): Fx<A, E, Exclude<R, Scope.Scope>> => middleware(fx, Effect.scoped)

export function annotateLogs<A, E, R>(
  fx: Fx<A, E, R>,
  key: string | Record<string, unknown>,
  value?: unknown
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.annotateLogs(effect, key as string, value as unknown))
}

export function annotateSpans<A, E, R>(
  fx: Fx<A, E, R>,
  key: string | Record<string, unknown>,
  value?: unknown
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.annotateSpans(effect, key as string, value as unknown))
}

export const interruptible = <A, E, R>(fx: Fx<A, E, R>): Fx<A, E, R> => middleware(fx, Effect.interruptible)

export const uninterruptible = <A, E, R>(fx: Fx<A, E, R>): Fx<A, E, R> => middleware(fx, Effect.uninterruptible)

export function locally<B, E, R, A>(
  use: Fx<B, E, R>,
  self: FiberRef.FiberRef<A>,
  value: A
): Fx<B, E, R> {
  return middleware(use, (effect) => Effect.locally(effect, self, value))
}

export function locallyWith<B, E, R, A>(
  use: Fx<B, E, R>,
  self: FiberRef.FiberRef<A>,
  f: (a: A) => A
): Fx<B, E, R> {
  return middleware(use, (effect) => Effect.locallyWith(effect, self, f))
}

export function withTracerTiming<A, E, R>(
  fx: Fx<A, E, R>,
  enabled: boolean
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withTracerTiming(effect, enabled))
}

export function withConcurrency<A, E, R>(
  fx: Fx<A, E, R>,
  concurrency: number | "unbounded"
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withConcurrency(effect, concurrency))
}

export function withConfigProvider<A, E, R>(
  fx: Fx<A, E, R>,
  configProvider: ConfigProvider.ConfigProvider
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withConfigProvider(effect, configProvider))
}

export function withLogSpan<A, E, R>(
  fx: Fx<A, E, R>,
  span: string
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withLogSpan(effect, span))
}

export function withMaxOpsBeforeYield<A, E, R>(
  fx: Fx<A, E, R>,
  maxOps: number
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withMaxOpsBeforeYield(effect, maxOps))
}

export function withParentSpan<A, E, R>(
  fx: Fx<A, E, R>,
  parentSpan: Tracer.AnySpan
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withParentSpan(effect, parentSpan))
}

export function withRequestBatching<A, E, R>(
  fx: Fx<A, E, R>,
  requestBatching: boolean
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withRequestBatching(effect, requestBatching))
}

export function withRequestCache<A, E, R>(
  fx: Fx<A, E, R>,
  cache: Request.Cache
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withRequestCache(effect, cache))
}

export function withRequestCaching<A, E, R>(
  fx: Fx<A, E, R>,
  requestCaching: boolean
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withRequestCaching(effect, requestCaching))
}

export function withScheduler<A, E, R>(
  fx: Fx<A, E, R>,
  scheduler: Scheduler.Scheduler
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withScheduler(effect, scheduler))
}

export function withTracer<A, E, R>(
  fx: Fx<A, E, R>,
  tracer: Tracer.Tracer
): Fx<A, E, R> {
  return middleware(fx, (effect) => Effect.withTracer(effect, tracer))
}

class Middleware<A, E, R, R2> extends FxBase<A, E, R2> {
  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: (effect: Effect.Effect<unknown, never, R>) => Effect.Effect<unknown, never, R2>,
    readonly i2?: (sink: Sink.Sink<A, E>) => Sink.Sink<A, E, R>
  ) {
    super()
  }

  run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<unknown, never, R2 | R3> {
    return Effect.contextWithEffect((ctx) => {
      const s = Sink.provide(sink, ctx)

      return this.i1(this.i0.run(this.i2 ? this.i2(s) : s))
    })
  }
}

export function acquireUseRelease<A, E, R, B, E2, R2, C, E3, R3>(
  acquire: Effect.Effect<A, E, R>,
  use: (a: A) => Fx<B, E2, R2>,
  release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<C, E3, R3>
): Fx<B, E | E2 | E3, R | R2 | R3> {
  return new AcquireUseRelease(acquire, use, release)
}

class AcquireUseRelease<A, E, R, B, E2, R2, C, E3, R3> extends FxBase<B, E | E2 | E3, R | R2 | R3> {
  constructor(
    readonly acquire: Effect.Effect<A, E, R>,
    readonly use: (a: A) => Fx<B, E2, R2>,
    readonly release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<C, E3, R3>
  ) {
    super()
  }

  run<R4>(sink: Sink.Sink<B, E | E2 | E3, R4>): Effect.Effect<unknown, never, R | R2 | R3 | R4> {
    return Effect.catchAllCause(
      Effect.acquireUseRelease(
        this.acquire,
        (a) => this.use(a).run(sink),
        (a, exit) => Effect.catchAllCause(this.release(a, exit), (cause) => sink.onFailure(cause))
      ),
      (cause) => sink.onFailure(cause)
    )
  }
}

export function withSpan<A, E, R>(
  self: Fx<A, E, R>,
  name: string,
  options: {
    readonly attributes?: Record<string, unknown>
    readonly links?: ReadonlyArray<Tracer.SpanLink>
    readonly parent?: Tracer.ParentSpan
    readonly root?: boolean
    readonly context?: Context.Context<never>
  } = {}
): Fx<A, E, R> {
  return acquireUseRelease(
    Effect.flatMap(
      Effect.optionFromOptional(Effect.currentSpan),
      (parent) => Effect.makeSpan(name, { ...options, parent: options?.parent || Option.getOrUndefined(parent) } as any)
    ),
    (span) =>
      middleware(
        self,
        (effect) => Effect.provideService(effect, Tracer.ParentSpan, span),
        (s) => Sink.setSpan(s, span)
      ),
    (span, exit) => Effect.flatMap(Clock.currentTimeNanos, (time) => Effect.sync(() => span.end(time, exit)))
  )
}

export function provideContext<A, E, R, R2>(
  fx: Fx<A, E, R>,
  context: Context.Context<R2>
): Fx<A, E, Exclude<R, R2>> {
  return ProvideFx.make(fx, Provide.ProvideContext(context))
}

export function provideLayer<A, E, R, S, E2, R2>(
  fx: Fx<A, E, R>,
  layer: Layer.Layer<S, E2, R2>
): Fx<A, E | E2, R2 | Exclude<R, S>> {
  return ProvideFx.make(fx, Provide.ProvideLayer(layer))
}

export function provideRuntime<A, E, R, R2>(
  fx: Fx<A, E, R>,
  runtime: Runtime.Runtime<R2>
): Fx<A, E, Exclude<R, R2>> {
  return ProvideFx.make(fx, Provide.ProvideRuntime(runtime))
}

export function provideService<A, E, R, I, S>(
  fx: Fx<A, E, R>,
  service: Context.Tag<I, S>,
  instance: S
): Fx<A, E, Exclude<R, I>> {
  return ProvideFx.make(fx, Provide.ProvideService(service, instance))
}

export function provideServiceEffect<A, E, R, I, S, R2, E2>(
  fx: Fx<A, E, R>,
  service: Context.Tag<I, S>,
  instance: Effect.Effect<S, E2, R2>
): Fx<A, E | E2, Exclude<R, I> | R2> {
  return ProvideFx.make(fx, Provide.ProvideServiceEffect(service, instance))
}

export function provide<A, E, R, R2 = never, E2 = never, S = never>(
  fx: Fx<A, E, R>,
  provide: Layer.Layer<S, E2, R2> | Context.Context<S> | Runtime.Runtime<S>
): Fx<A, E | E2, Exclude<R, S> | R2> {
  if (Layer.isLayer(provide)) return provideLayer(fx, provide as Layer.Layer<S, E2, R2>)
  else if (Context.isContext(provide)) return provideContext(fx, provide as Context.Context<S>)
  else return provideRuntime(fx, provide as Runtime.Runtime<S>)
}

class ProvideFx<A, E, R, S, E2, R2> extends FxBase<A, E | E2, R2 | Exclude<R, S>> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Provide.Provide<S, E2, R2>) {
    super()
  }

  run<R3>(sink: Sink.Sink<A, E | E2, R3>): Effect.Effect<unknown, never, R2 | R3 | Exclude<R, S>> {
    return Effect.acquireUseRelease(
      Scope.make(),
      (scope) =>
        Effect.matchEffect(Provide.buildWithScope(this.i1, scope), {
          onFailure: (error) => sink.onFailure(Cause.fail(error)),
          onSuccess: (ctx) => Effect.provide(this.i0.run(sink), ctx)
        }),
      (scope, exit) => Scope.close(scope, exit)
    )
  }

  static make<A, E, R, S, E2, R2>(
    fx: Fx<A, E, R>,
    provide: Provide.Provide<S, E2, R2>
  ): Fx<A, E | E2, Exclude<R, S> | R2> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else if (isProvideFx(fx)) {
      return new ProvideFx(fx.i0, Provide.merge(fx.i1, provide))
    } else {
      return new ProvideFx(fx, provide)
    }
  }
}

function isProvideFx<A, E, R>(u: Fx<A, E, R>): u is ProvideFx<A, E, R, R, E, never> {
  return u.constructor === ProvideFx
}

export function mapCause<A, E, R, E2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Cause.Cause<E2>
): Fx<A, E2, R> {
  return new TransformerCause(fx, SyncOp.Map(f))
}

export function mapError<A, E, R, E2>(
  fx: Fx<A, E, R>,
  f: (e: E) => E2
): Fx<A, E2, R> {
  return mapCause(fx, Cause.map(f))
}

export function filterCause<A, E, R>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => boolean
): Fx<A, E, R> {
  return new TransformerCause(fx, SyncOp.Filter(f))
}

export function filterError<A, E, R>(
  fx: Fx<A, E, R>,
  f: (e: E) => boolean
): Fx<A, E, R> {
  return filterCause(fx, (cause) =>
    Option.match(Cause.failureOption(cause), {
      onNone: constTrue,
      onSome: f
    }))
}

export function filterMapCause<A, E, R, E2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>
): Fx<A, E2, R> {
  return new TransformerCause(fx, SyncOp.FilterMap(f))
}

export function filterMapError<A, E, R, E2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Option.Option<E2>
): Fx<A, E2, R> {
  return filterMapCause(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Option.map(f(e), Cause.fail),
      onRight: Option.some
    }))
}

export function mapCauseEffect<A, E, R, R2, E2, E3>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<Cause.Cause<E3>, E2, R2>
): Fx<A, E2 | E3, R | R2> {
  return new TransformerCause(fx, EffectOp.MapEffect(f))
}

export function mapErrorEffect<A, E, R, R2, E2, E3>(
  fx: Fx<A, E, R>,
  f: (e: E) => Effect.Effect<E3, E2, R2>
): Fx<A, E2 | E3, R | R2> {
  return mapCauseEffect(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(e), Cause.fail),
      onRight: (cause) => Effect.succeed(cause)
    }))
}

export function filterCauseEffect<A, E, R, R2, E2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<boolean, E2, R2>
): Fx<A, E2, R | R2> {
  return new TransformerCause(fx, EffectOp.FilterEffect(f))
}

export function filterErrorEffect<A, E, R, R2, E2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Effect.Effect<boolean, E2, R2>
): Fx<A, E2, R | R2> {
  return filterCauseEffect(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: f,
      onRight: () => Effect.succeed(true)
    }))
}

export function filterMapCauseEffect<A, E, R, R2, E2, E3>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<Option.Option<Cause.Cause<E3>>, E2, R2>
): Fx<A, E2 | E3, R | R2> {
  return new TransformerCause(fx, EffectOp.FilterMapEffect(f))
}

export function filterMapErrorEffect<A, E, R, R2, E2, E3>(
  fx: Fx<A, E, R>,
  f: (e: E) => Effect.Effect<Option.Option<E3>, E2, R2>
): Fx<A, E2 | E3, R | R2> {
  return filterMapCauseEffect(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(e), Option.map(Cause.fail)),
      onRight: (cause) => Effect.succeed(Option.some(cause))
    }))
}

export function loopCause<A, E, R, B, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
): Fx<A, C, R> {
  return new TransformerCause(fx, SyncLoopOp.LoopOperator(seed, f))
}

export function loopError<A, E, R, B, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, e: E) => readonly [C, B]
): Fx<A, C, R> {
  return loopCause(fx, seed, (b, cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => {
        const [c, b2] = f(b, e)
        return [Cause.fail(c), b2]
      },
      onRight: (cause) => [cause, b]
    }))
}

export function loopCauseEffect<A, E, R, B, E2, R2, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E2, R2>
): Fx<A, E2 | C, R | R2> {
  return new TransformerCause(fx, EffectLoopOp.LoopEffectOperator(seed, f))
}

export function loopErrorEffect<A, E, R, B, E2, R2, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, e: E) => Effect.Effect<readonly [C, B], E2, R2>
) {
  return loopCauseEffect(fx, seed, (b, cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(b, e), ([c, b2]) => [Cause.fail(c), b2]),
      onRight: (cause) => Effect.succeed([cause, b])
    }))
}

export function filterMapLoopCause<A, E, R, B, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
): Fx<A, C, R> {
  return new TransformerCause(fx, SyncLoopOp.FilterMapLoopOperator(seed, f))
}

export function filterMapLoopError<A, E, R, B, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, e: E) => readonly [Option.Option<C>, B]
) {
  return filterMapLoopCause(fx, seed, (b, cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => {
        const [c, b2] = f(b, e)
        return [Option.map(Cause.fail)(c), b2]
      },
      onRight: (cause) => [Option.some(cause), b]
    }))
}

export function filterMapLoopCauseEffect<A, E, R, B, E2, R2, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>
): Fx<A, E2 | C, R | R2> {
  return new TransformerCause(fx, EffectLoopOp.FilterMapLoopEffectOperator(seed, f))
}

export function filterMapLoopErrorEffect<A, E, R, B, E2, R2, C>(
  fx: Fx<A, E, R>,
  seed: B,
  f: (b: B, e: E) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>
) {
  return filterMapLoopCauseEffect(fx, seed, (b, cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(b, e), ([c, b2]) => [Option.map(c, Cause.fail), b2]),
      onRight: (cause) => Effect.succeed([Option.some(cause), b])
    }))
}

class TransformerCause<A, E, R, R2, E2> extends FxBase<A, E2, R | R2> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Op.Operator) {
    super()
  }

  run<R2>(sink: Sink.Sink<A, E2, R2>): Effect.Effect<unknown, never, R | R2> {
    return this.i0.run(Op.compileOperatorSinkCause(this.i1, sink))
  }
}

export function flatMapCauseWithStrategy<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
  flattenStrategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy.ExecutionStrategy = ExecutionStrategy.sequential
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return new FlatMapCauseWithStrategy(fx, f, flattenStrategy, executionStrategy)
}

export function flatMapErrorWithStrategy<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Fx<B, E2, R2>,
  flattenStrategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy.ExecutionStrategy = ExecutionStrategy.sequential
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapCauseWithStrategy(
    fx,
    (cause) =>
      Either.match(Cause.failureOrCause(cause), {
        onLeft: f,
        onRight: (cause) => failCause(cause)
      }),
    flattenStrategy,
    executionStrategy
  )
}

export function switchMapCause<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapCauseWithStrategy(fx, f, Switch, executionStrategy)
}

export function switchMapError<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapErrorWithStrategy(fx, f, Switch, executionStrategy)
}

export function flatMapCause<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapCauseWithStrategy(fx, f, Unbounded, executionStrategy)
}

export function flatMapError<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapErrorWithStrategy(fx, f, Unbounded, executionStrategy)
}

export function flatMapCauseConcurrently<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
  concurrency: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapCauseWithStrategy(fx, f, Bounded(concurrency), executionStrategy)
}

export function flatMapErrorConcurrently<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Fx<B, E2, R2>,
  concurrency: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapErrorWithStrategy(fx, f, Bounded(concurrency), executionStrategy)
}

export function exhaustMapCause<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapCauseWithStrategy(fx, f, Exhaust, executionStrategy)
}

export function exhaustMapError<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapErrorWithStrategy(fx, f, Exhaust, executionStrategy)
}

export function exhaustMapLatestCause<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapCauseWithStrategy(fx, f, ExhaustLatest, executionStrategy)
}

export function exhaustMapLatestError<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  f: (e: E) => Fx<B, E2, R2>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<A | B, E2, R | R2 | Scope.Scope> {
  return flatMapErrorWithStrategy(fx, f, ExhaustLatest, executionStrategy)
}

class FlatMapCauseWithStrategy<
  A,
  E,
  R,
  R2,
  E2,
  B
> extends FxBase<A | B, E2, R | R2 | Scope.Scope> {
  private withFork: <A, E, R>(
    f: (
      fork: FxFork,
      scope: Scope.Scope
    ) => Effect.Effect<A, E, R>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) => Effect.Effect<void, E, Scope.Scope | R>

  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    readonly i2: FlattenStrategy,
    readonly i3: ExecutionStrategy.ExecutionStrategy
  ) {
    super()

    this.withFork = withFlattenStrategy(this.i2)
  }

  run<R3>(sink: Sink.Sink<A | B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3 | Scope.Scope> {
    return this.withFork(
      (fork) => this.i0.run(Sink.make((cause) => fork(this.i1(cause).run(sink)), (a) => sink.onSuccess(a))),
      this.i3
    )
  }
}

class MatchWithStrategy<
  A,
  E,
  R,
  R2,
  E2,
  B,
  R3,
  E3,
  C
> extends FxBase<B | C, E2 | E3, R | R2 | R3 | Scope.Scope> {
  private withFork: <A, E, R>(
    f: (
      fork: FxFork,
      scope: Scope.Scope
    ) => Effect.Effect<A, E, R>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) => Effect.Effect<void, E, Scope.Scope | R>

  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<B, E2, R2>,
    readonly i2: (a: A) => Fx<C, E3, R3>,
    readonly i3: FlattenStrategy,
    readonly i4: ExecutionStrategy.ExecutionStrategy
  ) {
    super()

    this.withFork = withFlattenStrategy(this.i3)
  }

  run<R4>(sink: Sink.Sink<B | C, E2 | E3, R4>): Effect.Effect<unknown, never, R | R2 | R3 | R4 | Scope.Scope> {
    return this.withFork(
      (fork) =>
        this.i0.run(Sink.make(
          (cause) => fork(this.i1(cause).run(sink)),
          (a) => fork(this.i2(a).run(sink))
        )),
      this.i4
    )
  }
}

export type MatchCauseOptions<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Fx<B, E2, R2>
  readonly onSuccess: (a: A) => Fx<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

export function matchCauseWithStrategy<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  flattenStrategy: FlattenStrategy,
  opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope> {
  return new MatchWithStrategy(
    fx,
    opts.onFailure,
    opts.onSuccess,
    flattenStrategy,
    opts.executionStrategy || ExecutionStrategy.sequential
  )
}

export type MatchErrorOptions<E, A, B, E2, R2, C, E3, R3> = {
  readonly onFailure: (e: E) => Fx<B, E2, R2>
  readonly onSuccess: (a: A) => Fx<C, E3, R3>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

export function matchErrorWithStrategy<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  flattenStrategy: FlattenStrategy,
  { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
): Fx<B | C, E2 | E3, R | R2 | R3 | Scope.Scope> {
  return new MatchWithStrategy(
    fx,
    (cause) =>
      Either.match(Cause.failureOrCause(cause), {
        onLeft: onFailure,
        onRight: (cause) => failCause(cause)
      }),
    onSuccess,
    flattenStrategy,
    executionStrategy || ExecutionStrategy.sequential
  )
}

export function matchCause<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchCauseWithStrategy(fx, Unbounded, opts)
}

export function matchError<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchErrorWithStrategy(fx, Unbounded, opts)
}

export function matchCauseConcurrently<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  concurrency: number,
  opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchCauseWithStrategy(fx, Bounded(concurrency), opts)
}

export function matchErrorConcurrently<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  concurrency: number,
  opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchErrorWithStrategy(fx, Bounded(concurrency), opts)
}

export function switchMatchCause<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchCauseWithStrategy(fx, Switch, opts)
}

export function switchMatchError<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchErrorWithStrategy(fx, Switch, opts)
}

export function exhaustMatchCause<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchCauseWithStrategy(fx, Exhaust, opts)
}

export function exhaustMatchError<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchErrorWithStrategy(fx, Exhaust, opts)
}

export function exhaustMatchLatestCause<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchCauseOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchCauseWithStrategy(fx, ExhaustLatest, opts)
}

export function exhaustMatchLatestError<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  opts: MatchErrorOptions<E, A, B, E2, R2, C, E3, R3>
) {
  return matchErrorWithStrategy(fx, ExhaustLatest, opts)
}

export function tuple<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<
  {
    readonly [K in keyof FX]: Fx.Success<FX[K]>
  },
  Fx.Error<FX[number]>,
  Fx.Context<FX[number]>
> {
  return new Tuple(fx)
}

class Tuple<const FX extends ReadonlyArray<Fx<any, any, any>>> extends FxBase<
  {
    readonly [K in keyof FX]: Fx.Success<FX[K]>
  },
  Fx.Error<FX[number]>,
  Fx.Context<FX[number]>
> {
  constructor(readonly i0: FX) {
    super()
  }

  run<R2>(
    sink: Sink.Sink<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[number]>, R2>
  ): Effect.Effect<unknown, never, Fx.Context<FX[number]> | R2> {
    return tupleSink(
      sink,
      (onSuccess) =>
        Effect.forEach(
          this.i0,
          (fx, i) =>
            fx.run(
              Sink.make(
                sink.onFailure,
                (a) => onSuccess(i, a)
              )
            ),
          UNBOUNDED
        ),
      this.i0.length
    )
  }
}

export function struct<const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fx: FX
): Fx<
  {
    readonly [K in keyof FX]: Fx.Success<FX[K]>
  },
  Fx.Error<FX[string]>,
  Fx.Context<FX[string]>
> {
  const entries: ReadonlyArray<readonly [keyof FX, FX[keyof FX]]> = Object.entries(fx) as any

  return map(tuple(entries.map(([key, fx]) => map(fx, (a) => [key, a] as const))), Object.fromEntries)
}

export function all<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[number]>, Fx.Context<FX[number]>>

export function all<const FX extends Readonly<Record<string, Fx<any, any, any>>>>(
  fx: FX
): Fx<{ readonly [K in keyof FX]: Fx.Success<FX[K]> }, Fx.Error<FX[string]>, Fx.Context<FX[string]>>

export function all<const FX extends ReadonlyArray<Fx<any, any, any> | Readonly<Record<string, Fx<any, any, any>>>>>(
  fx: FX
): Fx<any, Fx.Error<FX[keyof FX]>, Fx.Context<FX[keyof FX]>> {
  if (Array.isArray(fx)) return tuple(fx)
  else return struct(fx as any) as any
}

export function exit<A, E, R>(
  fx: Fx<A, E, R>
): Fx<Exit.Exit<A, E>, never, R> {
  return new ExitFx(fx)
}

class ExitFx<A, E, R> extends FxBase<Exit.Exit<A, E>, never, R> {
  constructor(readonly i0: Fx<A, E, R>) {
    super()
  }

  run<R2>(sink: Sink.Sink<Exit.Exit<A, E>, never, R2>): Effect.Effect<unknown, never, R | R2> {
    return this.i0.run(
      Sink.make((cause) => sink.onSuccess(Exit.failCause(cause)), (a) => sink.onSuccess(Exit.succeed(a)))
    )
  }
}

export function toEnqueue<A, E, R, R2 = never>(
  fx: Fx<A, E, R>,
  queue: Context.Enqueue<R2, A> | Queue.Enqueue<A>
) {
  return observe(fx, (a) => queue.offer(a))
}

export function debounce<A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, R | Scope.Scope> {
  return switchMapEffect(fx, (a) => Effect.as(Effect.sleep(delay), a))
}

function emitAndSleep<A>(value: A, delay: Duration.DurationInput) {
  return make<A>((sink) => Effect.zipRight(sink.onSuccess(value), Effect.sleep(delay)))
}

export function throttle<A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, R | Scope.Scope> {
  return exhaustMap(fx, (a) => emitAndSleep(a, delay))
}

export function throttleLatest<A, E, R>(fx: Fx<A, E, R>, delay: Duration.DurationInput): Fx<A, E, R | Scope.Scope> {
  return exhaustMapLatest(fx, (a) => emitAndSleep(a, delay))
}

export function fromAsyncIterable<A>(iterable: AsyncIterable<A>): Fx<A> {
  return new FromAsyncIterable(iterable)
}

class FromAsyncIterable<A> extends FxBase<A, never, never> {
  constructor(readonly i0: AsyncIterable<A>) {
    super()
  }

  run<R>(sink: Sink.Sink<A, never, R>): Effect.Effect<unknown, never, R> {
    return Effect.asyncEffect<unknown, never, R, R, never, R>((cb) => {
      const iterator = this.i0[Symbol.asyncIterator]()
      const loop = (result: IteratorResult<A>): Effect.Effect<unknown, never, R> =>
        result.done
          ? Effect.sync(() => cb(Effect.void))
          : Effect.zipRight(sink.onSuccess(result.value), Effect.flatMap(Effect.promise(() => iterator.next()), loop))

      return Effect.asVoid(Effect.flatMap(
        Effect.promise(() => iterator.next()),
        loop
      ))
    })
  }
}

export function findFirst<A, E, R>(fx: Fx<A, E, R>, predicate: Predicate.Predicate<A>): Effect.Effect<A, E, R> {
  return Effect.asyncEffect((cb) =>
    observe(fx, (a) => predicate(a) ? Effect.sync(() => cb(Effect.succeed(a))) : Effect.void)
  )
}

export function first<A, E, R>(fx: Fx<A, E, R>): Effect.Effect<A, E, R> {
  return findFirst(fx, constTrue)
}

export function either<A, E, R>(fx: Fx<A, E, R>): Fx<Either.Either<A, E>, never, R> {
  return new EitherFx(fx)
}

class EitherFx<A, E, R> extends FxBase<Either.Either<A, E>, never, R> {
  constructor(readonly i0: Fx<A, E, R>) {
    super()
  }

  run<R2>(sink: Sink.Sink<Either.Either<A, E>, never, R2>): Effect.Effect<unknown, never, R | R2> {
    return this.i0.run(
      Sink.make(
        (cause) =>
          Either.match(Cause.failureOrCause(cause), {
            onLeft: (e) => sink.onSuccess(Either.left(e)),
            onRight: (cause) => sink.onFailure(cause)
          }),
        (a) => sink.onSuccess(Either.right(a))
      )
    )
  }
}

export function mergeFirst<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  that: Fx<B, E2, R2>
): Fx<A, E | E2, R | R2> {
  return merge(fx, filter(that, constFalse) as Fx<never, E2, R2>)
}

export function mergeRace<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  that: Fx<B, E2, R2>
): Fx<A | B, E | E2, R | R2> {
  return new MergeRace(fx, that)
}

class MergeRace<A, E, R, B, E2, R2> extends FxBase<A | B, E | E2, R | R2> {
  constructor(readonly i0: Fx<A, E, R>, readonly i1: Fx<B, E2, R2>) {
    super()
  }

  run<R3>(sink: Sink.Sink<A | B, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return Effect.gen(this, function*(_) {
      const fiber1 = yield* Effect.fork(this.i0.run(Sink.make(
        sink.onFailure,
        (a) => Effect.flatMap(sink.onSuccess(a), () => Fiber.interrupt(fiber2))
      )))
      const fiber2 = yield* Effect.fork(this.i1.run(sink))

      return yield* Fiber.joinAll([fiber1, fiber2])
    })
  }
}

export function raceAll<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<
  Fx.Success<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Context<FX[number]>
> {
  return new RaceAll(fx)
}

export function race<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  that: Fx<B, E2, R2>
): Fx<A | B, E | E2, R | R2> {
  return raceAll([fx, that])
}

class RaceAll<const FX extends ReadonlyArray<Fx<any, any, any>>> extends FxBase<
  Fx.Success<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Context<FX[number]>
> {
  constructor(readonly i0: FX) {
    super()
  }

  run<R2>(
    sink: Sink.Sink<Fx.Success<FX[number]>, Fx.Error<FX[number]>, R2>
  ): Effect.Effect<unknown, never, Fx.Context<FX[number]> | R2> {
    return Effect.gen(this, function*(_) {
      const winner = yield* Deferred.make<Fiber.RuntimeFiber<unknown>>()
      const fibers: Array<Fiber.RuntimeFiber<unknown>> = []

      for (const fx of this.i0) {
        const fiber: Fiber.RuntimeFiber<unknown> = yield* Effect.fork(fx.run(Sink.make(
          sink.onFailure,
          (a) => Effect.flatMap(Deferred.succeed(winner, fiber), () => sink.onSuccess(a))
        )))
        fibers.push(fiber)
      }

      const winningFiber = yield* Deferred.await(winner)

      yield* Fiber.interruptAll(fibers.filter((x) => x !== winningFiber))

      return yield* Fiber.join(winningFiber)
    })
  }
}

export function snapshot<A, E, R, B, E2, R2, C>(
  fx: Fx<A, E, R>,
  sampled: Fx<B, E2, R2>,
  f: (a: A, b: B) => C
): Fx<C, E | E2, R | R2> {
  return new Snapshot(fx, sampled, f)
}

export function sample<A, E, R, B, E2, R2>(
  fx: Fx<A, E, R>,
  sampled: Fx<B, E2, R2>
): Fx<B, E | E2, R | R2> {
  return snapshot(fx, sampled, (_, b) => b)
}

class Snapshot<A, E, R, B, E2, R2, C> extends FxBase<C, E | E2, R | R2> {
  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: Fx<B, E2, R2>,
    readonly i2: (a: A, b: B) => C
  ) {
    super()
  }

  run<R3>(sink: Sink.Sink<C, E | E2, R3>): Effect.Effect<unknown, never, R | R2 | R3> {
    return Effect.flatMap(
      Ref.make(Option.none<B>()),
      (ref) =>
        Effect.all([
          this.i1.run(Sink.make(
            sink.onFailure,
            (b) => Ref.set(ref, Option.some(b))
          )),
          this.i0.run(Sink.make(
            sink.onFailure,
            (a) =>
              Effect.flatMap(
                Ref.get(ref),
                Option.match({
                  onNone: () => Effect.void,
                  onSome: (b) => sink.onSuccess(this.i2(a, b))
                })
              )
          ))
        ], UNBOUNDED)
    )
  }
}

export function snapshotEffect<A, E, R, B, E2, R2, C, E3, R3>(
  fx: Fx<A, E, R>,
  sampled: Fx<B, E2, R2>,
  f: (a: A, b: B) => Effect.Effect<C, E3, R3>
): Fx<C, E | E2 | E3, R | R2 | R3> {
  return new SnapshotEffect(fx, sampled, f)
}

class SnapshotEffect<A, E, R, B, E2, R2, C, E3, R3> extends FxBase<C, E | E2 | E3, R | R2 | R3> {
  constructor(
    readonly i0: Fx<A, E, R>,
    readonly i1: Fx<B, E2, R2>,
    readonly i2: (a: A, b: B) => Effect.Effect<C, E3, R3>
  ) {
    super()
  }

  run<R4>(sink: Sink.Sink<C, E | E2 | E3, R4>): Effect.Effect<unknown, never, R | R2 | R3 | R4> {
    return Effect.flatMap(
      Ref.make(Option.none<B>()),
      (ref) =>
        Effect.flatMap(
          Effect.tap(
            Effect.fork(
              this.i1.run(Sink.make(
                sink.onFailure,
                (b) => Ref.set(ref, Option.some(b))
              ))
            ),
            () =>
              this.i0.run(Sink.make(sink.onFailure, (a) =>
                Effect.flatMap(
                  Ref.get(ref),
                  Option.match({
                    onNone: () => Effect.void,
                    onSome: (b) => Effect.matchCauseEffect(this.i2(a, b), sink)
                  })
                )))
          ),
          Fiber.interrupt
        )
    )
  }
}

function if_<B, E, R, E2, R2, C, E3, R3>(
  bool: Fx<boolean, E, R>,
  options: {
    readonly onTrue: Fx<B, E2, R2>
    readonly onFalse: Fx<C, E3, R3>
  }
): Fx<B | C, E | E2 | E3, R | R2 | R3 | Scope.Scope> {
  return switchMap(
    skipRepeatsWith(bool, boolean),
    (b): Fx<B | C, E2 | E3, R2 | R3> => b ? options.onTrue : options.onFalse
  )
}

export { if_ as if }

export function when<B, E, R, C>(
  bool: Fx<boolean, E, R>,
  options: {
    readonly onTrue: B
    readonly onFalse: C
  }
): Fx<B | C, E, R> {
  return map(skipRepeatsWith(bool, boolean), (b) => (b ? options.onTrue : options.onFalse))
}

export function mapBoth<A, E, R, B, C>(
  fx: Fx<A, E, R>,
  f: (e: E) => B,
  g: (a: A) => C
): Fx<C, B, R> {
  return map(mapError(fx, f), g)
}
