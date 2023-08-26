import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Request from '@effect/io/Request'
import * as RequestResolver from '@effect/io/RequestResolver'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import * as RemoteData from '@typed/remote-data'

type RequestError<T> = [T] extends [Request.Request<infer E, any>] ? E : never
type RequestOutput<T> = [T] extends [Request.Request<any, infer A>] ? A : never

export interface RequestSubject<
  Req extends Request.Request<any, any>,
  Args extends readonly any[] = [],
> extends Fx.RefSubject<never, RemoteData.RemoteData<RequestError<Req>, RequestOutput<Req>>> {
  readonly isLoading: Fx.Computed<never, never, boolean>
  readonly isRefreshing: Fx.Computed<never, never, boolean>
  readonly isLoadingOrRefreshing: Fx.Computed<never, never, boolean>
  readonly isFailure: Fx.Computed<never, never, boolean>
  readonly isSuccess: Fx.Computed<never, never, boolean>
  readonly option: Fx.Computed<never, never, Option.Option<RequestOutput<Req>>>
  readonly optionError: Fx.Computed<never, never, Option.Option<RequestError<Req>>>
  readonly optionCause: Fx.Computed<never, never, Option.Option<Cause.Cause<RequestError<Req>>>>

  readonly makeRequest: (...args: Args) => Effect.Effect<never, never, void>

  readonly match: <R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(options: {
    readonly onNoData: () => Fx.Fx<R, E, A> | Effect.Effect<R, E, A>
    readonly onLoading: () => Fx.Fx<R2, E2, B> | Effect.Effect<R2, E2, B>
    readonly onFailure: (
      cause: Cause.Cause<RequestError<Req>>,
      refreshing: boolean,
    ) => Fx.Fx<R3, E3, C> | Effect.Effect<R3, E3, C>
    readonly onSuccess: (
      value: RequestOutput<Req>,
      refreshing: boolean,
    ) => Fx.Fx<R4, E4, D> | Effect.Effect<R4, E4, D>
  }) => Fx.Fx<R | R2 | R3 | R4, E | E2 | E3 | E4, A | B | C | D>
}

const toFx = <R, E, A>(fxOrEffect: Effect.Effect<R, E, A> | Fx.Fx<R, E, A>): Fx.Fx<R, E, A> =>
  Fx.isFx(fxOrEffect) ? fxOrEffect : Fx.fromEffect(fxOrEffect)

export function useRequest<
  Args extends readonly any[],
  Req extends Request.Request<any, any>,
  R = never,
>(
  constructor: (...args: Args) => Req,
  resolver: RequestResolver.RequestResolver<Req, R>,
): Effect.Effect<Scope.Scope | R, never, RequestSubject<Req, Args>> {
  type Error = RequestError<Req>
  type Output = RequestOutput<Req>

  return Effect.gen(function* ($) {
    const ctx = yield* $(Effect.context<R | Scope.Scope>())
    const resolverWithCtx = RequestResolver.provideContext(resolver, ctx)
    const data = yield* $(
      Fx.makeRef(Effect.succeed<RemoteData.RemoteData<Error, Output>>(RemoteData.noData)),
    )

    const isLoading = data.map(RemoteData.isLoading)
    const isRefreshing = data.map(RemoteData.isRefreshing)
    const isLoadingOrRefreshing = data.map(RemoteData.isLoadingOrRefreshing)
    const isFailure = data.map(RemoteData.isFailure)
    const isSuccess = data.map(RemoteData.isSuccess)
    const option = data.map(RemoteData.toOption)
    const optionError = data.map(RemoteData.toOptionError)
    const optionCause = data.map(RemoteData.toOptionCause)

    const makeRequest = (...args: Args): Effect.Effect<never, never, void> =>
      Effect.gen(function* ($) {
        const current = yield* $(data.get)

        // Don't make a request while one is in progress
        if (RemoteData.isLoadingOrRefreshing(current)) {
          return
        }

        yield* $(data.update(RemoteData.toLoading))

        const exit = yield* $(Effect.request(constructor(...args), resolverWithCtx), Effect.exit)

        yield* $(data.set(RemoteData.fromExit(exit)))
      }).pipe(Effect.ensuring(data.update(RemoteData.stopLoading)))

    const match = <R, E, A, R2, E2, B, R3, E3, C, R4, E4, D>(options: {
      readonly onNoData: () => Fx.Fx<R, E, A> | Effect.Effect<R, E, A>
      readonly onLoading: () => Fx.Fx<R2, E2, B> | Effect.Effect<R2, E2, B>
      readonly onFailure: (
        error: Cause.Cause<RequestError<Req>>,
        refreshing: boolean,
      ) => Fx.Fx<R3, E3, C> | Effect.Effect<R3, E3, C>
      readonly onSuccess: (
        value: RequestOutput<Req>,
        refreshing: boolean,
      ) => Fx.Fx<R4, E4, D> | Effect.Effect<R4, E4, D>
    }) =>
      Fx.switchMap<
        never,
        never,
        RemoteData.RemoteData<RequestError<Req>, RequestOutput<Req>>,
        R | R2 | R3 | R4,
        E | E2 | E3 | E4,
        A | B | C | D
      >(
        data,
        RemoteData.match({
          onNoData: () => toFx(options.onNoData()),
          onLoading: () => toFx(options.onLoading()),
          onFailure: (cause, refreshing) => toFx(options.onFailure(cause, refreshing)),
          onSuccess: (value, refreshing) => toFx(options.onSuccess(value, refreshing)),
        }),
      )

    return Object.assign(data, {
      isLoading,
      isRefreshing,
      isLoadingOrRefreshing,
      isFailure,
      isSuccess,
      option,
      optionError,
      optionCause,
      makeRequest,
      match,
    } as const) satisfies RequestSubject<Req, Args>
  })
}
