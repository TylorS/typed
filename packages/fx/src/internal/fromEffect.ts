import * as Effect from "@effect/io/Effect"
import { type InternalEffect, OpCodes } from "@typed/fx/internal/internal-effect"
import * as Sink from "@typed/fx/Sink"

const defaultConversion = <R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R | Sink.Error<E> | Sink.Event<A>, never, void> =>
  Effect.flatMap(Sink.Sink<E, A>(), (sink) => Effect.matchCauseEffect(effect, sink))

const conversions: {
  [K in InternalEffect["_tag"]]: (
    effect: Extract<InternalEffect, { readonly _tag: K }>
  ) => Effect.Effect<any, never, void>
} = {
  [OpCodes.OP_ASYNC]: defaultConversion,
  [OpCodes.OP_BLOCKED]: defaultConversion,
  [OpCodes.OP_COMMIT]: defaultConversion,
  [OpCodes.OP_FAILURE]: defaultConversion,
  [OpCodes.OP_FAILURE_WITH_ANNOTATION]: defaultConversion,
  [OpCodes.OP_ON_FAILURE]: defaultConversion,
  [OpCodes.OP_ON_SUCCESS]: defaultConversion,
  [OpCodes.OP_ON_SUCCESS_AND_FAILURE]: defaultConversion,
  [OpCodes.OP_SUCCESS]: defaultConversion,
  [OpCodes.OP_SYNC]: defaultConversion,
  [OpCodes.OP_TAG]: defaultConversion,
  [OpCodes.OP_UPDATE_RUNTIME_FLAGS]: defaultConversion,
  [OpCodes.OP_WHILE]: defaultConversion,
  [OpCodes.OP_WITH_RUNTIME]: defaultConversion,
  [OpCodes.OP_YIELD]: defaultConversion,
  [OpCodes.OP_REVERT_FLAGS]: defaultConversion,
  OnStep: defaultConversion,
  RunBlocked: defaultConversion,
  Left: defaultConversion,
  Right: defaultConversion,
  None: defaultConversion,
  Some: defaultConversion
}

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Effect.Effect<R | Sink.Sink<E, A>, never, void> {
  const internal = effect as any as InternalEffect

  return (conversions[internal._tag] as any)(internal)
}
