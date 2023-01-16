import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import * as Context from '@typed/context'
import { FetchHandler } from '@typed/framework/express'
import { Route } from '@typed/route'

export interface I18N {
  readonly translate: (key: string) => Effect.Effect<never, never, string>
}
export const I18N = Context.Tag<I18N>()

export const handler = FetchHandler(Route('/hello/:name'), (_, { name }) =>
  I18N.withEffect(({ translate }) =>
    pipe(
      translate('hello'),
      Effect.map(
        (greeting) =>
          new Response(`${greeting}, ${name}!`, {
            headers: {
              'content-type': 'text/plain',
            },
          }),
      ),
    ),
  ),
).provideLayer(I18N.layerOf({ translate: Effect.succeed }))
