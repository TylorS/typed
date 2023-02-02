import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'
import * as Context from '@typed/context'
import { FetchHandler } from '@typed/framework/api'
import { type ParamsOf, Route, type PathOf } from '@typed/route'

const route = Route('/hello/:name')

// Our API module handling is always modeled as a FetchHandler. This allows us to
// easily support multiple environments (e.g. Node, Deno, Service Worker, etc)
// while still using the same code by using a W3C standard of Request and Response.
//
// A FetchHandler can be exported at any name and each module can contain as many
// handlers as they would like.
export const hello: FetchHandler<I18N, never, PathOf<typeof route>> = FetchHandler(
  route,
  (req: Request, { name }: ParamsOf<typeof route>) =>
    I18N.withEffect(({ translate }) =>
      pipe(
        translate('Hello', getPreferredLanguages(req)),
        Effect.map(
          (greeting) =>
            new Response(`${greeting}, ${decodeURIComponent(name)}!`, {
              headers: { 'content-type': 'text/plain' },
            }),
        ),
      ),
    ),
)

const getPreferredLanguages = (req: Request): readonly string[] =>
  req.headers
    .get('accept-language')
    ?.split(',')
    .map((x) => x.split(';')[0].toLowerCase()) ?? ['en']

export interface I18N {
  readonly translate: (
    key: string,
    preferredLanguages: readonly string[],
  ) => Effect.Effect<never, never, string>
}

export const I18N = Context.Tag<I18N>()

// Every API module can expose an environment that will be provided to all the handlers in the module.
// You can also use an environment.ts file just like when generating a page, it will be utilized in conjunction
// with anything defined locally to a module.
export const environment = I18N.layerOf({
  translate: (key, preferredLanguages) =>
    Effect.sync(() => {
      const lowercaseKey = key.toLowerCase()

      if (!(lowercaseKey in translations)) return key

      const translation = translations[lowercaseKey]

      for (const language of preferredLanguages) {
        if (language in translation) return translation[language]
      }

      return translation['en']
    }),
})

const translations: Record<string, Record<string, string>> = {
  hello: {
    en: 'Hello',
    es: 'Hola',
    fr: 'Bonjour',
  },
}
