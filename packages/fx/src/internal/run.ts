import "./module-agumentation"

import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as StreamSink from "effect/Sink"
import * as Stream from "effect/Stream"

import { compileCauseEffectOperatorSink, compileEffectOperatorSink } from "@typed/fx/internal/effect-operator"
import * as helpers from "@typed/fx/internal/helpers"
import { compileSyncOperatorFailureSink, compileSyncOperatorSink } from "@typed/fx/internal/sync-operator"
import * as Sink from "@typed/fx/Sink"

import type { Fx } from "@typed/fx/Fx"
import { matchEffectPrimitive } from "@typed/fx/internal/effect-primitive"
import type { InternalEffect } from "@typed/fx/internal/effect-primitive"
import { matchFxKind, matchFxPrimitive } from "@typed/fx/internal/matchers"

const constUnit = () => Effect.unit

/**
 * Run an Fx to completion with the provided Sink.
 */
export function run<R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return matchFxKind(fx, {
    Fx: (fx) => runFx<R, E, A, R2>(fx, sink),
    Effect: (effect) => runEffect<R, E, A, R2>(effect, sink),
    Stream: (stream) => runStream(stream, sink),
    Cause: (cause) => sink.onFailure(cause)
  })
}

const runFx = matchFxPrimitive<Effect.Effect<any, never, unknown>>({
  Empty: constUnit,
  Fail: (fx, sink) => sink.onFailure(fx.i0),
  FromEffect: (fx, sink) => runEffect(fx.i0, sink),
  FromIterable: (fx, sink) => Effect.forEach(fx.i0, sink.onSuccess),
  FromSink: (fx, sink) => Effect.contextWithEffect((ctx) => fx.i0(Sink.provide(sink, ctx))),
  Never: () => Effect.never,
  Succeed: (fx, sink) => sink.onSuccess(fx.i0),
  Suspend: (fx, sink) => Effect.suspend(() => run(fx.i0(), sink)),
  Sync: (fx, sink) => Effect.suspend(() => sink.onSuccess(fx.i0())),
  ToFx: ({ fx }, sink) => run(fx, sink),
  WithEarlyExit: (fx, sink) =>
    Effect.contextWithEffect((ctx) =>
      helpers.withScopedFork((fork, scope) =>
        helpers.withEarlyExit(Sink.provide(sink, ctx), (sink) => fx.i0({ sink, fork, scope }))
      )
    ),
  WithScopedFork: (fx, sink) =>
    Effect.contextWithEffect((ctx) =>
      helpers.withScopedFork((fork, scope) => fx.i0({ sink: Sink.provide(sink, ctx), fork, scope }))
    ),
  WithFlattenStrategy: (fx, sink) =>
    Effect.contextWithEffect((ctx) =>
      helpers.withFlattenStrategy(fx.i1)((fork, scope) => fx.i0({ sink: Sink.provide(sink, ctx), fork, scope }))
    ),
  Transformer: (fx, sink) => run(fx.i0, compileSyncOperatorSink(fx.i1, sink)),
  TransformerEffect: (fx, sink) => run(fx.i0, compileEffectOperatorSink(fx.i1, sink)),
  TransformerCause: (fx, sink) => run(fx.i0, compileSyncOperatorFailureSink(fx.i1, sink)),
  TransformerCauseEffect: (fx, sink) => run(fx.i0, compileCauseEffectOperatorSink(fx.i1, sink))
})

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

function runStream<R, E, A, R2>(
  stream: Stream.Stream<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return Effect.catchAllCause(Stream.run(stream, StreamSink.forEach(sink.onSuccess)), sink.onFailure)
}
