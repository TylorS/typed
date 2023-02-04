import * as Effect from '@effect/io/Effect'
import * as DataSource from '@effect/query/DataSource'
import * as Request from '@effect/query/Request'
import type * as Chunk from '@fp-ts/data/Chunk'
import * as P from '@fp-ts/schema/Parser'

import type { FetchRequest } from './Request.js'

import { type Fetch, fetchJson, fetchText } from '@typed/dom/Fetch'

export const FetchDataSource: DataSource.DataSource<Fetch, FetchRequest> = DataSource.makeBatched(
  'FetchDataSource',
  (requests: Chunk.Chunk<FetchRequest>) =>
    Effect.forEachPar(requests, (request) =>
      Effect.gen(function* ($) {
        if (request._tag === 'FetchJson') {
          const response = yield* $(Effect.either(fetchJson(request.input, request.init)))
          return yield* $(Request.complete(request, response))
        }

        if (request._tag === 'FetchDecodeJson') {
          const response = yield* $(
            Effect.either(fetchJson.decode(request.input, request.decoder, request.init)),
          )
          return yield* $(Request.complete(request, response))
        }

        if (request._tag === 'FetchSchema') {
          const response = yield* $(
            Effect.either(fetchJson.decode(request.input, P.decode(request.schema), request.init)),
          )
          return yield* $(Request.complete(request, response))
        }

        if (request._tag === 'FetchText') {
          const response = yield* $(Effect.either(fetchText(request.input, request.init)))
          return yield* $(Request.complete(request, response))
        }

        if (request._tag === 'FetchDecodeText') {
          const response = yield* $(
            Effect.either(fetchText.decode(request.input, request.decoder, request.init)),
          )
          return yield* $(Request.complete(request, response))
        }
      }),
    ),
)
