import { Cause, Effect, Option } from "effect"
import * as Sink from "../Sink"
import { EffectBase, FxBase } from "./protos"

import type { Predicate } from "effect"
import type { Fx } from "../Fx"
import * as SyncOp from "./sync-operator"

class Success<A> extends FxBase<never, never, A> {
  constructor(readonly i0: A) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, unknown> {
    return sink.onSuccess(this.i0)
  }
}

export const success = <A>(value: A): Fx<never, never, A> => new Success(value)

class FailCause<E> extends FxBase<never, E, never> {
  constructor(readonly i0: Cause.Cause<E>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, never>): Effect.Effect<R2, never, unknown> {
    return sink.onFailure(this.i0)
  }
}

export const failCause = <E>(cause: Cause.Cause<E>): Fx<never, E, never> => new FailCause(cause)

export const fail = <E>(error: E): Fx<never, E, never> => new FailCause(Cause.fail(error))

export const die = (error: unknown): Fx<never, never, never> => new FailCause(Cause.die(error))

class SyncTransformer<R, E, A> extends FxBase<R, E, A> {
  constructor(readonly i0: Fx<R, E, any>, readonly i1: SyncOp.SyncOperator) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2, never, unknown> {
    return this.i0.run(SyncOp.compileSyncOperatorSink(this.i1, sink))
  }

  static make<R, E, A, B>(fx: Fx<R, E, A>, operator: SyncOp.SyncOperator): Fx<R, E, B> {
    if (fx instanceof SyncTransformer) {
      return new SyncTransformer(fx.i0, SyncOp.fuseSyncOperators(fx.i1, operator))
    } else if (fx instanceof FromArray) {
      return new FromArraySyncTransform(fx.i0, operator)
    } else if (fx instanceof FromArraySyncTransform) {
      return new FromArraySyncTransform(fx.i0, SyncOp.fuseSyncOperators(fx.i1, operator))
    } else {
      return new SyncTransformer<R, E, B>(fx, operator)
    }
  }
}

export const map = <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> => SyncTransformer.make(fx, SyncOp.Map(f))

export const filter = <R, E, A>(fx: Fx<R, E, A>, f: Predicate.Predicate<A>): Fx<R, E, A> =>
  SyncTransformer.make(fx, SyncOp.Filter(f))

export const filterMap = <R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> =>
  SyncTransformer.make(fx, SyncOp.Map(f))

class FromArray<A> extends FxBase<never, never, A> {
  constructor(readonly i0: ReadonlyArray<A>) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, unknown> {
    return arrayToSink(this.i0, sink)
  }
}

function arrayToSink<A, R2>(array: ReadonlyArray<A>, sink: Sink.Sink<R2, never, A>): Effect.Effect<R2, never, unknown> {
  if (array.length === 0) return Effect.unit
  else if (array.length === 1) return sink.onSuccess(array[0])
  else {
    const [first, ...rest] = array
    let effect = sink.onSuccess(first)
    for (const item of rest) {
      effect = Effect.zipRight(effect, sink.onSuccess(item))
    }
    return effect
  }
}

export const fromArray = <const A extends ReadonlyArray<any>>(array: A): Fx<never, never, A[number]> =>
  new FromArray<A[number]>(array)

class FromArraySyncTransform<A, B> extends FxBase<never, never, B> {
  constructor(readonly i0: ReadonlyArray<A>, readonly i1: SyncOp.SyncOperator) {
    super()
  }

  run<R2>(sink: Sink.Sink<R2, never, B>): Effect.Effect<R2, never, unknown> {
    return arrayToSink(SyncOp.applyArray<A, B>(this.i0, this.i1), sink)
  }
}

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
        fx.run(Sink.make(onFailure, (a) =>
          Effect.matchCauseEffect(f(a), {
            onFailure,
            onSuccess: () => Effect.unit
          }))),
        Effect.sync(() => resume(Effect.unit))
      )
    })
  }
}

export const observe = <R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Effect.Effect<R | R2, E | E2, void> => new Observe(fx, f)

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
    if (fx instanceof FromArraySyncTransform) {
      const reducer = SyncOp.compileSyncReducer(fx.i1, f)
      return lazyOnce(() => reduceFilterArray(fx.i0, seed, reducer))
    } else {
      return new Reduce(fx, seed, f)
    }
  }
}

function reduceFilterArray<A, B>(
  iterable: ReadonlyArray<A>,
  seed: B,
  f: (acc: B, a: A) => Option.Option<B>
): B {
  const length = iterable.length
  let acc = seed,
    option: Option.Option<B> = Option.none(),
    i = 0

  while (i < length) {
    option = f(acc, iterable[i])
    if (Option.isSome(option)) {
      acc = option.value
    }
    ;++i
  }

  return acc
}

const lazyOnce = <A>(f: () => A): Effect.Effect<never, never, A> => {
  let memoized: Option.Option<A> = Option.none()
  const get = () => {
    if (Option.isSome(memoized)) {
      return memoized.value
    } else {
      const a = f()
      memoized = Option.some(a)
      return a
    }
  }

  return Effect.sync(get)
}

export const reduce = <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B> =>
  Reduce.make(fx, seed, f)
