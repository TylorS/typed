import { identity } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Fiber } from '@effect/io/Fiber'
import * as Request from '@effect/io/Request'
import * as RequestResolver from '@effect/io/RequestResolver'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import * as RemoteData from '@typed/remote-data'

import { RefRemoteData, makeRefRemoteData } from '../../fx/src/RefRemoteData.js'

export interface RefRequest<Args extends ReadonlyArray<any>, Req extends Request.Request<any, any>>
  extends Fx.Computed<never, Request.Request.Error<Req>, Request.Request.Success<Req>> {
  readonly makeRequest: (
    ...args: Args
  ) => Effect.Effect<
    Scope.Scope,
    RemoteData.NoSuchElementException | RemoteData.LoadingException | Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >

  readonly forkRequest: (
    ...args: Args
  ) => Effect.Effect<
    Scope.Scope,
    never,
    Fiber.Runtime<
      RemoteData.NoSuchElementException | RemoteData.LoadingException | Request.Request.Error<Req>,
      Request.Request.Success<Req>
    >
  >

  readonly mapValueEffect: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['mapValueEffect']
  readonly mapValue: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['mapValue']
  readonly matchFx: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['matchFx']
  readonly matchEffect: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['matchEffect']

  // States
  readonly toLoading: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['toLoading']
  readonly stopLoading: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['stopLoading']
  readonly isLoading: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['isLoading']
  readonly isRefreshing: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['isRefreshing']
  readonly isLoadingOrRefreshing: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['isLoadingOrRefreshing']
  readonly isFailure: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['isFailure']
  readonly isSuccess: RefRemoteData<
    Request.Request.Error<Req>,
    Request.Request.Success<Req>
  >['isSuccess']
}

export interface RefRequestOptions {
  readonly cache?: boolean | Request.Cache
}

export function makeRefRequest<
  Args extends ReadonlyArray<any>,
  Req extends Request.Request<any, any>,
  R = never,
>(
  request: (...args: Args) => Req,
  resolver: RequestResolver.RequestResolver<Req, R>,
  options: RefRequestOptions = {},
): Effect.Effect<R | Scope.Scope, never, RefRequest<Args, Req>> {
  return Effect.gen(function* ($) {
    type E = Request.Request.Error<Req>
    type A = Request.Request.Success<Req>

    const context = yield* $(Effect.context<R>())
    const resolverWithContext = RequestResolver.provideContext(resolver, context)
    const ref = yield* $(makeRefRemoteData<E, A>())

    const withCache =
      options.cache === true
        ? Effect.withRequestCaching(true)
        : options.cache
        ? Effect.withRequestCache(options.cache)
        : identity

    const makeRequest: RefRequest<Args, Req>['makeRequest'] = (...args) =>
      ref.runEffect(Effect.request(request(...args), resolverWithContext)).pipe(
        Effect.flatMap(function sampleRef(): ReturnType<RefRequest<Args, Req>['makeRequest']> {
          return ref.matchEffect({
            // This should never really happen since we just made a request, but if it did
            // we'll just make the request again
            onNoData: () => makeRequest(...args),
            // Wait for the current request to finish before making sampling the ref again
            onLoading: () => ref.awaitNotLoading.pipe(Effect.flatMap(() => sampleRef())),
            onFailure: Effect.failCause,
            onSuccess: Effect.succeed,
          })
        }),
        withCache,
      )

    const forkRequest = (...args: Args) => Effect.forkScoped(makeRequest(...args))

    // TS' types of Object.assign are not perfect
    // We manually cast to the correct type since this is not quite just an intersection
    // of the two types, but just adding makeRequest + forkRequest to the ref
    return Object.assign(ref, {
      makeRequest,
      forkRequest,
    }) as any as RefRequest<Args, Req>
  })
}
