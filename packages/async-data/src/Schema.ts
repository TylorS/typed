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
import { Data, Equal, FiberId } from "effect"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { hasProperty } from "effect/Predicate"
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
    onSome: () => `AsyncData.Failure(timestamp=${failure.timestamp}, refreshing=true, cause=${print(failure.cause)})`
  })
const SUCCESS_PRETTY = <A>(print: Pretty.Pretty<A>) => (success: AsyncData.Success<A>) =>
  Option.match(success.refreshing, {
    onNone: () => `AsyncData.Success(timestamp=${success.timestamp}, value=${print(success.value)})`,
    onSome: () => `AsyncData.Success(timestamp=${success.timestamp}, refreshing=true, value=${print(success.value)})`
  })

const OPTIMISTIC_PRETTY =
  <E, A>(printError: Pretty.Pretty<Cause.Cause<E>>, printValue: Pretty.Pretty<A>) =>
  (optimistic: AsyncData.Optimistic<E, A>) =>
    `AsyncData.Optimistic(timestamp=${optimistic.timestamp}, value=${printValue(optimistic.value)}, previous=${
      asyncDataPretty(printError, printValue)(optimistic.previous)
    })`

/**
 * @since 1.0.0
 */
export type NoDataFrom = { readonly _tag: "NoData" }

const ProgressSchemaJson = Schema.struct({
  loaded: Schema.bigint,
  total: Schema.optional(Schema.bigint)
})

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

/**
 * @since 1.0.0
 */
export const Progress: Schema.Schema<{ readonly loaded: string; readonly total?: string | undefined }, P.Progress> =
  ProgressSchemaJson.pipe(
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

/**
 * @since 1.0.0
 */
export type ProgressFrom = {
  readonly loaded: string
  readonly total?: string | undefined
}

const loadingArbitrary: Arbitrary.Arbitrary<AsyncData.Loading> = (fc) =>
  fc.option(progressArbitrary(fc)).map((progress) =>
    AsyncData.loading({
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
  )

/**
 * @since 1.0.0
 */
export type FailureFrom<E> = {
  readonly _tag: "Failure"
  readonly cause: Schema.CauseFrom<E>
  readonly timestamp: number
  readonly refreshing?: LoadingFrom | undefined
}

const FailureFrom = <E>(cause: Schema.CauseFrom<E>, timestamp: number, refreshing?: LoadingFrom): FailureFrom<E> => {
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

export type OptimisticFrom<E, A> = {
  readonly timestamp: number
  readonly _tag: "Optimistic"
  readonly value: A
  readonly previous: AsyncDataFrom<E, A>
}

const OptimisticFrom = <E, A>(value: A, timestamp: number, previous: AsyncDataFrom<E, A>): OptimisticFrom<E, A> => ({
  _tag: "Optimistic",
  value,
  timestamp,
  previous
})

const optimisticArbitrary = <E, A>(
  causeArb: Arbitrary.Arbitrary<Cause.Cause<E>>,
  valueArb: Arbitrary.Arbitrary<A>
): Arbitrary.Arbitrary<AsyncData.Optimistic<E, A>> =>
(fc) =>
  asyncDataArbitrary(causeArb, valueArb)(fc).chain((previous) =>
    valueArb(fc).chain((value) =>
      fc.date().map((date) => AsyncData.optimistic(previous, value, { timestamp: date.getTime() }))
    )
  )

/**
 * @since 1.0.0
 */
export type AsyncDataFrom<E, A> = NoDataFrom | LoadingFrom | FailureFrom<E> | SuccessFrom<A> | OptimisticFrom<E, A>

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

const isCauseFrom = Schema.is(Schema.from(Schema.cause(Schema.unknown)))

function isFailureFrom(value: unknown): value is FailureFrom<any> {
  return hasProperty(value, "_tag")
    && value._tag === "Failure"
    && hasProperty(value, "cause")
    && isCauseFrom(value.cause)
    && hasProperty(value, "timestamp")
    && typeof value.timestamp === "number"
    && (hasProperty(value, "refreshing") ? isLoadingFrom(value.refreshing) : true)
}

function isSuccessFrom(value: unknown): value is SuccessFrom<any> {
  return hasProperty(value, "_tag")
    && value._tag === "Success"
    && hasProperty(value, "value")
    && hasProperty(value, "timestamp")
    && typeof value.timestamp === "number"
    && (hasProperty(value, "refreshing") ? isLoadingFrom(value.refreshing) : true)
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

function isAsyncDataFrom(value: unknown): value is AsyncDataFrom<any, any> {
  return isNoDataFrom(value)
    || isLoadingFrom(value)
    || isFailureFrom(value)
    || isSuccessFrom(value)
    || isOptimisticFrom(value)
}

export const asyncDataFromJson = <EI, E, AI, A>(
  error: Schema.Schema<EI, E>,
  value: Schema.Schema<AI, A>
): Schema.Schema<AsyncDataFrom<EI, AI>, AsyncDataFrom<E, A>> =>
  Schema.declare(
    [
      Schema.cause(error),
      value
    ],
    Schema.annotations({
      [Eq.EquivalenceHookId]: () => fromEq
    })(Schema.struct({})),
    (isDecoding, causeSchema, valueSchema) => {
      const parseCause = isDecoding ? Schema.decode(causeSchema) : Schema.encode(causeSchema)
      const parseValue = isDecoding ? Schema.decode(valueSchema) : Schema.encode(valueSchema)

      const parseAsyncData = (
        input: any,
        options?: AST.ParseOptions
      ): Effect.Effect<
        never,
        ParseResult.ParseError,
        AsyncDataFrom<E, A>
      > =>
        Effect.gen(function*(_) {
          if (!isAsyncDataFrom(input)) {
            return yield* _(ParseResult.fail(ParseResult.forbidden(input)))
          }

          switch (input._tag) {
            case "NoData":
            case "Loading":
              return input
            case "Failure": {
              const cause = yield* _(parseCause(isDecoding ? input.cause : causeFromToCause(input.cause), options))
              return FailureFrom(causeToCauseFrom(cause), input.timestamp, input.refreshing)
            }
            case "Success": {
              const a = yield* _(parseValue(input.value, options))
              return SuccessFrom(a, input.timestamp, input.refreshing)
            }
            case "Optimistic": {
              const previous: AsyncDataFrom<any, any> = yield* _(parseAsyncData(input.previous, options))
              const value = yield* _(parseValue(input.value, options))

              return OptimisticFrom(value, input.timestamp, previous)
            }
          }
        })

      return parseAsyncData
    },
    {
      [AST.IdentifierAnnotationId]: "AsyncDataFrom",
      [Eq.EquivalenceHookId]: () => fromEq
    }
  )

/**
 * @since 1.0.0
 */
export const asyncData = <EI, E, AI, A>(
  errorSchema: Schema.Schema<EI, E>,
  valueSchema: Schema.Schema<AI, A>
): Schema.Schema<AsyncDataFrom<EI, AI>, AsyncData.AsyncData<E, A>> => {
  const encodeCause = Schema.encode(Schema.cause(Schema.to(errorSchema)))

  return asyncDataFromJson(errorSchema, valueSchema)
    .pipe(Schema.transformOrFail(
      asyncDataFromSelf(Schema.to(errorSchema), Schema.to(valueSchema)),
      function decodeAsyncDataFrom(
        c: AsyncDataFrom<E, A>,
        options?: AST.ParseOptions
      ): Effect.Effect<never, ParseResult.ParseError, AsyncData.AsyncData<E, A>> {
        switch (c._tag) {
          case "NoData":
            return Effect.succeed(AsyncData.noData())
          case "Loading":
            return Effect.succeed(loadingFromJson(c)!)
          case "Failure": {
            console.log(causeFromToCause(c.cause))

            return Effect.succeed(
              AsyncData.failCause(causeFromToCause(c.cause), {
                timestamp: c.timestamp,
                refreshing: loadingFromJson(c.refreshing)
              })
            )
          }
          case "Success": {
            return Effect.succeed(AsyncData.success(c.value, {
              timestamp: c.timestamp,
              refreshing: loadingFromJson(c.refreshing)
            }))
          }
          case "Optimistic": {
            return Effect.map(
              decodeAsyncDataFrom(c.previous, options),
              (previous) => AsyncData.optimistic(previous, c.value, { timestamp: c.timestamp })
            )
          }
        }
      },
      function encodeAsyncDataFrom(
        a: AsyncData.AsyncData<E, A>,
        options?: AST.ParseOptions
      ): Effect.Effect<never, ParseResult.ParseError, AsyncDataFrom<E, A>> {
        switch (a._tag) {
          case "NoData":
            return Effect.succeed({ _tag: "NoData" })
          case "Loading":
            return Effect.succeed(loadingToJson(a))
          case "Failure":
            return Effect.map(
              encodeCause(a.cause, options),
              (cause) => FailureFrom(cause, a.timestamp, Option.getOrUndefined(Option.map(a.refreshing, loadingToJson)))
            )
          case "Success":
            return Effect.succeed(
              SuccessFrom(a.value, a.timestamp, Option.getOrUndefined(Option.map(a.refreshing, loadingToJson)))
            )
          case "Optimistic": {
            return Effect.map(
              encodeAsyncDataFrom(a.previous, options),
              (previous) => OptimisticFrom(a.value, a.timestamp, previous)
            )
          }
        }
      }
    ))
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
      const parseCause = isDecoding ? Schema.decode(causeSchema) : Schema.encode(causeSchema)
      const parseValue = isDecoding ? Schema.decode(valueSchema) : Schema.encode(valueSchema)

      const parseAsyncData = (
        input: unknown,
        options?: AST.ParseOptions
      ): Effect.Effect<
        never,
        ParseResult.ParseError,
        AsyncData.AsyncData<any, any>
      > => {
        return Effect.gen(function*(_) {
          if (!AsyncData.isAsyncData(input)) return yield* _(ParseResult.fail(ParseResult.forbidden(input)))

          switch (input._tag) {
            case "NoData":
            case "Loading":
              return input
            case "Failure": {
              const cause = yield* _(parseCause(input.cause, options))

              return AsyncData.failCause(isDecoding ? cause : causeFromToCause(cause), {
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
            case "Optimistic": {
              const previous = yield* _(parseAsyncData(input.previous, options))
              const value = yield* _(parseValue(input.value, options))

              return AsyncData.optimistic(previous, value, {
                timestamp: input.timestamp
              })
            }
          }
        })
      }

      return parseAsyncData
    },
    {
      [AST.IdentifierAnnotationId]: "AsyncData",
      [Pretty.PrettyHookId]: asyncDataPretty,
      [Arbitrary.ArbitraryHookId]: asyncDataArbitrary,
      [Eq.EquivalenceHookId]: () => Equal.equals
    }
  )
}

function asyncDataPretty<E, A>(
  E: Pretty.Pretty<Cause.Cause<E>>,
  A: Pretty.Pretty<A>
): Pretty.Pretty<AsyncData.AsyncData<E, A>> {
  return AsyncData.match({
    NoData: () => NO_DATA_PRETTY,
    Loading: LOADING_PRETTY,
    Failure: (_, data) => FAILURE_PRETTY(E)(data),
    Success: (_, data) => SUCCESS_PRETTY(A)(data),
    Optimistic: (_, data) => OPTIMISTIC_PRETTY(E, A)(data)
  })
}

function asyncDataArbitrary<E, A>(
  E: Arbitrary.Arbitrary<Cause.Cause<E>>,
  A: Arbitrary.Arbitrary<A>
): Arbitrary.Arbitrary<AsyncData.AsyncData<E, A>> {
  const failureArb = failureArbitrary(E)
  const successArb = successArbitrary(A)
  const optimisticArb = optimisticArbitrary(E, A)

  return (fc) =>
    fc.oneof(
      fc.constant(AsyncData.noData()),
      fc.constant(AsyncData.loading()),
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

function loadingFromJson(json: LoadingFrom | undefined): AsyncData.Loading | undefined {
  if (json === undefined) return
  return AsyncData.loading({
    timestamp: json.timestamp,
    progress: Option.getOrUndefined(progressFromJson(json.progress))
  })
}

function loadingToJson(loading: AsyncData.Loading): LoadingFrom {
  const from: LoadingFrom = {
    _tag: "Loading",
    timestamp: loading.timestamp
  }

  if (Option.isSome(loading.progress)) {
    return { ...from, progress: progressToJson(loading.progress) }
  }

  return from
}

function causeFromToCause<E>(from: Schema.CauseFrom<E>): Cause.Cause<E> {
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

function fiberIdFromToFiberId(id: Schema.FiberIdFrom): FiberId.FiberId {
  switch (id._tag) {
    case "None":
      return FiberId.none
    case "Runtime":
      return FiberId.runtime(id.id, id.startTimeMillis)
    case "Composite":
      return FiberId.composite(fiberIdFromToFiberId(id.left), fiberIdFromToFiberId(id.right))
  }
}

function causeToCauseFrom<E>(cause: Cause.Cause<E>): Schema.CauseFrom<E> {
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
      return { _tag: "Parallel", left: causeToCauseFrom(cause.left), right: causeToCauseFrom(cause.right) }
    case "Sequential":
      return { _tag: "Sequential", left: causeToCauseFrom(cause.left), right: causeToCauseFrom(cause.right) }
  }
}

function fiberIdToFiberIdFrom(id: FiberId.FiberId): Schema.FiberIdFrom {
  switch (id._tag) {
    case "None":
      return { _tag: "None" }
    case "Runtime":
      return { _tag: "Runtime", id: id.id, startTimeMillis: id.startTimeMillis }
    case "Composite":
      return { _tag: "Composite", left: fiberIdToFiberIdFrom(id.left), right: fiberIdToFiberIdFrom(id.right) }
  }
}
