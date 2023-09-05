import { identity } from "@effect/data/Function"
import type * as Cause from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import { type InternalEffect, OpCodes } from "@typed/fx/internal/internal-effect"
import * as Sink from "@typed/fx/Sink"

const runEffect = <R, E, A, R2, R3>(
  effect: Effect.Effect<R, E, A>,
  onFailure: (e: Cause.Cause<E>) => Effect.Effect<R2, never, void>,
  onSuccess: (a: A) => Effect.Effect<R3, never, void>
): Effect.Effect<R | R2 | R3, never, void> =>
  Effect.matchCauseEffect(effect, {
    onFailure,
    onSuccess
  })

const defaultConversion = <R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R | Sink.Error<E> | Sink.Event<A>, never, void> =>
  Sink.Sink<E, A>().withEffect((s) => runEffect(effect, s.error.onFailure, s.event.onSuccess))

// TODO: Explore conversions to more efficient operations
// TODO: Should we separate continutations from producers?

const conversions: {
  [K in InternalEffect["_tag"]]: (
    effect: Extract<InternalEffect, { readonly _tag: K }>
  ) => Effect.Effect<any, never, void>
} = {
  [OpCodes.OP_ASYNC]: (async) => Effect.async((cb) => async.i0((prim) => cb(fromEffect(prim))), async.i1),
  [OpCodes.OP_BLOCKED]: defaultConversion,
  [OpCodes.OP_COMMIT]: (commit) => fromEffect(commit.commit()),
  [OpCodes.OP_FAILURE_WITH_ANNOTATION]: defaultConversion,
  [OpCodes.OP_FAILURE]: (effect) => Sink.failCause(effect.i0),
  [OpCodes.OP_ON_FAILURE]: (effect) => runEffect(effect.i0, (cause) => fromEffect(effect.i1(cause)), Sink.event),
  [OpCodes.OP_ON_STEP]: defaultConversion, // What kinds of things can we do with batching?
  [OpCodes.OP_ON_SUCCESS_AND_FAILURE]: (effect) =>
    runEffect(effect.i0, (cause) => fromEffect(effect.i1(cause)), (a) => fromEffect(effect.i2(a))),
  [OpCodes.OP_ON_SUCCESS]: (effect) => runEffect(effect.i0, Sink.failCause, (a) => fromEffect(effect.i1(a))),
  [OpCodes.OP_REVERT_FLAGS]: defaultConversion,
  [OpCodes.OP_RUN_BLOCKED]: defaultConversion,
  [OpCodes.OP_SUCCESS]: (effect) => Sink.event(effect.i0),
  [OpCodes.OP_SYNC]: defaultConversion,
  [OpCodes.OP_TAG]: defaultConversion,
  [OpCodes.OP_UPDATE_RUNTIME_FLAGS]: defaultConversion,
  [OpCodes.OP_WHILE]: defaultConversion,
  [OpCodes.OP_WITH_RUNTIME]: defaultConversion,
  [OpCodes.OP_YIELD]: identity,
  // Either
  Left: (left) => Sink.failCause(left.left),
  Right: (right) => Sink.event(right.right),
  // Option
  None: () => Effect.unit,
  Some: (some) => Sink.event(some.value)
}

export function fromEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R | Sink.Sink<E, A>, never, unknown> {
  const internal = effect as any as InternalEffect
  const convert = conversions[internal._tag] || defaultConversion

  return convert(internal as any)
}
