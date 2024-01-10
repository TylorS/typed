/**
 * @since 1.0.0
 */

import * as Arbitrary from "@effect/schema/Arbitrary"
import * as AST from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"
import * as Pretty from "@effect/schema/Pretty"
import * as Schema from "@effect/schema/Schema"
import * as AsyncData from "@typed/async-data/AsyncData"
import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

const asyncDataPretty = <E, A>(
  prettyCause: Pretty.Pretty<Cause.Cause<E>>,
  prettyValue: Pretty.Pretty<A>
): Pretty.Pretty<AsyncData.AsyncData<E, A>> =>
  AsyncData.match({
    NoData: () => `AsyncData.NoData`,
    Loading: () => `AsyncData.Loading`,
    Failure: (cause, data) =>
      `AsyncData.Failure(refreshing=${Option.isSome(data.refreshing)}, cause=${prettyCause(cause)})`,
    Success: (value, data) =>
      `AsyncData.Success(refreshing=${Option.isSome(data.refreshing)}, value=${prettyValue(value)})`
  })

const asyncDataArbitrary = <E, A>(
  causeArbitrary: Arbitrary.Arbitrary<Cause.Cause<E>>,
  valueArbitrary: Arbitrary.Arbitrary<A>
): Arbitrary.Arbitrary<AsyncData.AsyncData<E, A>> =>
(fc) =>
  fc.oneof(
    fc.constant(AsyncData.noData()),
    fc.constant(AsyncData.loading()),
    causeArbitrary(fc).map((cause) => AsyncData.failCause(cause)),
    valueArbitrary(fc).map((a) => AsyncData.success(a))
  )

/**
 * @since 1.0.0
 */
export const asyncData = <EI, E, AI, A>(
  error: Schema.Schema<EI, E>,
  value: Schema.Schema<AI, A>
): Schema.Schema<AsyncData.AsyncData<EI, AI>, AsyncData.AsyncData<E, A>> => {
  return Schema.declare(
    [Schema.cause(error), value],
    Schema.struct({}),
    (_, ...params) => {
      const [causeSchema, valueSchema] = params as readonly [
        Schema.Schema<Cause.Cause<EI>, Cause.Cause<E>>,
        Schema.Schema<AI, A>
      ]
      const parseCause = Schema.parse(causeSchema)
      const parseValue = Schema.parse(valueSchema)

      return (input, options) => {
        return Effect.gen(function*(_) {
          if (!AsyncData.isAsyncData<EI, AI>(input)) return yield* _(ParseResult.fail(ParseResult.forbidden(input)))

          switch (input._tag) {
            case "NoData":
            case "Loading":
              return input
            case "Failure": {
              const cause = yield* _(parseCause(input.cause, options))

              return AsyncData.failCause(cause, {
                refreshing: Option.getOrUndefined(input.refreshing)
              })
            }
            case "Success": {
              const a = yield* _(parseValue(input.value, options))

              return AsyncData.success(a, {
                refreshing: Option.getOrUndefined(input.refreshing)
              })
            }
          }
        })
      }
    },
    {
      [AST.IdentifierAnnotationId]: "AsyncData",
      [Arbitrary.ArbitraryHookId]: asyncDataPretty,
      [Pretty.PrettyHookId]: asyncDataArbitrary
    }
  )
}
