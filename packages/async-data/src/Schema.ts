/**
 * @since 1.0.0
 */

import * as Arbitrary from "@effect/schema/Arbitrary"
import * as AST from "@effect/schema/AST"
import * as Eq from "@effect/schema/Equivalence"
import * as ParseResult from "@effect/schema/ParseResult"
import * as Pretty from "@effect/schema/Pretty"
import * as Schema from "@effect/schema/Schema"
import { Data, Equal, FiberId } from "effect"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { hasProperty } from "effect/Predicate"
import * as _AsyncData from "./AsyncData.js"
import * as P from "./Progress.js"

const NO_DATA_PRETTY = "AsyncData.NoData"
const LOADING_PRETTY = (loading: _AsyncData.Loading) =>
  Option.match(loading.progress, {
    onNone: () => `AsyncData.Loading(timestamp=${loading.timestamp})`,
    onSome: (progress) => `AsyncData.Loading(timestamp=${loading.timestamp}, progress=${P.pretty(progress)})`
  })
const FAILURE_PRETTY = <E>(print: Pretty.Pretty<Cause.Cause<E>>) => (failure: _AsyncData.Failure<E>) =>
  Option.match(failure.refreshing, {
    onNone: () => `AsyncData.Failure(timestamp=${failure.timestamp}, cause=${print(failure.cause)})`,
    onSome: () => `AsyncData.Failure(timestamp=${failure.timestamp}, refreshing=true, cause=${print(failure.cause)})`
  })
const SUCCESS_PRETTY = <A>(print: Pretty.Pretty<A>) => (success: _AsyncData.Success<A>) =>
  Option.match(success.refreshing, {
    onNone: () => `AsyncData.Success(timestamp=${success.timestamp}, value=${print(success.value)})`,
    onSome: () => `AsyncData.Success(timestamp=${success.timestamp}, refreshing=true, value=${print(success.value)})`
  })

const OPTIMISTIC_PRETTY =
  <E, A>(printValue: Pretty.Pretty<A>, printError: Pretty.Pretty<Cause.Cause<E>>) =>
  (optimistic: _AsyncData.Optimistic<A, E>) =>
    `AsyncData.Optimistic(timestamp=${optimistic.timestamp}, value=${printValue(optimistic.value)}, previous=${
      asyncDataPretty(printValue, printError)(optimistic.previous)
    })`

/**
 * @since 1.0.0
 */
export type NoDataFrom = { readonly _tag: "NoData" }

const ProgressSchemaJson = Schema.Struct({
  loaded: Schema.BigInt,
  total: Schema.optional(Schema.BigInt)
})

const ProgressSchema: Schema.Schema<
  P.Progress,
  {
    readonly loaded: bigint
    readonly total: Option.Option<bigint>
  }
> = Schema.Data(Schema.Struct({
  loaded: Schema.BigIntFromSelf,
  total: Schema.OptionFromSelf(Schema.BigIntFromSelf)
}))

const progressArbitrary: Arbitrary.LazyArbitrary<P.Progress> = (fc) =>
  fc.bigInt().chain((loaded) => fc.option(fc.bigInt({ min: loaded })).map((total) => P.make(loaded, total)))

/**
 * @since 1.0.0
 */
export const Progress: Schema.Schema<
  P.Progress,
  { readonly loaded: string; readonly total?: string | undefined }
> = ProgressSchemaJson.pipe(
  Schema.transform(
    ProgressSchema,
    {
      decode: (json): P.Progress => P.make(json.loaded, json.total),
      encode: (progress) => ({
        loaded: progress.loaded,
        total: Option.getOrUndefined(progress.total)
      })
    }
  ),
  Schema.annotations({
    [AST.IdentifierAnnotationId]: "Progress",
    [Pretty.PrettyHookId]: () => "Progress",
    [Arbitrary.ArbitraryHookId]: (): Arbitrary.LazyArbitrary<P.Progress> => progressArbitrary,
    [Eq.EquivalenceHookId]: () => Equal.equals
  })
)

/**
 * @since 1.0.0
 */
export type ProgressFrom = {
  readonly loaded: string
  readonly total?: string | undefined
}

const loadingArbitrary: Arbitrary.LazyArbitrary<_AsyncData.Loading> = (fc) =>
  fc.option(progressArbitrary(fc)).map((progress) =>
    _AsyncData.loading({
      timestamp: Date.now(),
      progress: progress || undefined
    })
  )

/**
 * @since 1.0.0
 */
export type LoadingFrom = {
  readonly _tag: "Loading"
  readonly timestamp: number
  readonly progress?: ProgressFrom | undefined
}

const failureArbitrary = <E>(
  cause: Arbitrary.LazyArbitrary<Cause.Cause<E>>
): Arbitrary.LazyArbitrary<_AsyncData.Failure<E>> =>
(fc) =>
  fc.option(loadingArbitrary(fc)).chain((refreshing) =>
    cause(fc).chain((cause) =>
      fc.date().map((date) =>
        _AsyncData.failCause(cause, {
          timestamp: date.getTime(),
          refreshing: refreshing || undefined
        })
      )
    )
  )

/**
 * @since 1.0.0
 */
export type FailureFrom<E> = {
  readonly _tag: "Failure"
  readonly cause: Schema.CauseEncoded<E>
  readonly timestamp: number
  readonly refreshing?: LoadingFrom | undefined
}

const FailureFrom = <E>(cause: Schema.CauseEncoded<E>, timestamp: number, refreshing?: LoadingFrom): FailureFrom<E> => {
  const base = {
    _tag: "Failure",
    cause,
    timestamp
  } as const

  if (refreshing !== undefined) {
    return { ...base, refreshing }
  }

  return base
}

const successArbitrary = <A>(
  value: Arbitrary.LazyArbitrary<A>
): Arbitrary.LazyArbitrary<_AsyncData.Success<A>> =>
(fc) =>
  fc.option(loadingArbitrary(fc)).chain((refreshing) =>
    value(fc).chain((a) =>
      fc.date().map((date) =>
        _AsyncData.success(a, {
          timestamp: date.getTime(),
          refreshing: refreshing || undefined
        })
      )
    )
  )

/**
 * @since 1.0.0
 */
export type SuccessFrom<A> = {
  readonly timestamp: number
  readonly _tag: "Success"
  readonly value: A
  readonly refreshing?: LoadingFrom | undefined
}

const SuccessFrom = <A>(value: A, timestamp: number, refreshing?: LoadingFrom): SuccessFrom<A> => {
  const base = {
    _tag: "Success",
    value,
    timestamp
  } as const

  if (refreshing !== undefined) {
    return { ...base, refreshing }
  }

  return base
}

/**
 * @since 1.0.0
 */
export type OptimisticFrom<A, E> = {
  readonly timestamp: number
  readonly _tag: "Optimistic"
  readonly value: A
  readonly previous: AsyncDataFrom<A, E>
}

const OptimisticFrom = <A, E>(value: A, timestamp: number, previous: AsyncDataFrom<A, E>): OptimisticFrom<A, E> => ({
  _tag: "Optimistic",
  value,
  timestamp,
  previous
})

const optimisticArbitrary = <A, E>(
  valueArb: Arbitrary.LazyArbitrary<A>,
  causeArb: Arbitrary.LazyArbitrary<Cause.Cause<E>>
): Arbitrary.LazyArbitrary<_AsyncData.Optimistic<A, E>> =>
(fc) =>
  asyncDataArbitrary(valueArb, causeArb)(fc).chain((previous) =>
    valueArb(fc).chain((value) =>
      fc.date().map((date) => _AsyncData.optimistic(previous, value, { timestamp: date.getTime() }))
    )
  )

/**
 * @since 1.0.0
 */
export type AsyncDataFrom<A, E> = NoDataFrom | LoadingFrom | FailureFrom<E> | SuccessFrom<A> | OptimisticFrom<A, E>

const fromEq = (a: AsyncDataFrom<any, any>, b: AsyncDataFrom<any, any>): boolean => {
  if (a._tag !== b._tag) return false

  switch (a._tag) {
    case "NoData":
      return true
    case "Loading": {
      const loadingB = b as LoadingFrom

      if (a.timestamp !== loadingB.timestamp) return false

      if (a.progress === undefined && loadingB.progress === undefined) return true
      if (a.progress === undefined || loadingB.progress === undefined) return false

      return Equal.equals(Data.struct(a.progress), Data.struct(loadingB.progress))
    }
    case "Failure": {
      const failureB = b as FailureFrom<any>

      if (
        !(
          Equal.equals(Data.struct(a.cause), Data.struct(failureB.cause)) && a.timestamp === failureB.timestamp
        )
      ) return false

      if (a.refreshing === undefined && failureB.refreshing === undefined) return true
      if (a.refreshing === undefined || failureB.refreshing === undefined) return false

      return Equal.equals(Data.struct(a.refreshing), Data.struct(failureB.refreshing))
    }
    case "Success": {
      const successB = b as SuccessFrom<any>
      return Equal.equals(a.value, successB.value) &&
        a.timestamp === successB.timestamp &&
        Equal.equals(a.refreshing, successB.refreshing)
    }
    case "Optimistic": {
      const optimisticB = b as OptimisticFrom<any, any>
      return Equal.equals(a.value, optimisticB.value) &&
        a.timestamp === optimisticB.timestamp &&
        fromEq(a.previous, optimisticB.previous)
    }
  }
}

function isNoDataFrom(value: unknown): value is NoDataFrom {
  return hasProperty(value, "_tag") && value._tag === "NoData"
}

function isProgressFrom(value: unknown): value is ProgressFrom {
  if (!(hasProperty(value, "loaded") && typeof value.loaded === "string")) return false

  if (hasProperty(value, "total")) {
    if (typeof value.total !== "string") return false
  }

  return true
}

function isLoadingFrom(value: unknown): value is LoadingFrom {
  return hasProperty(value, "_tag")
    && value._tag === "Loading"
    && hasProperty(value, "timestamp")
    && typeof value.timestamp === "number"
    && (hasProperty(value, "progress") ? isProgressFrom(value.progress) : true)
}

const isCauseEncoded = Schema.is(Schema.encodedSchema(Schema.Cause({ defect: Schema.Unknown, error: Schema.Unknown })))

function isFailureFrom(value: unknown): value is FailureFrom<any> {
  return hasProperty(value, "_tag")
    && value._tag === "Failure"
    && hasProperty(value, "cause")
    && isCauseEncoded(value.cause)
    && hasProperty(value, "timestamp")
    && typeof value.timestamp === "number"
    && (hasProperty(value, "refreshing") ? value.refreshing === undefined || isLoadingFrom(value.refreshing) : true)
}

function isSuccessFrom(value: unknown): value is SuccessFrom<any> {
  return hasProperty(value, "_tag")
    && value._tag === "Success"
    && hasProperty(value, "value")
    && hasProperty(value, "timestamp")
    && typeof value.timestamp === "number"
    && (hasProperty(value, "refreshing") ? value.refreshing === undefined || isLoadingFrom(value.refreshing) : true)
}

function isOptimisticFrom(value: unknown): value is OptimisticFrom<any, any> {
  return hasProperty(value, "_tag")
    && value._tag === "Optimistic"
    && hasProperty(value, "value")
    && hasProperty(value, "previous")
    && isAsyncDataFrom(value.previous)
    && hasProperty(value, "timestamp")
    && typeof value.timestamp === "number"
}

function isAsyncDataFrom<A = unknown, E = unknown>(value: unknown): value is AsyncDataFrom<A, E> {
  return isNoDataFrom(value)
    || isLoadingFrom(value)
    || isFailureFrom(value)
    || isSuccessFrom(value)
    || isOptimisticFrom(value)
}

/**
 * @since 1.0.0
 */
export const asyncDataFromJson = <A, AI, R1, E, EI, R2>(
  value: Schema.Schema<A, AI, R1>,
  error: Schema.Schema<E, EI, R2>
): Schema.Schema<AsyncDataFrom<A, E>, AsyncDataFrom<AI, EI>, R1 | R2> => {
  const schema = Schema.declare(
    [value, Schema.Cause({ error, defect: Schema.Unknown })],
    {
      decode: (valueSchema, causeSchema) => {
        const parseCause = ParseResult.decode(causeSchema)
        const parseValue = ParseResult.decode(valueSchema)

        const parseAsyncData = (
          input: unknown,
          options?: AST.ParseOptions | undefined
        ): Effect.Effect<
          AsyncDataFrom<A, E>,
          ParseResult.ParseIssue,
          never
        > => {
          return Effect.gen(function*() {
            if (!isAsyncDataFrom<AI, EI>(input)) {
              return yield* Effect.fail<ParseResult.ParseIssue>(new ParseResult.Forbidden(schema.ast, input))
            }

            switch (input._tag) {
              case "NoData":
              case "Loading":
                return input
              case "Failure": {
                const cause = yield* parseCause(input.cause, options)
                return FailureFrom(cause, input.timestamp, input.refreshing)
              }
              case "Success": {
                const a = yield* parseValue(input.value, options)
                return SuccessFrom(a, input.timestamp, input.refreshing)
              }
              case "Optimistic": {
                const previous = yield* parseAsyncData(input.previous, options)
                const value = yield* parseValue(input.value, options)
                return OptimisticFrom(value, input.timestamp, previous)
              }
            }
          })
        }

        return parseAsyncData
      },
      encode: (valueSchema, causeSchema) => {
        const parseCause = ParseResult.encode(causeSchema)
        const parseValue = ParseResult.encode(valueSchema)

        const parseAsyncData = (
          input: unknown,
          options?: AST.ParseOptions
        ): Effect.Effect<
          AsyncDataFrom<AI, EI>,
          ParseResult.ParseIssue,
          never
        > => {
          return Effect.gen(function*() {
            if (!isAsyncDataFrom<A, E>(input)) {
              return yield* Effect.fail<ParseResult.ParseIssue>(new ParseResult.Forbidden(schema.ast, input))
            }

            switch (input._tag) {
              case "NoData":
              case "Loading":
                return input
              case "Failure": {
                const cause = yield* parseCause(causeFromToCause(input.cause), options)
                return FailureFrom(cause, input.timestamp, input.refreshing)
              }
              case "Success": {
                const a = yield* parseValue(input.value, options)
                return SuccessFrom(a, input.timestamp, input.refreshing)
              }
              case "Optimistic": {
                const previous = yield* parseAsyncData(input.previous, options)
                const value = yield* parseValue(input.value, options)
                return OptimisticFrom(value, input.timestamp, previous)
              }
            }
          })
        }

        return parseAsyncData
      }
    },
    {
      title: "AsyncDataFrom",
      equivalence: () => fromEq,
      arbitrary: (valueArb, causeArb) => (fc) =>
        asyncDataArbitrary(valueArb, causeArb)(fc).map(asyncDataToAsyncDataFrom),
      pretty: (valuePretty, causePretty) => (from) =>
        asyncDataPretty(valuePretty, causePretty)(asyncDataFromToAsyncData(from))
    }
  )

  return schema
}

/**
 * @since 1.0.0
 */
export const AsyncData = <A, AI, R1, E, EI, R2>(
  valueSchema: Schema.Schema<A, AI, R2>,
  errorSchema: Schema.Schema<E, EI, R1>
): Schema.Schema<_AsyncData.AsyncData<A, E>, AsyncDataFrom<AI, EI>, R1 | R2> => {
  const from = asyncDataFromJson(valueSchema, errorSchema)
  const to = AsyncDataFromSelf(Schema.typeSchema(valueSchema), Schema.typeSchema(errorSchema))

  return from
    .pipe(Schema.transform(
      to,
      {
        decode: asyncDataFromToAsyncData,
        encode: asyncDataToAsyncDataFrom
      }
    ))
}

/**
 * @since 1.0.0
 */
export const AsyncDataFromSelf = <A, AI, R1, E, EI, R2>(
  value: Schema.Schema<A, AI, R2>,
  error: Schema.Schema<E, EI, R1>
): Schema.Schema<_AsyncData.AsyncData<A, E>, _AsyncData.AsyncData<AI, EI>, R1 | R2> => {
  const schema = Schema.declare(
    [value, Schema.CauseFromSelf({ error })],
    {
      decode: (valueSchema, causeSchema) => {
        const parseCause = ParseResult.decode(causeSchema)
        const parseValue = ParseResult.decode(valueSchema)

        const parseAsyncData = (
          input: unknown,
          options?: AST.ParseOptions
        ): Effect.Effect<
          _AsyncData.AsyncData<A, E>,
          ParseResult.ParseIssue,
          never
        > => {
          return Effect.gen(function*() {
            if (!_AsyncData.isAsyncData<AI, EI>(input)) {
              return yield* Effect.fail<ParseResult.ParseIssue>(new ParseResult.Forbidden(schema.ast, input))
            }

            switch (input._tag) {
              case "NoData":
              case "Loading":
                return input
              case "Failure": {
                const cause = yield* parseCause(input.cause, options)

                return _AsyncData.failCause(cause, {
                  timestamp: input.timestamp,
                  refreshing: Option.getOrUndefined(input.refreshing)
                })
              }
              case "Success": {
                const a = yield* parseValue(input.value, options)

                return _AsyncData.success(a, {
                  timestamp: input.timestamp,
                  refreshing: Option.getOrUndefined(input.refreshing)
                })
              }
              case "Optimistic": {
                const previous = yield* parseAsyncData(input.previous, options)
                const value = yield* parseValue(input.value, options)

                return _AsyncData.optimistic(previous, value, {
                  timestamp: input.timestamp
                })
              }
            }
          })
        }

        return parseAsyncData
      },
      encode: (valueSchema, causeSchema) => {
        const parseCause = ParseResult.encode(causeSchema)
        const parseValue = ParseResult.encode(valueSchema)

        const parseAsyncData = (
          input: unknown,
          options?: AST.ParseOptions
        ): Effect.Effect<
          _AsyncData.AsyncData<AI, EI>,
          ParseResult.ParseIssue,
          never
        > => {
          return Effect.gen(function*() {
            if (!_AsyncData.isAsyncData<A, E>(input)) {
              return yield* Effect.fail(new ParseResult.Forbidden(schema.ast, input))
            }

            switch (input._tag) {
              case "NoData":
              case "Loading":
                return input
              case "Failure": {
                const cause = yield* parseCause(input.cause, options)

                return _AsyncData.failCause(cause, {
                  timestamp: input.timestamp,
                  refreshing: Option.getOrUndefined(input.refreshing)
                })
              }
              case "Success": {
                const a = yield* parseValue(input.value, options)

                return _AsyncData.success(a, {
                  timestamp: input.timestamp,
                  refreshing: Option.getOrUndefined(input.refreshing)
                })
              }
              case "Optimistic": {
                const previous = yield* parseAsyncData(input.previous, options)
                const value = yield* parseValue(input.value, options)

                return _AsyncData.optimistic(previous, value, {
                  timestamp: input.timestamp
                })
              }
            }
          })
        }

        return parseAsyncData
      }
    },
    {
      title: "AsyncData",
      pretty: asyncDataPretty,
      arbitrary: asyncDataArbitrary,
      equivalence: () => Equal.equals
    }
  )
  return schema as any
}

function asyncDataPretty<A, E>(
  A: Pretty.Pretty<A>,
  E: Pretty.Pretty<Cause.Cause<E>>
): Pretty.Pretty<_AsyncData.AsyncData<A, E>> {
  return _AsyncData.match({
    NoData: () => NO_DATA_PRETTY,
    Loading: LOADING_PRETTY,
    Failure: (_, data) => FAILURE_PRETTY(E)(data),
    Success: (_, data) => SUCCESS_PRETTY(A)(data),
    Optimistic: (_, data) => OPTIMISTIC_PRETTY(A, E)(data)
  })
}

function asyncDataArbitrary<A, E>(
  A: Arbitrary.LazyArbitrary<A>,
  E: Arbitrary.LazyArbitrary<Cause.Cause<E>>
): Arbitrary.LazyArbitrary<_AsyncData.AsyncData<A, E>> {
  const failureArb = failureArbitrary(E)
  const successArb = successArbitrary(A)
  const optimisticArb = optimisticArbitrary(A, E)

  return (fc) =>
    fc.oneof(
      fc.constant(_AsyncData.noData()),
      fc.constant(_AsyncData.loading()),
      failureArb(fc),
      successArb(fc),
      optimisticArb(fc)
    )
}

function progressFromJson(json: ProgressFrom | undefined): Option.Option<P.Progress> {
  if (json === undefined) return Option.none()
  return Option.some(P.make(BigInt(json.loaded), json.total === undefined ? undefined : BigInt(json.total)))
}

function progressToJson(progres: Option.Option<P.Progress>): ProgressFrom | undefined {
  if (Option.isNone(progres)) return
  return {
    loaded: progres.value.loaded.toString(),
    total: Option.getOrUndefined(progres.value.total)?.toString()
  }
}

function loadingFromJson(json: LoadingFrom | undefined): _AsyncData.Loading | undefined {
  if (json === undefined) return
  return _AsyncData.loading({
    timestamp: json.timestamp,
    progress: Option.getOrUndefined(progressFromJson(json.progress))
  })
}

function loadingToJson(loading: _AsyncData.Loading): LoadingFrom {
  const from: LoadingFrom = {
    _tag: "Loading",
    timestamp: loading.timestamp
  }

  if (Option.isSome(loading.progress)) {
    return { ...from, progress: progressToJson(loading.progress) }
  }

  return from
}

function causeFromToCause<E>(from: Schema.CauseEncoded<E>): Cause.Cause<E> {
  switch (from._tag) {
    case "Die":
      return Cause.die(from.defect)
    case "Empty":
      return Cause.empty
    case "Fail":
      return Cause.fail(from.error)
    case "Interrupt":
      return Cause.interrupt(fiberIdFromToFiberId(from.fiberId))
    case "Parallel":
      return Cause.parallel(causeFromToCause(from.left), causeFromToCause(from.right))
    case "Sequential":
      return Cause.sequential(causeFromToCause(from.left), causeFromToCause(from.right))
  }
}

function fiberIdFromToFiberId(id: Schema.FiberIdEncoded): FiberId.FiberId {
  switch (id._tag) {
    case "None":
      return FiberId.none
    case "Runtime":
      return FiberId.runtime(id.id, id.startTimeMillis)
    case "Composite":
      return FiberId.composite(fiberIdFromToFiberId(id.left), fiberIdFromToFiberId(id.right))
  }
}

function causeToCauseEncoded<E>(cause: Cause.Cause<E>): Schema.CauseEncoded<E> {
  switch (cause._tag) {
    case "Die":
      return { _tag: "Die", defect: cause.defect }
    case "Empty":
      return { _tag: "Empty" }
    case "Fail":
      return { _tag: "Fail", error: cause.error }
    case "Interrupt":
      return { _tag: "Interrupt", fiberId: fiberIdToFiberIdFrom(cause.fiberId) }
    case "Parallel":
      return { _tag: "Parallel", left: causeToCauseEncoded(cause.left), right: causeToCauseEncoded(cause.right) }
    case "Sequential":
      return { _tag: "Sequential", left: causeToCauseEncoded(cause.left), right: causeToCauseEncoded(cause.right) }
  }
}

function fiberIdToFiberIdFrom(id: FiberId.FiberId): Schema.FiberIdEncoded {
  switch (id._tag) {
    case "None":
      return { _tag: "None" }
    case "Runtime":
      return { _tag: "Runtime", id: id.id, startTimeMillis: id.startTimeMillis }
    case "Composite":
      return { _tag: "Composite", left: fiberIdToFiberIdFrom(id.left), right: fiberIdToFiberIdFrom(id.right) }
  }
}

const NO_DATA_FROM: NoDataFrom = { _tag: "NoData" } as const

function asyncDataToAsyncDataFrom<A, E>(data: _AsyncData.AsyncData<A, E>): AsyncDataFrom<A, E> {
  switch (data._tag) {
    case "NoData":
      return NO_DATA_FROM
    case "Loading":
      return loadingToJson(data)
    case "Failure":
      return FailureFrom(
        causeToCauseEncoded(data.cause),
        data.timestamp,
        Option.getOrUndefined(Option.map(data.refreshing, loadingToJson))
      )
    case "Success":
      return SuccessFrom(
        data.value,
        data.timestamp,
        Option.getOrUndefined(Option.map(data.refreshing, loadingToJson))
      )
    case "Optimistic":
      return OptimisticFrom(data.value, data.timestamp, asyncDataToAsyncDataFrom(data.previous))
  }
}

function asyncDataFromToAsyncData<A, E>(data: AsyncDataFrom<A, E>): _AsyncData.AsyncData<A, E> {
  switch (data._tag) {
    case "NoData":
      return _AsyncData.noData()
    case "Loading":
      return loadingFromJson(data)!
    case "Failure":
      return _AsyncData.failCause(causeFromToCause(data.cause), {
        timestamp: data.timestamp,
        refreshing: loadingFromJson(data.refreshing)
      })
    case "Success":
      return _AsyncData.success(data.value, {
        timestamp: data.timestamp,
        refreshing: loadingFromJson(data.refreshing)
      })
    case "Optimistic":
      return _AsyncData.optimistic(asyncDataFromToAsyncData(data.previous), data.value, {
        timestamp: data.timestamp
      })
  }
}
