import * as Effect from '@effect/io/Effect'
import { FetchHandler } from '@typed/framework/express'
import { Route } from '@typed/route'

export const handler = FetchHandler(Route('/hello/:name'), (_, { name }) => {
  return Effect.succeed(
    new Response(`Hello, ${name}!`, {
      headers: {
        'content-type': 'text/plain',
      },
    }),
  )
})
