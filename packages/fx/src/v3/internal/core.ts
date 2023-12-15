import type { Equivalence, Schedule, Scope } from "effect"
import { Cause, Effect, Equal, ExecutionStrategy, Option, Predicate } from "effect"
import type { Bounds } from "../../internal/bounds.js"
import { boundsFrom, mergeBounds } from "../../internal/bounds.js"
import { Bounded, Exhaust, ExhaustLatest, Ordered, Switch, Unbounded, Unordered } from "../Fx.js"
import type { FlattenStrategy, Fx, FxFork, MergeStrategy } from "../Fx.js"
import * as Sink from "../Sink.js"
import * as EffectLoopOp from "./effect-loop-operator.js"
import * as EffectOp from "./effect-operator.js"
import * as EffectProducer from "./effect-producer.js"
import { matchEffectPrimitive, withBuffers, withFlattenStrategy } from "./helpers.js"
import * as SyncLoopOp from "./loop-operator.js"
import * as Op from "./operator.js"
import { EffectBase, FxBase } from "./protos.js"
import * as SyncOp from "./sync-operator.js"
import * as SyncProducer from "./sync-producer.js"

const DISCARD = { discard: true } as const

// TODO: takeWhile/dropWhile/skipAfter + Effect variants
// TODO: Cause/Error + Effect variants
// TODO: takeUntil/dropUntil/during + Effect variants
// TODO: snapshot/sample + Effect variants
// TODO: sharing
// TODO: Provide resources
// TODO: Effect middleware
// TODO: race / mergeRace
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
    None: () => fail(new Cause.NoSuchElementException() as E),
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

export const filterMap = <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> =>
  Transformer.make(fx, SyncOp.Map(f))

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
    return Effect.forEach(this.i1, sink.onSuccess, DISCARD).pipe(
      Effect.zipRight(this.i0.run(sink)),
      Effect.zipRight(Effect.forEach(this.i2, sink.onSuccess, DISCARD))
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
        this.i0.run(Sink.make(sink.onFailure, (a) => {
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
