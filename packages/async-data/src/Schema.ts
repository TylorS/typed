/**
 * @since 1.0.0
 */

import * as Arbitrary from "@effect/schema/Arbitrary"
import * as AST from "@effect/schema/AST"
import * as Eq from "@effect/schema/Equivalence"
import * as ParseResult from "@effect/schema/ParseResult"
import * as Pretty from "@effect/schema/Pretty"
import * as Schema from "@effect/schema/Schema"
import * as AsyncData from "@typed/async-data/AsyncData"
import { Equal } from "effect"
import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as P from "./Progress.js"

const NO_DATA_PRETTY = "AsyncData.NoData"
const LOADING_PRETTY = (loading: AsyncData.Loading) =>
  Option.match(loading.progress, {
    onNone: () => `AsyncData.Loading(timestamp=${loading.timestamp})`,
    onSome: (progress) => `AsyncData.Loading(timestamp=${loading.timestamp}, progress=${P.pretty(progress)})`
  })
const FAILURE_PRETTY = <E>(print: Pretty.Pretty<Cause.Cause<E>>) => (failure: AsyncData.Failure<E>) =>
  Option.match(failure.refreshing, {
    onNone: () => `AsyncData.Failure(timestamp=${failure.timestamp}, cause=${print(failure.cause)})`,
    onSome: (loading) =>
      `AsyncData.Failure(timestamp=${failure.timestamp}, refreshing=${LOADING_PRETTY(loading)}, cause=${
        print(failure.cause)
      })`
  })
const SUCCESS_PRETTY = <A>(print: Pretty.Pretty<A>) => (success: AsyncData.Success<A>) =>
  Option.match(success.refreshing, {
    onNone: () => `AsyncData.Success(timestamp=${success.timestamp}, value=${print(success.value)})`,
    onSome: (loading) =>
      `AsyncData.Success(timestamp=${success.timestamp}, refreshing=${LOADING_PRETTY(loading)}, value=${
        print(success.value)
      })`
  })

const NoDataSchemaJson = Schema.struct({
  _tag: Schema.literal("NoData")
})
const NoDataSchema = Schema.instanceOf(AsyncData.NoData)

export const NoData = NoDataSchemaJson
  .pipe(
    Schema.transform(
      NoDataSchema,
      (): AsyncData.NoData => AsyncData.noData(),
      (): Schema.Schema.To<typeof NoDataSchemaJson> => ({
        _tag: "NoData"
      })
    ),
    Schema.annotations({
      [AST.IdentifierAnnotationId]: NO_DATA_PRETTY,
      [Pretty.PrettyHookId]: () => NO_DATA_PRETTY,
      [Arbitrary.ArbitraryHookId]: (): Arbitrary.Arbitrary<AsyncData.NoData> => (fc) => fc.constant(AsyncData.noData()),
      [Eq.EquivalenceHookId]: () => Equal.equals
    })
  )

export type NoDataFrom = Schema.Schema.From<typeof NoData>

const ProgressSchemaJson = Schema.struct({
  loaded: Schema.bigint,
  total: Schema.optional(Schema.bigint)
})
type ProgressFromTo = Schema.Schema.To<typeof ProgressSchemaJson>

const ProgressSchema: Schema.Schema<
  {
    readonly loaded: bigint
    readonly total: Option.Option<bigint>
  },
  P.Progress
> = Schema.data(Schema.struct({
  loaded: Schema.bigintFromSelf,
  total: Schema.optionFromSelf(Schema.bigintFromSelf)
}))

const progressArbitrary: Arbitrary.Arbitrary<P.Progress> = (fc) =>
  fc.bigInt().chain((loaded) => fc.option(fc.bigInt({ min: loaded })).map((total) => P.make(loaded, total)))

export const Progress = ProgressSchemaJson.pipe(
  Schema.transform(
    ProgressSchema,
    (json): P.Progress => P.make(json.loaded, json.total),
    (progress) => ({
      loaded: progress.loaded,
      total: Option.getOrUndefined(progress.total)
    })
  ),
  Schema.annotations({
    [AST.IdentifierAnnotationId]: "Progress",
    [Pretty.PrettyHookId]: () => "Progress",
    [Arbitrary.ArbitraryHookId]: (): Arbitrary.Arbitrary<P.Progress> => progressArbitrary,
    [Eq.EquivalenceHookId]: () => Equal.equals
  })
)

export type ProgressFrom = Schema.Schema.From<typeof Progress>

const LoadingSchemaJson = Schema.struct({
  _tag: Schema.literal("Loading"),
  timestamp: Schema.number,
  progress: Schema.optional(ProgressSchemaJson)
})
const LoadingSchema = Schema.instanceOf(AsyncData.Loading)

const loadingFromJson = (json: Schema.Schema.To<typeof LoadingSchemaJson>): AsyncData.Loading =>
  AsyncData.loading({ timestamp: json.timestamp, progress: progressFromJson(json.progress) })

const loadingToJson = (loading: AsyncData.Loading): Schema.Schema.To<typeof LoadingSchemaJson> => ({
  _tag: "Loading",
  timestamp: loading.timestamp,
  progress: progressToJson(loading.progress)
})

const loadingArbitrary: Arbitrary.Arbitrary<AsyncData.Loading> = (fc) =>
  fc.option(progressArbitrary(fc)).map((progress) =>
    AsyncData.loading({
      timestamp: Date.now(),
      progress: progress || undefined
    })
  )

export const Loading = LoadingSchemaJson
  .pipe(
    Schema.transform(
      LoadingSchema,
      loadingFromJson,
      loadingToJson
    ),
    Schema.annotations({
      [AST.IdentifierAnnotationId]: "AsyncData.Loading",
      [Pretty.PrettyHookId]: () => LOADING_PRETTY,
      [Arbitrary.ArbitraryHookId]: () => loadingArbitrary,
      [Eq.EquivalenceHookId]: () => Equal.equals
    })
  )

export type LoadingFrom = Schema.Schema.From<typeof Loading>

const FailureSchemaJson = <EI, E>(cause: Schema.Schema<Schema.CauseFrom<EI>, Cause.Cause<E>>) =>
  Schema.struct({
    _tag: Schema.literal("Failure"),
    cause,
    timestamp: Schema.number,
    refreshing: Schema.optional(LoadingSchemaJson)
  })

const FailureSchema = <EI, E>(
  error: Schema.Schema<EI, E>
): Schema.Schema<AsyncData.Failure<EI>, AsyncData.Failure<E>> =>
  Schema.declare(
    [Schema.cause(error)],
    Schema.struct({}),
    (isDecoding, causeSchema) => {
      const parseCause = isDecoding ? Schema.parse(causeSchema) : Schema.encode(causeSchema)

      return (input, options) => {
        return Effect.gen(function*(_) {
          if (!AsyncData.isAsyncData(input)) return yield* _(ParseResult.fail(ParseResult.forbidden(input)))

          switch (input._tag) {
            case "Failure": {
              const cause = yield* _(parseCause(input.cause, options))

              return AsyncData.failCause(cause, {
                timestamp: input.timestamp,
                refreshing: Option.getOrUndefined(input.refreshing)
              })
            }
            default:
              return yield* _(ParseResult.fail(ParseResult.forbidden(input)))
          }
        })
      }
    }
  )

export const Failure = <EI, E>(
  error: Schema.Schema<EI, E>
): Schema.Schema<
  FailureFrom<EI>,
  AsyncData.Failure<E>
> =>
  FailureSchemaJson(Schema.cause(Schema.from(error)))
    .pipe(
      Schema.transform(
        FailureSchema(error),
        (json): AsyncData.Failure<EI> =>
          AsyncData.failCause(json.cause, {
            timestamp: json.timestamp,
            refreshing: json.refreshing ? loadingFromJson(json.refreshing) : undefined
          }),
        (failure) => ({
          _tag: "Failure",
          cause: failure.cause,
          timestamp: failure.timestamp,
          refreshing: Option.getOrUndefined(Option.map(failure.refreshing, loadingToJson))
        } as const)
      ),
      Schema.annotations({
        [AST.IdentifierAnnotationId]: "AsyncData.Failure",
        [Pretty.PrettyHookId]: FAILURE_PRETTY,
        [Arbitrary.ArbitraryHookId]: <E>(
          cause: Arbitrary.Arbitrary<Cause.Cause<E>>
        ): Arbitrary.Arbitrary<AsyncData.Failure<E>> =>
        (fc) =>
          fc.option(loadingArbitrary(fc)).chain((refreshing) =>
            cause(fc).chain((cause) =>
              fc.date().map((date) =>
                AsyncData.failCause(cause, {
                  timestamp: date.getTime(),
                  refreshing: refreshing || undefined
                })
              )
            )
          ),
        [Eq.EquivalenceHookId]: () => Equal.equals
      })
    )

export type FailureFrom<E> = Schema.Schema.From<ReturnType<typeof FailureSchemaJson<E, E>>>

const SuccessSchemaJson = <AI, A>(
  value: Schema.Schema<AI, A>
): Schema.Schema<
  {
    readonly timestamp: number
    readonly _tag: "Success"
    readonly value: AI
    readonly refreshing?: {
      readonly timestamp: number
      readonly _tag: "Loading"
      readonly progress?: { readonly loaded: string; readonly total?: string | undefined } | undefined
    } | undefined
  },
  {
    readonly timestamp: number
    readonly _tag: "Success"
    readonly value: A
    readonly refreshing?: {
      readonly timestamp: number
      readonly _tag: "Loading"
      readonly progress?: { readonly loaded: bigint; readonly total?: bigint | undefined } | undefined
    } | undefined
  }
> =>
  Schema.struct({
    _tag: Schema.literal("Success"),
    value,
    timestamp: Schema.number,
    refreshing: Schema.optional(LoadingSchemaJson)
  })

const SuccessSchema = <AI, A>(
  value: Schema.Schema<AI, A>
): Schema.Schema<AsyncData.Success<AI>, AsyncData.Success<A>> =>
  Schema.declare(
    [value],
    Schema.struct({
      _tag: Schema.literal("Success"),
      timestamp: Schema.number
    }),
    (isDecoding, valueSchema) => {
      const parseValue = isDecoding ? Schema.parse(valueSchema) : Schema.encode(valueSchema)

      return (input, options) => {
        return Effect.gen(function*(_) {
          if (!AsyncData.isAsyncData(input)) return yield* _(ParseResult.fail(ParseResult.forbidden(input)))

          switch (input._tag) {
            case "Success": {
              const value = yield* _(parseValue(input.value, options))

              return AsyncData.success(value, {
                timestamp: input.timestamp,
                refreshing: Option.getOrUndefined(input.refreshing)
              })
            }
            default:
              return yield* _(ParseResult.fail(ParseResult.forbidden(input)))
          }
        })
      }
    }
  )

export const Success = <AI, A>(value: Schema.Schema<AI, A>): Schema.Schema<SuccessFrom<AI>, AsyncData.Success<A>> =>
  SuccessSchemaJson(Schema.from(value))
    .pipe(
      Schema.transform(
        SuccessSchema(value),
        (json): AsyncData.Success<AI> =>
          AsyncData.success(json.value, {
            timestamp: json.timestamp,
            refreshing: json.refreshing ? loadingFromJson(json.refreshing) : undefined
          }),
        (success) => ({
          _tag: "Success",
          value: success.value,
          timestamp: success.timestamp,
          refreshing: Option.getOrUndefined(Option.map(success.refreshing, loadingToJson))
        } as const)
      ),
      Schema.annotations({
        [AST.IdentifierAnnotationId]: "AsyncData.Success",
        [Pretty.PrettyHookId]: SUCCESS_PRETTY,
        [Arbitrary.ArbitraryHookId]: <A>(
          value: Arbitrary.Arbitrary<A>
        ): Arbitrary.Arbitrary<AsyncData.Success<A>> =>
        (fc) =>
          fc.option(loadingArbitrary(fc)).chain((refreshing) =>
            value(fc).chain((a) =>
              fc.date().map((date) =>
                AsyncData.success(a, {
                  timestamp: date.getTime(),
                  refreshing: refreshing || undefined
                })
              )
            )
          ),
        [Eq.EquivalenceHookId]: () => Equal.equals
      })
    )

export type SuccessFrom<A> = Schema.Schema.From<ReturnType<typeof SuccessSchemaJson<A, A>>>

export type AsyncDataFrom<E, A> = NoDataFrom | LoadingFrom | FailureFrom<E> | SuccessFrom<A>

export const asyncData = <EI, E, AI, A>(
  error: Schema.Schema<EI, E>,
  value: Schema.Schema<AI, A>
): Schema.Schema<AsyncDataFrom<EI, AI>, AsyncData.AsyncData<E, A>> => {
  return Schema.union(
    NoData,
    Loading,
    Failure(error),
    Success(value)
  )
}

/**
 * @since 1.0.0
 */
export const asyncDataFromSelf = <EI, E, AI, A>(
  error: Schema.Schema<EI, E>,
  value: Schema.Schema<AI, A>
): Schema.Schema<AsyncData.AsyncData<EI, AI>, AsyncData.AsyncData<E, A>> => {
  return Schema.declare(
    [Schema.cause(error), value],
    Schema.struct({}),
    (isDecoding, ...params) => {
      const [causeSchema, valueSchema] = params as readonly [
        Schema.Schema<Cause.Cause<any>, Cause.Cause<any>>,
        Schema.Schema<any, any>
      ]
      const parseCause = isDecoding ? Schema.parse(causeSchema) : Schema.encode(causeSchema)
      const parseValue = isDecoding ? Schema.parse(valueSchema) : Schema.encode(valueSchema)

      return (input, options) => {
        return Effect.gen(function*(_) {
          if (!AsyncData.isAsyncData(input)) return yield* _(ParseResult.fail(ParseResult.forbidden(input)))

          switch (input._tag) {
            case "NoData":
            case "Loading":
              return input
            case "Failure": {
              const cause = yield* _(parseCause(input.cause, options))

              return AsyncData.failCause(cause, {
                timestamp: input.timestamp,
                refreshing: Option.getOrUndefined(input.refreshing)
              })
            }
            case "Success": {
              const a = yield* _(parseValue(input.value, options))

              return AsyncData.success(a, {
                timestamp: input.timestamp,
                refreshing: Option.getOrUndefined(input.refreshing)
              })
            }
          }
        })
      }
    },
    {
      [AST.IdentifierAnnotationId]: "AsyncData",

      [Eq.EquivalenceHookId]: () => Equal.equals
    }
  )
}

function progressFromJson(json: ProgressFromTo | undefined): P.Progress | undefined {
  if (json === undefined) return
  return P.make(json.loaded, json.total)
}

function progressToJson(progres: Option.Option<P.Progress>): ProgressFromTo | undefined {
  if (Option.isNone(progres)) return
  return {
    loaded: progres.value.loaded,
    total: Option.getOrUndefined(progres.value.total)
  }
}
