import * as Query from '@effect/query/Query'
import type * as Request from '@effect/query/Request'
import { pipe } from '@fp-ts/core/Function'
import * as RA from '@fp-ts/core/ReadonlyArray'

import type { Fetch } from '../Fetch.js'

import { FetchDataSource } from './Query/DataSource.js'
import type { FetchRequest } from './Query/Request.js'

export * from './Query/Request.js'

export function query<Q extends FetchRequest<any>>(
  request: Q,
): Query.Query<Fetch, Request.Request.Error<Q>, Request.Request.Success<Q>> {
  return Query.fromRequest(request, FetchDataSource)
}

export function queryUncached<Q extends FetchRequest<any>>(
  request: Q,
): Query.Query<Fetch, Request.Request.Error<Q>, Request.Request.Success<Q>> {
  return Query.fromRequestUncached(request, FetchDataSource)
}

export function queryPar<Queries extends ReadonlyArray<FetchRequest<any>>>(
  ...requests: Queries
): Query.Query<
  Fetch,
  Request.Request.Error<Queries[number]>,
  { readonly [K in keyof Queries]: Request.Request.Success<Queries[K]> }
> {
  return pipe(
    requests,
    RA.map(query),
    Query.collectAllPar,
    Query.map(
      (c) =>
        c.toReadonlyArray() as {
          readonly [K in keyof Queries]: Request.Request.Success<Queries[K]>
        },
    ),
  ) as any
}

export function queryBatched<Queries extends ReadonlyArray<FetchRequest>>(
  batchSize: number,
  ...requests: Queries
): Query.Query<
  Fetch,
  Request.Request.Error<Queries[number]>,
  { readonly [K in keyof Queries]: Request.Request.Success<Queries[K]> }
> {
  return pipe(
    requests,
    RA.map(query),
    Query.collectAllBatched,
    Query.maxBatchSize(batchSize),
    Query.map(
      (c) =>
        c.toReadonlyArray() as {
          readonly [K in keyof Queries]: Request.Request.Success<Queries[K]>
        },
    ),
  ) as any
}
