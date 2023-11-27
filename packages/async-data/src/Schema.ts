/**
 * @since 1.0.0
 */

import * as Arbitrary from "@effect/schema/Arbitrary"
import * as AST from "@effect/schema/AST"
import * as ParseResult from "@effect/schema/ParseResult"
import * as Pretty from "@effect/schema/Pretty"
import * as Schema from "@effect/schema/Schema"
import * as AsyncData from "@typed/async-data/AsyncData"
import { Cause, Chunk, Effect, FiberId, HashSet } from "effect"
import * as Option from "effect/Option"

const fiberIdArbitrary: Arbitrary.Arbitrary<FiberId.FiberId> = (fc) =>
  fc.oneof(
    fc.constant(FiberId.none),
    fc.integer().chain((i) => fc.date().map((date) => FiberId.make(i, date.getTime() / 1000)))
  )

const causeFromItems = <A>(
  items: Array<A>,
  join: (first: Cause.Cause<A>, second: Cause.Cause<A>) => Cause.Cause<A>
) => {
  if (items.length === 0) return Cause.empty
  if (items.length === 1) return Cause.fail(items[0])
  return items.map(Cause.fail).reduce(join)
}

const causeArbitrary = <A>(item: Arbitrary.Arbitrary<A>): Arbitrary.Arbitrary<Cause.Cause<A>> => (fc) =>
  fc.oneof(
    fc.constant(Cause.empty),
    fc.anything().map(Cause.die),
    fiberIdArbitrary(fc).map((id) => Cause.interrupt(id)),
    fc.array(item(fc)).chain((items) =>
      fc.integer({ min: 0, max: 1 }).map((i) => causeFromItems(items, i > 0.5 ? Cause.sequential : Cause.parallel))
    )
  )

const causePretty = <A>(): Pretty.Pretty<Cause.Cause<A>> => Cause.pretty

/**
 * @since 1.0.0
 */
export const cause = <EI, E>(error: Schema.Schema<EI, E>): Schema.Schema<Cause.Cause<EI>, Cause.Cause<E>> => {
  const parseE = Schema.parse(Schema.chunkFromSelf(error))

  const self: Schema.Schema<Cause.Cause<EI>, Cause.Cause<E>> = Schema.lazy(() =>
    Schema.declare(
      [error],
      Schema.struct({}),
      () => (input, options) =>
        Effect.gen(function*(_) {
          if (!Cause.isCause(input)) return yield* _(ParseResult.failure(ParseResult.unexpected(input)))

          let output: Cause.Cause<E> = Cause.empty
          for (const cause of Cause.linearize<E>(input)) {
            const parrallelCauses = Cause.linearize(cause)

            if (HashSet.size(parrallelCauses) === 1) {
              const failures = Cause.failures(cause)

              output = Cause.parallel(
                output,
                Chunk.isEmpty(failures) ? cause : Chunk.reduce(
                  yield* _(parseE(failures, options)),
                  Cause.empty as Cause.Cause<E>,
                  (cause, e) => Cause.sequential(cause, Cause.fail(e))
                )
              )
            } else {
              output = Cause.parallel(
                output,
                yield* _(Schema.parse(self)(cause, options))
              )
            }
          }

          return output
        }),
      {
        [AST.IdentifierAnnotationId]: "Cause",
        [Arbitrary.ArbitraryHookId]: causePretty,
        [Pretty.PrettyHookId]: causeArbitrary
      }
    )
  )

  return self
}

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
    [cause(error), value],
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
          if (!AsyncData.isAsyncData<EI, AI>(input)) return yield* _(ParseResult.failure(ParseResult.unexpected(input)))

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
