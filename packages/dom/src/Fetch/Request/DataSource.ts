import * as Effect from '@effect/io/Effect'
import * as Request from '@effect/io/Request'
import * as Resolver from '@effect/io/RequestResolver'
import { fromSchema } from '@typed/decoder'

import type { FetchRequest } from './Request.js'

import { type Fetch, fetchJson, fetchText } from '@typed/dom/Fetch'

export const FetchDataSource: Resolver.RequestResolver<FetchRequest, Fetch> = Resolver.makeBatched<
  Fetch,
  FetchRequest
>(
  Effect.forEachPar((request) =>
    Effect.gen(function* ($) {
      if (request._tag === 'FetchJson') {
        const response = yield* $(Effect.exit(fetchJson(request.input, request.init)))
        return yield* $(Request.complete(request, response))
      }

      if (request._tag === 'FetchDecodeJson') {
        const response = yield* $(
          Effect.exit(fetchJson.decode(request.input, request.decoder, request.init)),
        )
        return yield* $(Request.complete(request, response))
      }

      if (request._tag === 'FetchSchema') {
        const response = yield* $(
          Effect.exit(fetchJson.decode(request.input, fromSchema(request.schema), request.init)),
        )
        return yield* $(Request.complete(request, response))
      }

      if (request._tag === 'FetchText') {
        const response = yield* $(Effect.exit(fetchText(request.input, request.init)))
        return yield* $(Request.complete(request, response))
      }

      if (request._tag === 'FetchDecodeText') {
        const response = yield* $(
          Effect.exit(fetchText.decode(request.input, request.decoder, request.init)),
        )
        return yield* $(Request.complete(request, response))
      }
    }),
  ),
)
