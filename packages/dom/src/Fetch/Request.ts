import * as Effect from '@effect/io/Effect'
import type * as Request from '@effect/io/Request'

import type { Fetch } from '../Fetch.js'

import { FetchDataSource } from './Request/DataSource.js'
import type { FetchRequest } from './Request/Request.js'

export * from './Request/Request.js'

export function query<Q extends FetchRequest<any>, Cached extends Q = Q>(
  request: Q,
  cache?: Request.Cache<Cached>,
): Effect.Effect<Fetch, Request.Request.Error<Q>, Request.Request.Success<Q>> {
  return cache
    ? Effect.request(request, FetchDataSource, cache)
    : Effect.request(request, FetchDataSource)
}
