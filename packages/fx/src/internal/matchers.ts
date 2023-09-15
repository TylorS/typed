import "./module-agumentation"

import * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Stream from "@effect/stream/Stream"

import type * as Sink from "@typed/fx/Sink"

import type { Fx } from "@typed/fx/Fx"
import type * as Primitive from "@typed/fx/internal/fx-primitive"
import { TypeId } from "@typed/fx/TypeId"

export function matchFxKind<R, E, A, B>(
  fx: Fx<R, E, A>,
  matchers: {
    readonly Fx: (fx: Fx<R, E, A>) => B
    readonly Effect: (effect: Effect.Effect<R, E, A>) => B
    readonly Stream: (effect: Stream.Stream<R, E, A>) => B
    readonly Cause: (cause: Cause.Cause<E>) => B
  }
): B {
  if (TypeId in fx) {
    return matchers.Fx(fx as any)
  } else if (Effect.EffectTypeId in fx) {
    return matchers.Effect(fx as any)
  } else if (Stream.StreamTypeId in fx) {
    return matchers.Stream(fx as any)
  } else if (Cause.CauseTypeId in fx) {
    return matchers.Cause(fx as any)
  } else {
    throw new TypeError(`Unknown Fx type: ${fx}`)
  }
}

export function matchFxPrimitive<B>(
  matchers: {
    readonly Empty: <R2>(fx: Primitive.Empty, sink: Sink.WithContext<R2, never, never>) => B
    readonly Fail: <E, R2>(fx: Primitive.Fail<E>, sink: Sink.WithContext<R2, E, never>) => B
    readonly FromEffect: <R, E, A, R2>(fx: Primitive.FromEffect<R, E, A>, sink: Sink.WithContext<R2, E, A>) => B
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
  return <R, E, A, R2>(fx: Fx<R, E, A>, sink: Sink.WithContext<R2, E, A>): B =>
    (matchers as any)[(fx as Primitive.Primitive)._fxTag](fx as any, sink)
}
