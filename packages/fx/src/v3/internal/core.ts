import type {
  ConfigProvider,
  Equivalence,
  Exit,
  FiberId,
  FiberRef,
  HashSet,
  Request,
  Runtime,
  Schedule,
  Scheduler
} from "effect"
import {
  Boolean,
  Cause,
  Clock,
  Context,
  Effect,
  Either,
  Equal,
  ExecutionStrategy,
  Layer,
  Option,
  Predicate,
  Scope,
  Tracer
} from "effect"
import { constTrue } from "effect/Function"
import type { Bounds } from "../../internal/bounds.js"
import { boundsFrom, mergeBounds } from "../../internal/bounds.js"
import { Bounded, Exhaust, ExhaustLatest, Ordered, Switch, Unbounded, Unordered } from "../../internal/strategies.js"
import type { FlattenStrategy, Fx, FxFork, MergeStrategy } from "../Fx.js"
import * as Sink from "../Sink.js"
import * as EffectLoopOp from "./effect-loop-operator.js"
import * as EffectOp from "./effect-operator.js"
import * as EffectProducer from "./effect-producer.js"
import { adjustTime, matchEffectPrimitive, withBuffers, withFlattenStrategy, withScopedFork } from "./helpers.js"
import * as SyncLoopOp from "./loop-operator.js"
import * as Op from "./operator.js"
import { EffectBase, FxBase } from "./protos.js"
import * as Provide from "./provide.js"
import * as SyncOp from "./sync-operator.js"
import * as SyncProducer from "./sync-producer.js"

const DISCARD = { discard: true } as const

// TODO: Optimizations for take/drop and variants
// TODO: Slice optimizations on synchronous producers
// TODO: Error/Cause operator fusion

// TODO: snapshot/sample + Effect variants
// TODO: race / mergeRace
// TODO: mergeFirst
// TODO: tuple / struct / all
// TODO: withKey / keyed

export function make<A>(run: Fx<never, never, A>["run"]): Fx<never, never, A>
export function make<E, A>(run: Fx<never, E, A>["run"]): Fx<never, E, A>
export function make<R, E, A>(run: Fx<R, E, A>["run"]): Fx<R, E, A>
export function make<R, E, A>(run: Fx<R, E, A>["run"]): Fx<R, E, A> {
  return new Make(run)
}

class Make<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly run: Fx<R, E, A>["run"]) {
    super()
  }
}

class Producer<A> extends FxBase<never, never, A> {
  constructor(readonly i0: SyncProducer.SyncProducer<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, unknown> {
    return SyncProducer.runSink(this.i0, sink)
  }
}
/**
 * @internal
 */
export function isProducer<R, E, A>(fx: Fx<R, E, A>): fx is Producer<A> {
  return fx.constructor === Producer
}

export const succeed = <A>(value: A): Fx<never, never, A> => new Producer(SyncProducer.Success(value))

export const fromSync = <A>(f: () => A): Fx<never, never, A> => new Producer(SyncProducer.FromSync(f))

export const fromArray = <const A extends ReadonlyArray<any>>(array: A): Fx<never, never, A[number]> =>
  new Producer(SyncProducer.FromArray(array))

export const fromIterable = <A>(iterable: Iterable<A>): Fx<never, never, A> =>
  new Producer(SyncProducer.FromIterable(iterable))

class ProducerEffect<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: EffectProducer.EffectProducer<R, E, A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return EffectProducer.runSink(this.i0, sink)
  }
}

/**
 * @internal
 */
export function isProducerEffect<R, E, A>(fx: Fx<R, E, A>): fx is ProducerEffect<R, E, A> {
  return fx.constructor === ProducerEffect
}

export const fromEffect = <R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> =>
  matchEffectPrimitive<R, E, A, Fx<R, E, A>>(effect, {
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
  input: Effect.Effect<R, E, I>,
  schedule: Schedule.Schedule<R2, I, O>
): Fx<R | R2, E, O> => new ProducerEffect(EffectProducer.FromScheduled(input, schedule))

export const schedule = <R, E, A, R2, O>(
  input: Effect.Effect<R, E, A>,
  schedule: Schedule.Schedule<R2, unknown, O>
): Fx<R | R2, E, A> => new ProducerEffect(EffectProducer.Scheduled(input, schedule))

class FailCause<E> extends FxBase<never, E, never> {
  constructor(readonly i0: Cause.Cause<E>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, never>): Effect.Effect<R2, never, unknown> {
    return sink.onFailure(this.i0)
  }
}

/**
 * @internal
 */
export function isFailCause<R, E, A>(fx: Fx<R, E, A>): fx is FailCause<E> {
  return fx.constructor === FailCause
}

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> => new FailCause(cause)

export const fail = <E>(error: E): Fx<never, E, never> => failCause(Cause.fail(error))

export const die = (error: unknown): Fx<never, never, never> => failCause(Cause.die(error))

class Transformer<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: Fx<R, E, any>, readonly i1: Op.Operator) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return this.i0.run(Op.compileOperatorSink(this.i1, sink))
  }

  static make<R, E, A, R2, E2, B>(fx: Fx<R, E, A>, operator: Op.Operator): Fx<R | R2, E | E2, B> {
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
      return new Transformer<R, E, B>(fx, operator)
    }
  }
}

/**
 * @internal
 */
export function isTransformer<R, E, A>(fx: Fx<R, E, A>): fx is Transformer<R, E, A> {
  return fx.constructor === Transformer
}

class ProducerSyncTransformer<R, E, A> extends FxBase<R, E, A> implements Fx<R, E, A> {
  constructor(readonly i0: SyncProducer.SyncProducer<any>, readonly i1: Op.Operator) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return SyncProducer.runSink(this.i0, Op.compileOperatorSink(this.i1, sink))
  }
}

/**
 * @internal
 */
export function isProducerSyncTransformer<R, E, A>(fx: Fx<R, E, A>): fx is ProducerSyncTransformer<R, E, A> {
  return fx.constructor === ProducerSyncTransformer
}

export const map = <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> => Transformer.make(fx, SyncOp.Map(f))

export const filter = <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A> =>
  Transformer.make(fx, SyncOp.Filter(f))

export const filterMap = <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B> =>
  Transformer.make(fx, SyncOp.FilterMap(f))

export const mapEffect = <R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Fx<R | R2, E | E2, B> => Transformer.make(fx, EffectOp.MapEffect(f))

export const filterMapEffect = <R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Fx<R | R2, E | E2, B> => Transformer.make(fx, EffectOp.FilterMapEffect(f))

export const filterEffect = <R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> => Transformer.make(fx, EffectOp.FilterEffect(f))

export const tapEffect = <R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, unknown>
): Fx<R | R2, E | E2, A> => Transformer.make(fx, EffectOp.TapEffect(f))

export const loop = <R, E, A, B, C>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<R, E, C> =>
  Transformer.make(fx, SyncLoopOp.LoopOperator(seed, f))

export const filterMapLoop = <R, E, A, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => readonly [Option.Option<C>, B]
): Fx<R, E, C> => Transformer.make(fx, SyncLoopOp.FilterMapLoopOperator(seed, f))

export const loopEffect = <R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [C, B]>
): Fx<R | R2, E | E2, C> => Transformer.make(fx, EffectLoopOp.LoopEffectOperator(seed, f))

export const filterMapLoopEffect = <R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (acc: B, a: A) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
): Fx<R | R2, E | E2, C> => Transformer.make(fx, EffectLoopOp.FilterMapLoopEffectOperator(seed, f))

export const observe = <R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E2, void> => Observe.make(fx, f)

const constUnit = () => Effect.unit

export const drain = <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, void> => Observe.make(fx, constUnit)

class Observe<R, E, A, R2, E2, B> extends EffectBase<R | R2, E | E2, void> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R2, E2, B>
  ) {
    super()
  }

  toEffect(): Effect.Effect<R | R2, E | E2, void> {
    return Effect.asyncEffect((resume) => {
      const { i0: fx, i1: f } = this
      const onFailure = (cause: Cause.Cause<E | E2>) => Effect.sync(() => resume(Effect.failCause(cause)))

      return Effect.zipRight(
        fx.run(Sink.make(onFailure, (a) => Effect.catchAllCause(f(a), onFailure))),
        Effect.sync(() => resume(Effect.unit))
      )
    })
  }

  static make<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Effect.Effect<R | R2, E | E2, void> {
    if (isEmpty(fx)) {
      return Effect.unit
    } else if (isNever(fx)) {
      return Effect.never
    } else if (isProducer(fx)) {
      return SyncProducer.runEffect(fx.i0, f)
    } else if (isProducerSyncTransformer(fx)) {
      return Op.matchOperator(fx.i1, {
        SyncOperator: (op): Effect.Effect<R | R2, E | E2, void> =>
          SyncOp.matchSyncOperator(op, {
            Map: (op): Effect.Effect<R | R2, E | E2, void> =>
              SyncProducer.effectOnce(() => SyncProducer.runEffect(fx.i0, (a) => f(op.f(a)))),
            Filter: (op) =>
              SyncProducer.effectOnce(() =>
                SyncProducer.runEffect(fx.i0, Effect.unifiedFn((a) => op.f(a) ? f(a) : Effect.unit))
              ),
            FilterMap: (op) =>
              SyncProducer.effectOnce(() =>
                SyncProducer.runEffect(
                  fx.i0,
                  Effect.unifiedFn((a) => Option.match(op.f(a), { onNone: () => Effect.unit, onSome: f }))
                )
              )
          }),
        EffectOperator: (op) =>
          EffectOp.matchEffectOperator(op, {
            MapEffect: (op): Effect.Effect<R | R2, E | E2, void> =>
              SyncProducer.runEffect(fx.i0, (a) => Effect.flatMap(op.f(a), f)),
            FilterMapEffect: (op) =>
              SyncProducer.runEffect(fx.i0, (a) =>
                Effect.flatMap(op.f(a), Effect.unifiedFn(Option.match({ onNone: () => Effect.unit, onSome: f })))),
            FilterEffect: (op) =>
              SyncProducer.runEffect(
                fx.i0,
                Effect.unifiedFn((a) =>
                  Effect.flatMap(op.f(a), Effect.unifiedFn((b) => b ? f(a) : Effect.unit))
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
        SyncOperator: (op): Effect.Effect<R | R2, E | E2, void> =>
          SyncOp.matchSyncOperator(op, {
            Map: (op): Effect.Effect<R | R2, E | E2, void> =>
              SyncProducer.effectOnce(() => EffectProducer.runEffect(fx.i0, (a) => f(op.f(a)))),
            Filter: (op) =>
              SyncProducer.effectOnce(() =>
                EffectProducer.runEffect(fx.i0, Effect.unifiedFn((a) => op.f(a) ? f(a) : Effect.unit))
              ),
            FilterMap: (op) =>
              SyncProducer.effectOnce(() =>
                EffectProducer.runEffect(
                  fx.i0,
                  Effect.unifiedFn((a) => Option.match(op.f(a), { onNone: () => Effect.unit, onSome: f }))
                )
              )
          }),
        EffectOperator: (op) =>
          EffectOp.matchEffectOperator(op, {
            MapEffect: (op): Effect.Effect<R | R2, E | E2, void> =>
              EffectProducer.runEffect(fx.i0, (a) => Effect.flatMap(op.f(a), f)),
            FilterMapEffect: (op) =>
              EffectProducer.runEffect(fx.i0, (a) =>
                Effect.flatMap(op.f(a), Effect.unifiedFn(Option.match({ onNone: () => Effect.unit, onSome: f })))),
            FilterEffect: (op) =>
              EffectProducer.runEffect(
                fx.i0,
                Effect.unifiedFn((a) =>
                  Effect.flatMap(op.f(a), Effect.unifiedFn((b) => b ? f(a) : Effect.unit))
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

export const reduce = <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B> =>
  Reduce.make(fx, seed, f)

class Reduce<R, E, A, B> extends EffectBase<R, E, B> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: B, readonly i2: (acc: B, a: A) => B) {
    super()
  }

  toEffect(): Effect.Effect<R, E, B> {
    return Effect.suspend(() => {
      let acc = this.i1

      return Effect.map(
        observe(this.i0, (a) => Effect.sync(() => acc = this.i2(acc, a))),
        () => acc
      )
    })
  }

  static make<R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B) {
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

export const toReadonlyArray = <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, ReadonlyArray<A>> =>
  Effect.suspend(() => {
    const init = [] as Array<A>
    return Reduce.make(fx, init, (acc, a) => {
      acc.push(a)
      return acc
    })
  })

export const slice = <R, E, A>(fx: Fx<R, E, A>, drop: number, take: number): Fx<R, E, A> =>
  Slice.make(fx, boundsFrom(drop, take))

export const take = <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> => slice(fx, 0, n)

export const drop = <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> => slice(fx, n, Infinity)

class Slice<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Bounds) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return Sink.slice(sink, this.i1, (s) => this.i0.run(s))
  }

  static make<R, E, A>(fx: Fx<R, E, A>, bounds: Bounds): Fx<R, E, A> {
    if (isSlice(fx)) {
      return new Slice(fx.i0, mergeBounds(fx.i1, bounds))
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
export function isSlice<R, E, A>(fx: Fx<R, E, A>): fx is Slice<R, E, A> {
  return fx.constructor === Slice
}

export function skipRepeatsWith<R, E, A>(
  fx: Fx<R, E, A>,
  eq: Equivalence.Equivalence<A>
): Fx<R, E, A> {
  return filterMapLoop(fx, Option.none<A>(), (previous, a) => {
    if (Option.isSome(previous) && eq(a, previous.value)) {
      return [Option.none<A>(), Option.some<A>(a)] as const
    } else {
      return [Option.some<A>(a), Option.some<A>(a)] as const
    }
  })
}

export function skipRepeats<R, E, A>(
  fx: Fx<R, E, A>
): Fx<R, E, A> {
  return skipRepeatsWith(fx, Equal.equals)
}

class ProducerEffectTransformer<R, E, A, R2, E2, B> extends FxBase<R | R2, E | E2, B> {
  constructor(readonly i0: EffectProducer.EffectProducer<R, E, A>, readonly i1: Op.Operator) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, B>): Effect.Effect<R | R2 | R3, never, unknown> {
    return EffectProducer.runSink(this.i0, Op.compileOperatorSink(this.i1, sink))
  }
}

/**
 * @internal
 */
export function isProducerEffectTransformer<R, E, A>(
  fx: Fx<R, E, A>
): fx is ProducerEffectTransformer<R, E, any, R, E, A> {
  return fx.constructor === ProducerEffectTransformer
}

class Empty extends FxBase<never, never, never> {
  run<R2>(): Effect.Effect<R2, never, unknown> {
    return Effect.unit
  }
}

/**
 * @internal
 */
export function isEmpty<R, E, A>(fx: Fx<R, E, A>): fx is Empty {
  return fx.constructor === Empty
}

export const empty: Fx<never, never, never> = new Empty()

class Never extends FxBase<never, never, never> {
  run<R2>(): Effect.Effect<R2, never, unknown> {
    return Effect.never
  }
}

/**
 * @internal
 */
export function isNever<R, E, A>(fx: Fx<R, E, A>): fx is Never {
  return fx.constructor === Never
}

export const never: Fx<never, never, never> = new Never()

export function padWith<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  start: Iterable<B>,
  end: Iterable<C>
): Fx<R, E, A | B | C> {
  return new PadWith(fx, start, end)
}

export function prependAll<R, E, A, B>(
  fx: Fx<R, E, A>,
  start: Iterable<B>
): Fx<R, E, A | B> {
  return new PadWith(fx, start, [])
}

export function appendAll<R, E, A, C>(
  fx: Fx<R, E, A>,
  end: Iterable<C>
): Fx<R, E, A | C> {
  return new PadWith(fx, [], end)
}

export function prepend<R, E, A, B>(fx: Fx<R, E, A>, start: B): Fx<R, E, A | B> {
  return new PadWith(fx, [start], [])
}

export function append<R, E, A, C>(fx: Fx<R, E, A>, end: C): Fx<R, E, A | C> {
  return new PadWith<R, E, A, never, C>(fx, [], [end])
}

export function scan<R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (b: B, a: A) => B): Fx<R, E, B> {
  return prepend(
    loop(fx, seed, (b, a) => {
      const b2 = f(b, a)
      return [b2, b2] as const
    }),
    seed
  )
}

class PadWith<
  R,
  E,
  A,
  B,
  C
> extends FxBase<R, E, A | B | C> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Iterable<B>, readonly i2: Iterable<C>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A | B | C>): Effect.Effect<R | R2, never, unknown> {
    const onSuccess = (a: A | B | C) => sink.onSuccess(a)

    return Effect.forEach(this.i1, onSuccess, DISCARD).pipe(
      Effect.zipRight(this.i0.run(sink)),
      Effect.zipRight(Effect.forEach(this.i2, onSuccess, DISCARD))
    )
  }

  static make<R, E, A, B, C>(
    fx: Fx<R, E, A>,
    start: Iterable<B>,
    end: Iterable<C>
  ): Fx<R, E, A | B | C> {
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
export function isPadWith<R, E, A>(
  fx: Fx<R, E, A>
): fx is PadWith<R, E, A, A, A> {
  return fx.constructor === PadWith
}

export function flatMapWithStrategy<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  strategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy.ExecutionStrategy = ExecutionStrategy.sequential
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return FlatMapWithStrategy.make(fx, f, strategy, executionStrategy)
}

export function switchMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMapWithStrategy(fx, f, Switch, executionStrategy)
}

export function switchMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return switchMap(fx, (a) => fromEffect(f(a)), executionStrategy)
}

export function exhaustMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMapWithStrategy(fx, f, Exhaust, executionStrategy)
}

export function exhaustMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return exhaustMap(fx, (a) => fromEffect(f(a)), executionStrategy)
}

export function exhaustMapLatest<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMapWithStrategy(fx, f, ExhaustLatest, executionStrategy)
}

export function exhaustMapLatestEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return exhaustMapLatest(fx, (a) => fromEffect(f(a)), executionStrategy)
}

export function flatMapConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  capacity: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMapWithStrategy(fx, f, Bounded(capacity), executionStrategy)
}

export function concatMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMapConcurrently(fx, f, 1, executionStrategy)
}

export function flatMapConcurrentlyEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  capacity: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMapConcurrently(fx, (a) => fromEffect(f(a)), capacity, executionStrategy)
}

export function flatMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMapWithStrategy(fx, f, Unbounded, executionStrategy)
}

export function flatMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E | E2, B> {
  return flatMap(fx, (a) => fromEffect(f(a)), executionStrategy)
}

class FlatMapWithStrategy<
  R,
  E,
  A,
  R2,
  E2,
  B
> extends FxBase<R | R2 | Scope.Scope, E | E2, B> {
  private withFork: <R, E, A>(
    f: (
      fork: FxFork,
      scope: Scope.Scope
    ) => Effect.Effect<R, E, A>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) => Effect.Effect<Scope.Scope | R, E, void>

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (a: A) => Fx<R2, E2, B>,
    readonly i2: FlattenStrategy,
    readonly i3: ExecutionStrategy.ExecutionStrategy
  ) {
    super()

    this.withFork = withFlattenStrategy(this.i2)
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, B>): Effect.Effect<R | R2 | R3 | Scope.Scope, never, unknown> {
    return this.withFork(
      (fork) =>
        this.i0.run(Sink.make((cause) => sink.onFailure(cause), (a) => {
          const inner = this.i1(a)
          // TODO: Optimize behaviors based on type of inner Fx
          return fork(inner.run(sink))
        })),
      this.i3
    )
  }

  static make<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: (a: A) => Fx<R2, E2, B>,
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

export function fromFxEffect<R, E, R2, E2, B>(
  effect: Effect.Effect<R, E, Fx<R2, E2, B>>
): Fx<R | R2, E | E2, B> {
  return new FromFxEffect(effect)
}

class FromFxEffect<
  R,
  E,
  R2,
  E2,
  B
> extends FxBase<R | R2, E | E2, B> {
  constructor(readonly i0: Effect.Effect<R, E, Fx<R2, E2, B>>) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, B>): Effect.Effect<R | R2 | R3, never, unknown> {
    return Effect.matchCauseEffect(this.i0, {
      onFailure: (cause) => sink.onFailure(cause),
      onSuccess: (fx) => fx.run(sink)
    })
  }
}

export function continueWith<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: () => Fx<R2, E2, B>
): Fx<R | R2, E | E2, A | B> {
  return ContinueWith.make(fx, f)
}

class ContinueWith<
  R,
  E,
  A,
  R2,
  E2,
  B
> extends FxBase<R | R2, E | E2, A | B> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: () => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, A | B>): Effect.Effect<R | R2 | R3, never, unknown> {
    return Effect.flatMap(this.i0.run(sink), () => this.i1().run(sink))
  }

  static make<R, E, A, R2, E2, B>(
    fx: Fx<R, E, A>,
    f: () => Fx<R2, E2, B>
  ): Fx<R | R2, E | E2, A | B> {
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

export function suspend<R, E, A>(f: () => Fx<R, E, A>): Fx<R, E, A> {
  return new Suspend(f)
}

class Suspend<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: () => Fx<R, E, A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return this.i0().run(sink)
  }
}

function isSuspend<R, E, A>(fx: Fx<R, E, A>): fx is Suspend<R, E, A> {
  return fx.constructor === Suspend
}

class SuspendedTransformer<R, E, A, R2, E2, B> extends FxBase<R | R2, E2, B> {
  constructor(readonly i0: () => Fx<R, E, A>, readonly i1: Op.Operator) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E2, B>): Effect.Effect<R | R2 | R3, never, unknown> {
    return this.i0().run(Op.compileOperatorSink(this.i1, sink))
  }
}

function isSuspendedTransformer<R, E, A>(fx: Fx<R, E, A>): fx is SuspendedTransformer<R, E, A, any, any, any> {
  return fx.constructor === SuspendedTransformer
}

export function mergeWithStrategy<const FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX,
  stategy: MergeStrategy
): Fx<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  return MergeWithStrategy.make(fx, stategy)
}

export function merge<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  other: Fx<R2, E2, B>
): Fx<R | R2, E | E2, A | B> {
  return mergeWithStrategy([fx, other], Unordered(2))
}

export function mergeAll<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> {
  return mergeWithStrategy(fx, Unordered(Infinity))
}

export function mergeOrdered<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> {
  return mergeOrderedConcurrently(fx, Infinity)
}

export function mergeOrderedConcurrently<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX,
  concurrency: number
): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> {
  return mergeWithStrategy(fx, Ordered(concurrency))
}

export function mergeSwitch<FX extends ReadonlyArray<Fx<any, any, any>>>(
  fx: FX
): Fx<Fx.Context<FX[number]>, Fx.Error<FX[number]>, Fx.Success<FX[number]>> {
  return mergeWithStrategy(fx, Switch)
}

class MergeWithStrategy<
  const FX extends ReadonlyArray<Fx<any, any, any>>
> extends FxBase<
  Fx.Context<FX[number]>,
  Fx.Error<FX[number]>,
  Fx.Success<FX[number]>
> {
  constructor(readonly i0: FX, readonly i1: MergeStrategy) {
    super()
  }

  run<R2>(
    sink: Sink.Sink<R2, Fx.Error<FX[number]>, Fx.Success<FX[number]>>
  ): Effect.Effect<Fx.Context<FX[number]> | R2, never, unknown> {
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
    Fx.Context<FX[number]>,
    Fx.Error<FX[number]>,
    Fx.Success<FX[number]>
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
  sink: Sink.Sink<R2, any, any>,
  concurrency: number | "unbounded"
): Effect.Effect<R2 | Fx.Context<FX[number]>, never, unknown> {
  return Effect.forEach(fx, (fx) => fx.run(sink), { concurrency, discard: true })
}

function runOrdered<
  const FX extends ReadonlyArray<Fx<any, any, any>>,
  R2
>(
  fx: FX,
  sink: Sink.Sink<R2, any, any>,
  concurrency: number | "unbounded"
): Effect.Effect<R2 | Fx.Context<FX[number]>, never, unknown> {
  return Effect.suspend(
    () => {
      const buffers = withBuffers(fx.length, sink)
      return Effect.all(
        fx.map((fx, i) =>
          Effect.flatMap(
            fx.run(
              Sink.make(
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
      )
    }
  )
}

function runSwitch<
  const FX extends ReadonlyArray<Fx<any, any, any>>,
  R2
>(
  fx: FX,
  sink: Sink.Sink<R2, any, any>
): Effect.Effect<R2 | Fx.Context<FX[number]>, never, unknown> {
  return Effect.forEach(fx, (fx) => fx.run(sink), { concurrency: 1, discard: true })
}

export function takeWhile<R, E, A>(
  fx: Fx<R, E, A>,
  f: Predicate.Predicate<A>
): Fx<R, E, A> {
  return TakeWhile.make(fx, f)
}

export function takeUntil<R, E, A>(
  fx: Fx<R, E, A>,
  f: Predicate.Predicate<A>
): Fx<R, E, A> {
  return TakeWhile.make(fx, Predicate.not(f))
}

class TakeWhile<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Predicate.Predicate<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return Sink.takeWhile(sink, this.i1, (s) => this.i0.run(s))
  }

  static make<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate.Predicate<A>): Fx<R, E, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new TakeWhile(fx, predicate)
    }
  }
}

export function dropWhile<R, E, A>(
  fx: Fx<R, E, A>,
  f: Predicate.Predicate<A>
): Fx<R, E, A> {
  return DropUntil.make(fx, f)
}

export function dropUntil<R, E, A>(
  fx: Fx<R, E, A>,
  f: Predicate.Predicate<A>
): Fx<R, E, A> {
  return DropUntil.make(fx, Predicate.not(f))
}

class DropUntil<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Predicate.Predicate<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return this.i0.run(Sink.dropWhile(sink, this.i1))
  }

  static make<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate.Predicate<A>): Fx<R, E, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropUntil(fx, predicate)
    }
  }
}

export function dropAfter<R, E, A>(
  fx: Fx<R, E, A>,
  f: Predicate.Predicate<A>
): Fx<R, E, A> {
  return DropAfter.make(fx, f)
}

class DropAfter<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Predicate.Predicate<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return this.i0.run(Sink.dropAfter(sink, this.i1))
  }

  static make<R, E, A>(fx: Fx<R, E, A>, predicate: Predicate.Predicate<A>): Fx<R, E, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropAfter(fx, predicate)
    }
  }
}

export function takeWhileEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> {
  return TakeWhileEffect.make(fx, f)
}

export function takeUntilEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> {
  return TakeWhileEffect.make(fx, (a) => Effect.map(f(a), Boolean.not))
}

class TakeWhileEffect<R, E, A, R2, E2> extends FxBase<R | R2, E | E2, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: (a: A) => Effect.Effect<R2, E2, boolean>) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, A>): Effect.Effect<R | R2 | R3, never, unknown> {
    return Sink.takeWhileEffect(sink, this.i1, (s) => this.i0.run(s))
  }

  static make<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new TakeWhileEffect(fx, f)
    }
  }
}

export function dropWhileEffect<R, E, A>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R, E, boolean>
): Fx<R, E, A> {
  return DropWhileEffect.make(fx, f)
}

export function dropUntilEffect<R, E, A>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R, E, boolean>
): Fx<R, E, A> {
  return DropWhileEffect.make(fx, (a) => Effect.map(f(a), Boolean.not))
}

class DropWhileEffect<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: (a: A) => Effect.Effect<R, E, boolean>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return this.i0.run(Sink.dropWhileEffect(sink, this.i1))
  }

  static make<R, E, A>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R, E, boolean>
  ): Fx<R, E, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropWhileEffect(fx, f)
    }
  }
}

export function dropAfterEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E | E2, A> {
  return DropAfterEffect.make(fx, f)
}

class DropAfterEffect<R, E, A, R2, E2> extends FxBase<R | R2, E | E2, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: (a: A) => Effect.Effect<R2, E2, boolean>) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, A>): Effect.Effect<R | R2 | R3, never, unknown> {
    return this.i0.run(Sink.dropAfterEffect(sink, this.i1))
  }

  static make<R, E, A, R2, E2>(
    fx: Fx<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Fx<R | R2, E | E2, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new DropAfterEffect(fx, f)
    }
  }
}

export function during<R, E, A, R2, E2, R3, E3, B>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, Fx<R3, E3, B>>
): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, A> {
  return During.make(fx, window)
}

export function since<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, B>
): Fx<R | R2 | Scope.Scope, E | E2, A> {
  return During.make(fx, map(window, () => never))
}

export function until<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  window: Fx<R2, E2, B>
): Fx<R | R2 | Scope.Scope, E | E2, A> {
  return During.make(fx, succeed(window))
}

class During<R, E, A, R2, E2, R3, E3, B> extends FxBase<R | R2 | R3 | Scope.Scope, E | E2 | E3, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Fx<R2, E2, Fx<R3, E3, B>>) {
    super()
  }

  run<R4>(sink: Sink.Sink<R4, E | E2 | E3, A>): Effect.Effect<R | R2 | R3 | R4 | Scope.Scope, never, unknown> {
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
                  return fork(take(nested, 1).run(Sink.make(onFailure, () => s.earlyExit)))
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
                    (a) => taking ? s.onSuccess(a) : Effect.unit
                  )
                )
              )
          )
        }),
      ExecutionStrategy.sequential
    )
  }

  static make<R, E, A, R2, E2, R3, E3, B>(
    fx: Fx<R, E, A>,
    window: Fx<R2, E2, Fx<R3, E3, B>>
  ): Fx<R | R2 | R3 | Scope.Scope, E | E2 | E3, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else {
      return new During(fx, window)
    }
  }
}

export function middleware<R, E, A, R3>(
  fx: Fx<R, E, A>,
  effect: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R3, never, unknown>,
  sink?: (sink: Sink.Sink<never, E, A>) => Sink.Sink<R, E, A>
): Fx<R3, E, A> {
  return new Middleware(fx, effect, sink)
}

export function onExit<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (exit: Exit.Exit<never, unknown>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return middleware(fx, Effect.onExit(f))
}

export function onInterrupt<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (interruptors: HashSet.HashSet<FiberId.FiberId>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return middleware(fx, Effect.onInterrupt(f))
}

export function onError<R, E, A, R2>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<never>) => Effect.Effect<R2, never, unknown>
): Fx<R | R2, E, A> {
  return middleware(fx, Effect.onError(f))
}

export const scoped = <R, E, A>(fx: Fx<R, E, A>): Fx<Exclude<R, Scope.Scope>, E, A> => middleware(fx, Effect.scoped)

export function annotateLogs<R, E, A>(
  fx: Fx<R, E, A>,
  key: string | Record<string, unknown>,
  value?: unknown
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.annotateLogs(effect, key as string, value as unknown))
}

export function annotateSpans<R, E, A>(
  fx: Fx<R, E, A>,
  key: string | Record<string, unknown>,
  value?: unknown
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.annotateSpans(effect, key as string, value as unknown))
}

export const interruptible = <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => middleware(fx, Effect.interruptible)

export const uninterruptible = <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => middleware(fx, Effect.uninterruptible)

export function locally<R, E, B, A>(
  use: Fx<R, E, B>,
  self: FiberRef.FiberRef<A>,
  value: A
): Fx<R, E, B> {
  return middleware(use, (effect) => Effect.locally(effect, self, value))
}

export function locallyWith<R, E, B, A>(
  use: Fx<R, E, B>,
  self: FiberRef.FiberRef<A>,
  f: (a: A) => A
): Fx<R, E, B> {
  return middleware(use, (effect) => Effect.locallyWith(effect, self, f))
}

export function withTracerTiming<R, E, A>(
  fx: Fx<R, E, A>,
  enabled: boolean
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withTracerTiming(effect, enabled))
}

export function withConcurrency<R, E, A>(
  fx: Fx<R, E, A>,
  concurrency: number | "unbounded"
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withConcurrency(effect, concurrency))
}

export function withConfigProvider<R, E, A>(
  fx: Fx<R, E, A>,
  configProvider: ConfigProvider.ConfigProvider
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withConfigProvider(effect, configProvider))
}

export function withLogSpan<R, E, A>(
  fx: Fx<R, E, A>,
  span: string
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withLogSpan(effect, span))
}

export function withMaxOpsBeforeYield<R, E, A>(
  fx: Fx<R, E, A>,
  maxOps: number
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withMaxOpsBeforeYield(effect, maxOps))
}

export function withParentSpan<R, E, A>(
  fx: Fx<R, E, A>,
  parentSpan: Tracer.ParentSpan
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withParentSpan(effect, parentSpan))
}

export function withRequestBatching<R, E, A>(
  fx: Fx<R, E, A>,
  requestBatching: boolean
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withRequestBatching(effect, requestBatching))
}

export function withRequestCache<R, E, A>(
  fx: Fx<R, E, A>,
  cache: Request.Cache
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withRequestCache(effect, cache))
}

export function withRequestCaching<R, E, A>(
  fx: Fx<R, E, A>,
  requestCaching: boolean
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withRequestCaching(effect, requestCaching))
}

export function withScheduler<R, E, A>(
  fx: Fx<R, E, A>,
  scheduler: Scheduler.Scheduler
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withScheduler(effect, scheduler))
}

export function withTracer<R, E, A>(
  fx: Fx<R, E, A>,
  tracer: Tracer.Tracer
): Fx<R, E, A> {
  return middleware(fx, (effect) => Effect.withTracer(effect, tracer))
}

class Middleware<R, E, A, R2> extends FxBase<R2, E, A> {
  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (effect: Effect.Effect<R, never, unknown>) => Effect.Effect<R2, never, unknown>,
    readonly i2?: (sink: Sink.Sink<never, E, A>) => Sink.Sink<R, E, A>
  ) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<R2 | R3, never, unknown> {
    return Effect.contextWithEffect((ctx) => {
      const s = Sink.provide(sink, ctx)

      return this.i1(this.i0.run(this.i2 ? this.i2(s) : s))
    })
  }
}

export function acquireUseRelease<R, E, A, R2, E2, B, R3, E3, C>(
  acquire: Effect.Effect<R, E, A>,
  use: (a: A) => Fx<R2, E2, B>,
  release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, C>
): Fx<R | R2 | R3, E | E2 | E3, B> {
  return new AcquireUseRelease(acquire, use, release)
}

class AcquireUseRelease<R, E, A, R2, E2, B, R3, E3, C> extends FxBase<R | R2 | R3, E | E2 | E3, B> {
  constructor(
    readonly acquire: Effect.Effect<R, E, A>,
    readonly use: (a: A) => Fx<R2, E2, B>,
    readonly release: (a: A, exit: Exit.Exit<unknown, unknown>) => Effect.Effect<R3, E3, C>
  ) {
    super()
  }

  run<R4>(sink: Sink.Sink<R4, E | E2 | E3, B>): Effect.Effect<R | R2 | R3 | R4, never, unknown> {
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

export function withSpan<R, E, A>(
  self: Fx<R, E, A>,
  name: string,
  options: {
    readonly attributes?: Record<string, unknown>
    readonly links?: ReadonlyArray<Tracer.SpanLink>
    readonly parent?: Tracer.ParentSpan
    readonly root?: boolean
    readonly context?: Context.Context<never>
  } = {}
): Fx<R, E, A> {
  return acquireUseRelease(
    Effect.flatMap(
      Effect.currentSpan,
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

export function provideContext<R, E, A, R2>(
  fx: Fx<R, E, A>,
  context: Context.Context<R2>
): Fx<Exclude<R, R2>, E, A> {
  return ProvideFx.make(fx, Provide.ProvideContext(context))
}

export function provideLayer<R, E, A, R2, E2, S>(
  fx: Fx<R, E, A>,
  layer: Layer.Layer<R2, E2, S>
): Fx<R2 | Exclude<R, S>, E | E2, A> {
  return ProvideFx.make(fx, Provide.ProvideLayer(layer))
}

export function provideRuntime<R, E, A, R2>(
  fx: Fx<R, E, A>,
  runtime: Runtime.Runtime<R2>
): Fx<Exclude<R, R2>, E, A> {
  return ProvideFx.make(fx, Provide.ProvideRuntime(runtime))
}

export function provideService<R, E, A, I, S>(
  fx: Fx<R, E, A>,
  service: Context.Tag<I, S>,
  instance: S
): Fx<Exclude<R, I>, E, A> {
  return ProvideFx.make(fx, Provide.ProvideService(service, instance))
}

export function provideServiceEffect<R, E, A, I, S, R2, E2>(
  fx: Fx<R, E, A>,
  service: Context.Tag<I, S>,
  instance: Effect.Effect<R2, E2, S>
): Fx<Exclude<R, I> | R2, E | E2, A> {
  return ProvideFx.make(fx, Provide.ProvideServiceEffect(service, instance))
}

export function provide<R, E, A, R2 = never, E2 = never, S = never>(
  fx: Fx<R, E, A>,
  provide: Layer.Layer<R2, E2, S> | Context.Context<S> | Runtime.Runtime<S>
): Fx<Exclude<R, S> | R2, E | E2, A> {
  if (Layer.isLayer(provide)) return provideLayer(fx, provide as Layer.Layer<R2, E2, S>)
  else if (Context.isContext(provide)) return provideContext(fx, provide as Context.Context<S>)
  else return provideRuntime(fx, provide as Runtime.Runtime<S>)
}

class ProvideFx<R, E, A, R2, E2, S> extends FxBase<R2 | Exclude<R, S>, E | E2, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Provide.Provide<R2, E2, S>) {
    super()
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, A>): Effect.Effect<R2 | R3 | Exclude<R, S>, never, unknown> {
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

  static make<R, E, A, R2, E2, S>(
    fx: Fx<R, E, A>,
    provide: Provide.Provide<R2, E2, S>
  ): Fx<Exclude<R, S> | R2, E | E2, A> {
    if (isEmpty(fx) || isNever(fx)) return fx
    else if (isProvideFx(fx)) {
      return new ProvideFx(fx.i0, Provide.merge(fx.i1, provide))
    } else {
      return new ProvideFx(fx, provide)
    }
  }
}

function isProvideFx<R, E, A>(u: Fx<R, E, A>): u is ProvideFx<R, E, A, R, E, never> {
  return u.constructor === ProvideFx
}

export function mapCause<R, E, A, E2>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Cause.Cause<E2>
): Fx<R, E2, A> {
  return new TransformerCause(fx, SyncOp.Map(f))
}

export function mapError<R, E, A, E2>(
  fx: Fx<R, E, A>,
  f: (e: E) => E2
): Fx<R, E2, A> {
  return mapCause(fx, Cause.map(f))
}

export function filterCause<R, E, A>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => boolean
): Fx<R, E, A> {
  return new TransformerCause(fx, SyncOp.Filter(f))
}

export function filterError<R, E, A>(
  fx: Fx<R, E, A>,
  f: (e: E) => boolean
): Fx<R, E, A> {
  return filterCause(fx, (cause) =>
    Option.match(Cause.failureOption(cause), {
      onNone: constTrue,
      onSome: f
    }))
}

export function filterMapCause<R, E, A, E2>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Option.Option<Cause.Cause<E2>>
): Fx<R, E2, A> {
  return new TransformerCause(fx, SyncOp.FilterMap(f))
}

export function filterMapError<R, E, A, E2>(
  fx: Fx<R, E, A>,
  f: (e: E) => Option.Option<E2>
): Fx<R, E2, A> {
  return filterMapCause(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Option.map(f(e), Cause.fail),
      onRight: Option.some
    }))
}

export function mapCauseEffect<R, E, A, R2, E2, E3>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Cause.Cause<E3>>
): Fx<R | R2, E2 | E3, A> {
  return new TransformerCause(fx, EffectOp.MapEffect(f))
}

export function mapErrorEffect<R, E, A, R2, E2, E3>(
  fx: Fx<R, E, A>,
  f: (e: E) => Effect.Effect<R2, E2, E3>
): Fx<R | R2, E2 | E3, A> {
  return mapCauseEffect(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(e), Cause.fail),
      onRight: (cause) => Effect.succeed(cause)
    }))
}

export function filterCauseEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E2, A> {
  return new TransformerCause(fx, EffectOp.FilterEffect(f))
}

export function filterErrorEffect<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (e: E) => Effect.Effect<R2, E2, boolean>
): Fx<R | R2, E2, A> {
  return filterCauseEffect(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: f,
      onRight: () => Effect.succeed(true)
    }))
}

export function filterMapCauseEffect<R, E, A, R2, E2, E3>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Option.Option<Cause.Cause<E3>>>
): Fx<R | R2, E2 | E3, A> {
  return new TransformerCause(fx, EffectOp.FilterMapEffect(f))
}

export function filterMapErrorEffect<R, E, A, R2, E2, E3>(
  fx: Fx<R, E, A>,
  f: (e: E) => Effect.Effect<R2, E2, Option.Option<E3>>
): Fx<R | R2, E2 | E3, A> {
  return filterMapCauseEffect(fx, (cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(e), Option.map(Cause.fail)),
      onRight: (cause) => Effect.succeed(Option.some(cause))
    }))
}

export function loopCause<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => readonly [Cause.Cause<C>, B]
): Fx<R, C, A> {
  return new TransformerCause(fx, SyncLoopOp.LoopOperator(seed, f))
}

export function loopError<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (b: B, e: E) => readonly [C, B]
): Fx<R, C, A> {
  return loopCause(fx, seed, (b, cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => {
        const [c, b2] = f(b, e)
        return [Cause.fail(c), b2]
      },
      onRight: (cause) => [cause, b]
    }))
}

export function loopCauseEffect<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Cause.Cause<C>, B]>
): Fx<R | R2, E2 | C, A> {
  return new TransformerCause(fx, EffectLoopOp.LoopEffectOperator(seed, f))
}

export function loopErrorEffect<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [C, B]>
) {
  return loopCauseEffect(fx, seed, (b, cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(b, e), ([c, b2]) => [Cause.fail(c), b2]),
      onRight: (cause) => Effect.succeed([cause, b])
    }))
}

export function filterMapLoopCause<R, E, A, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B]
): Fx<R, C, A> {
  return new TransformerCause(fx, SyncLoopOp.FilterMapLoopOperator(seed, f))
}

export function filterMapLoopError<R, E, A, B, C>(
  fx: Fx<R, E, A>,
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

export function filterMapLoopCauseEffect<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (b: B, cause: Cause.Cause<E>) => Effect.Effect<R2, E2, readonly [Option.Option<Cause.Cause<C>>, B]>
): Fx<R | R2, E2 | C, A> {
  return new TransformerCause(fx, EffectLoopOp.FilterMapLoopEffectOperator(seed, f))
}

export function filterMapLoopErrorEffect<R, E, A, R2, E2, B, C>(
  fx: Fx<R, E, A>,
  seed: B,
  f: (b: B, e: E) => Effect.Effect<R2, E2, readonly [Option.Option<C>, B]>
) {
  return filterMapLoopCauseEffect(fx, seed, (b, cause) =>
    Either.match(Cause.failureOrCause(cause), {
      onLeft: (e) => Effect.map(f(b, e), ([c, b2]) => [Option.map(c, Cause.fail), b2]),
      onRight: (cause) => Effect.succeed([Option.some(cause), b])
    }))
}

class TransformerCause<R, E, A, R2, E2> extends FxBase<R | R2, E2, A> {
  constructor(readonly i0: Fx<R, E, A>, readonly i1: Op.Operator) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E2, A>): Effect.Effect<R | R2, never, unknown> {
    return this.i0.run(Op.compileOperatorSinkCause(this.i1, sink))
  }
}

export function flatMapCauseWithStrategy<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  flattenStrategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy.ExecutionStrategy = ExecutionStrategy.sequential
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return new FlatMapCauseWithStrategy(fx, f, flattenStrategy, executionStrategy)
}

export function flatMapErrorWithStrategy<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
  flattenStrategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy.ExecutionStrategy = ExecutionStrategy.sequential
): Fx<R | R2 | Scope.Scope, E2, A | B> {
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

export function switchMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, Switch, executionStrategy)
}

export function switchMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, Switch, executionStrategy)
}

export function flatMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, Unbounded, executionStrategy)
}

export function flatMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, Unbounded, executionStrategy)
}

export function flatMapCauseConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  concurrency: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, Bounded(concurrency), executionStrategy)
}

export function flatMapErrorConcurrently<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
  concurrency: number,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, Bounded(concurrency), executionStrategy)
}

export function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, Exhaust, executionStrategy)
}

export function exhaustMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, Exhaust, executionStrategy)
}

export function exhaustMapLatestCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapCauseWithStrategy(fx, f, ExhaustLatest, executionStrategy)
}

export function exhaustMapLatestError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
  executionStrategy?: ExecutionStrategy.ExecutionStrategy
): Fx<R | R2 | Scope.Scope, E2, A | B> {
  return flatMapErrorWithStrategy(fx, f, ExhaustLatest, executionStrategy)
}

class FlatMapCauseWithStrategy<
  R,
  E,
  A,
  R2,
  E2,
  B
> extends FxBase<R | R2 | Scope.Scope, E2, A | B> {
  private withFork: <R, E, A>(
    f: (
      fork: FxFork,
      scope: Scope.Scope
    ) => Effect.Effect<R, E, A>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) => Effect.Effect<Scope.Scope | R, E, void>

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    readonly i2: FlattenStrategy,
    readonly i3: ExecutionStrategy.ExecutionStrategy
  ) {
    super()

    this.withFork = withFlattenStrategy(this.i2)
  }

  run<R3>(sink: Sink.Sink<R3, E | E2, A | B>): Effect.Effect<R | R2 | R3 | Scope.Scope, never, unknown> {
    return this.withFork(
      (fork) => this.i0.run(Sink.make((cause) => fork(this.i1(cause).run(sink)), (a) => sink.onSuccess(a))),
      this.i3
    )
  }
}

class MatchWithStrategy<
  R,
  E,
  A,
  R2,
  E2,
  B,
  R3,
  E3,
  C
> extends FxBase<R | R2 | R3 | Scope.Scope, E2 | E3, B | C> {
  private withFork: <R, E, A>(
    f: (
      fork: FxFork,
      scope: Scope.Scope
    ) => Effect.Effect<R, E, A>,
    executionStrategy: ExecutionStrategy.ExecutionStrategy
  ) => Effect.Effect<Scope.Scope | R, E, void>

  constructor(
    readonly i0: Fx<R, E, A>,
    readonly i1: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
    readonly i2: (a: A) => Fx<R3, E3, C>,
    readonly i3: FlattenStrategy,
    readonly i4: ExecutionStrategy.ExecutionStrategy
  ) {
    super()

    this.withFork = withFlattenStrategy(this.i3)
  }

  run<R4>(sink: Sink.Sink<R4, E2 | E3, B | C>): Effect.Effect<R | R2 | R3 | R4 | Scope.Scope, never, unknown> {
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

export type MatchCauseOptions<E, A, R2, E2, B, R3, E3, C> = {
  readonly onFailure: (cause: Cause.Cause<E>) => Fx<R2, E2, B>
  readonly onSuccess: (a: A) => Fx<R3, E3, C>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

export function matchCauseWithStrategy<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  flattenStrategy: FlattenStrategy,
  opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C> {
  return new MatchWithStrategy(
    fx,
    opts.onFailure,
    opts.onSuccess,
    flattenStrategy,
    opts.executionStrategy || ExecutionStrategy.sequential
  )
}

export type MatchErrorOptions<E, A, R2, E2, B, R3, E3, C> = {
  readonly onFailure: (e: E) => Fx<R2, E2, B>
  readonly onSuccess: (a: A) => Fx<R3, E3, C>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy | undefined
}

export function matchErrorWithStrategy<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  flattenStrategy: FlattenStrategy,
  { executionStrategy, onFailure, onSuccess }: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
): Fx<R | R2 | R3 | Scope.Scope, E2 | E3, B | C> {
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

export function matchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchCauseWithStrategy(fx, Unbounded, opts)
}

export function matchError<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchErrorWithStrategy(fx, Unbounded, opts)
}

export function matchCauseConcurrently<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  concurrency: number,
  opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchCauseWithStrategy(fx, Bounded(concurrency), opts)
}

export function matchErrorConcurrently<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  concurrency: number,
  opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchErrorWithStrategy(fx, Bounded(concurrency), opts)
}

export function switchMatchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchCauseWithStrategy(fx, Switch, opts)
}

export function switchMatchError<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchErrorWithStrategy(fx, Switch, opts)
}

export function exhaustMatchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchCauseWithStrategy(fx, Exhaust, opts)
}

export function exhaustMatchError<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchErrorWithStrategy(fx, Exhaust, opts)
}

export function exhaustMatchLatestCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchCauseOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchCauseWithStrategy(fx, ExhaustLatest, opts)
}

export function exhaustMatchLatestError<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  opts: MatchErrorOptions<E, A, R2, E2, B, R3, E3, C>
) {
  return matchErrorWithStrategy(fx, ExhaustLatest, opts)
}
