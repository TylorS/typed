import type { Equivalence, Predicate, Schedule } from "effect"
import { Cause, Effect, Equal, Option } from "effect"
import type { Bounds } from "../../internal/bounds.js"
import { boundsFrom, mergeBounds } from "../../internal/bounds.js"
import type { Fx } from "../Fx.js"
import * as Sink from "../Sink.js"
import * as EffectLoopOp from "./effect-loop-operator.js"
import * as EffectOp from "./effect-operator.js"
import * as EffectProducer from "./effect-producer.js"
import * as SyncLoopOp from "./loop-operator.js"
import * as Op from "./operator.js"
import { EffectBase, FxBase } from "./protos.js"
import * as SyncOp from "./sync-operator.js"
import * as SyncProducer from "./sync-producer.js"

// TODO: empty/never
// TODO: startWith/endWith/padWith + Effect variants
// TODO: takeWhile/dropWhile/skipAfter + Effect variants
// TODO: flatMap/switchMap/exhaustMap/exhaustMapLatest + Effect variants
// TODO: Cause/Error + Effect variants
// TODO: takeUntil/dropUntil/during + Effect variants
// TODO: snapshot/sample + Effect variants
// TODO: sharing
// TODO: Provide resources
// TODO: Effect middleware
// TODO: Scheduling
// TODO:

class Producer<A> extends FxBase<never, never, A> {
  constructor(readonly i0: SyncProducer.SyncProducer<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, unknown> {
    return SyncProducer.runSink(this.i0, sink)
  }
}

function isProducer<R, E, A>(fx: Fx<R, E, A>): fx is Producer<A> {
  return fx.constructor === Producer
}

export const succeed = <A>(value: A): Fx<never, never, A> => new Producer(SyncProducer.Success(value))

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

function isProducerEffect<R, E, A>(fx: Fx<R, E, A>): fx is ProducerEffect<R, E, A> {
  return fx.constructor === ProducerEffect
}

export const fromEffect = <R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> =>
  new ProducerEffect(EffectProducer.FromEffect(effect))

export const fromScheduled = <R, E, I, O>(
  input: Effect.Effect<R, E, I>,
  schedule: Schedule.Schedule<R, I, O>
): Fx<R, E, O> => new ProducerEffect(EffectProducer.FromScheduled(input, schedule))

export const schedule = <R, E, A, O>(
  input: Effect.Effect<R, E, A>,
  schedule: Schedule.Schedule<R, unknown, O>
): Fx<R, E, A> => new ProducerEffect(EffectProducer.Scheduled(input, schedule))

class FailCause<E> extends FxBase<never, E, never> {
  constructor(readonly i0: Cause.Cause<E>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, never>): Effect.Effect<R2, never, unknown> {
    return sink.onFailure(this.i0)
  }
}

function isFailCause<R, E, A>(fx: Fx<R, E, A>): fx is FailCause<E> {
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
    if (isProducer(fx)) {
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

function isTransformer<R, E, A>(fx: Fx<R, E, A>): fx is Transformer<R, E, A> {
  return fx.constructor === Transformer
}

class ProducerSyncTransformer<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: SyncProducer.SyncProducer<any>, readonly i1: Op.Operator) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return SyncProducer.runSink(this.i0, Op.compileOperatorSink(this.i1, sink))
  }
}

function isProducerSyncTransformer<R, E, A>(fx: Fx<R, E, A>): fx is ProducerSyncTransformer<R, E, A> {
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

class Observe<R, E, A, R2, E2, B> extends EffectBase<R | R2, E | E2, void> {
  constructor(
    readonly fx: Fx<R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, B>
  ) {
    super()
  }

  toEffect(): Effect.Effect<R | R2, E | E2, void> {
    return Effect.asyncEffect((resume) => {
      const { f, fx } = this
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
    // TODO: optimize Effect producers

    if (isProducer(fx)) {
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
  constructor(readonly fx: Fx<R, E, A>, readonly seed: B, readonly f: (acc: B, a: A) => B) {
    super()
  }

  toEffect(): Effect.Effect<R, E, B> {
    return Effect.suspend(() => {
      let acc = this.seed

      return Effect.map(
        observe(this.fx, (a) => Effect.sync(() => acc = this.f(acc, a))),
        () => acc
      )
    })
  }

  static make<R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B) {
    // TODO: optimize Effect producers

    if (isProducer(fx)) {
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
                  const newAcc = Option.match(c, { onNone: () => acc, onSome: () => f(acc, b) })
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
    } else if (isFailCause(fx)) {
      return Effect.failCause(fx.i0)
    } else {
      return new Reduce(fx, seed, f)
    }
  }
}

export const slice = <R, E, A>(fx: Fx<R, E, A>, drop: number, take: number): Fx<R, E, A> =>
  Slice.make(fx, boundsFrom(drop, take))

export const take = <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> => slice(fx, 0, n)

export const drop = <R, E, A>(fx: Fx<R, E, A>, n: number): Fx<R, E, A> => slice(fx, n, Infinity)

class Slice<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly source: Fx<R, E, A>, readonly bounds: Bounds) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return Sink.slice(sink, this.bounds, (s) => this.source.run(s))
  }

  static make<R, E, A>(fx: Fx<R, E, A>, bounds: Bounds): Fx<R, E, A> {
    if (isSlice(fx)) {
      return new Slice(fx.source, mergeBounds(fx.bounds, bounds))
    } else if (isTransformer(fx) && fx.i1._tag === "Map") {
      // Commute map and slice
      return map(Slice.make(fx.i0, bounds), fx.i1.f)
    } else {
      return new Slice(fx, bounds)
    }
  }
}

function isSlice<R, E, A>(fx: Fx<R, E, A>): fx is Slice<R, E, A> {
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

function isProducerEffectTransformer<R, E, A>(fx: Fx<R, E, A>): fx is ProducerEffectTransformer<R, E, any, R, E, A> {
  return fx.constructor === ProducerEffectTransformer
}
