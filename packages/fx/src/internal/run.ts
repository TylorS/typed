import * as Effect from "effect/Effect"

import { compileCauseEffectOperatorSink, compileEffectOperatorSink } from "@typed/fx/internal/effect-operator"
import * as helpers from "@typed/fx/internal/helpers"
import { compileSyncOperatorFailureSink, compileSyncOperatorSink } from "@typed/fx/internal/sync-operator"
import * as Sink from "@typed/fx/Sink"

import type { Fx } from "@typed/fx/Fx"
import { matchFxPrimitive } from "@typed/fx/internal/matchers"

const constUnit = () => Effect.unit

/**
 * Run an Fx to completion with the provided Sink.
 */
export function run<R, E, A, R2>(
  fx: Fx<R, E, A>,
  sink: Sink.WithContext<R2, E, A>
): Effect.Effect<R | R2, never, unknown> {
  return runFx(fx, sink)
}

const runFx = matchFxPrimitive<Effect.Effect<any, never, unknown>>({
  Empty: constUnit,
  Fail: (fx, sink) => sink.onFailure(fx.i0),
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
