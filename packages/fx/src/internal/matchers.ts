import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as TypeId from "../TypeId.js"

import type * as Sink from "../Sink.js"

import type { Fx, FxInput } from "../Fx.js"
import type { RefSubject } from "../RefSubject.js"
import type * as Primitive from "./fx-primitive.js"

export function matchFxPrimitive<B>(
  matchers: {
    readonly Empty: <R2>(fx: Primitive.Empty, sink: Sink.WithContext<R2, never, never>) => B
    readonly Fail: <E, R2>(fx: Primitive.Fail<E>, sink: Sink.WithContext<R2, E, never>) => B
    readonly FromIterable: <A, R2>(fx: Primitive.FromIterable<A>, sink: Sink.WithContext<R2, never, A>) => B
    readonly FromSink: <R, E, A, R2>(fx: Primitive.FromSink<R, E, A>, sink: Sink.WithContext<R2, E, A>) => B
    readonly Never: <R2>(fx: Primitive.Never, sink: Sink.WithContext<R2, never, never>) => B
    readonly Succeed: <A, R2>(fx: Primitive.Succeed<A>, sink: Sink.WithContext<R2, never, A>) => B
    readonly Suspend: <R, E, A, R2>(fx: Primitive.Suspend<R, E, A>, sink: Sink.WithContext<R2, E, A>) => B
    readonly Sync: <A, R2>(fx: Primitive.Sync<A>, sink: Sink.WithContext<R2, never, A>) => B
    readonly ToFx: <R, E, A, R2>(fx: Primitive.ToFx<R, E, A>, sink: Sink.WithContext<R2, E, A>) => B
    readonly WithEarlyExit: <R, E, A, R2>(fx: Primitive.WithEarlyExit<R, E, A>, sink: Sink.WithContext<R2, E, A>) => B
    readonly WithScopedFork: <R, E, A, R2>(
      fx: Primitive.WithScopedFork<R, E, A>,
      sink: Sink.WithContext<R2, E, A>
    ) => B
    readonly WithFlattenStrategy: <R, E, A, R2>(
      fx: Primitive.WithFlattenStrategy<R, E, A>,
      sink: Sink.WithContext<R2, E, A>
    ) => B
    readonly Transformer: <R, E, A, R2>(fx: Primitive.Transformer<R, E, A>, sink: Sink.WithContext<R2, E, A>) => B
    readonly TransformerEffect: <R, E, A, R2>(
      fx: Primitive.TransformerEffect<R, E, A>,
      sink: Sink.WithContext<R2, E, A>
    ) => B
    readonly TransformerCause: <R, E, A, R2>(
      fx: Primitive.TransformerCause<R, E, A>,
      sink: Sink.WithContext<R2, E, A>
    ) => B
    readonly TransformerCauseEffect: <R, E, A, R2>(
      fx: Primitive.TransformerCauseEffect<R, E, A>,
      sink: Sink.WithContext<R2, E, A>
    ) => B
  }
) {
  return <R, E, A, R2>(fx: Fx<R, E, A>, sink: Sink.WithContext<R2, E, A>): B => {
    return (matchers as any)[(fx as Primitive.Primitive)._fxTag](fx as any, sink)
  }
}

export function matchFxInput<R, E, A, B>(fx: FxInput<R, E, A>, matchers: {
  RefSubject: (fx: RefSubject<R, E, A>) => B
  Fx: (fx: Fx<R, E, A>) => B
  Effect: (effect: Effect.Effect<R, E, A>) => B
  Cause: (cause: Cause.Cause<E>) => B
  Iterable: (iterable: Iterable<A>) => B
  Otherwise: (value: A) => B
}): B {
  const type = typeof fx
  if (!fx || !(type === "object" || type === "function")) return matchers.Otherwise(fx as A)
  else if (isRefSubject(fx)) return matchers.RefSubject(fx)
  else if (isFx(fx)) return matchers.Fx(fx)
  else if (isEffect(fx)) return matchers.Effect(fx)
  else if (isCause(fx)) return matchers.Cause(fx)
  else if (Symbol.iterator in fx) return matchers.Iterable(fx)
  else return matchers.Otherwise(fx as A)
}

function isFx<R, E, A>(input: FxInput<R, E, A>): input is Fx<R, E, A> {
  return TypeId.TypeId in input
}

function isRefSubject<R, E, A>(input: FxInput<R, E, A>): input is RefSubject<R, E, A> {
  return TypeId.RefSubjectTypeId in input
}

function isEffect<R, E, A>(input: FxInput<R, E, A>): input is Effect.Effect<R, E, A> {
  return Effect.EffectTypeId in input
}

function isCause<R, E, A>(input: FxInput<R, E, A>): input is Cause.Cause<E> {
  return Cause.CauseTypeId in input
}
