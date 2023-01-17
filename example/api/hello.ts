import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import * as Context from '@typed/context'
import { FetchHandler } from '@typed/framework/express'
import { Route } from '@typed/route'

export interface I18N {
  readonly translate: (
    key: string,
    preferredLanguages: readonly string[],
  ) => Effect.Effect<never, never, string>
}
export const I18N = Context.Tag<I18N>()

export const handler = FetchHandler(Route('/hello/:name'), (req, { name }) =>
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

const translations: Record<string, Record<string, string>> = {
  hello: {
    en: 'Hello',
    es: 'Hola',
    fr: 'Bonjour',
  },
}

export const environment = I18N.layerOf({
  translate: (key, preferredLanguages) =>
    Effect.sync(() => {
      const lowercaseKey = key.toLowerCase()

      if (!(lowercaseKey in translations)) return key

      const translation = translations[lowercaseKey]

      for (const language of preferredLanguages) {
        if (language in translation) return translation[language]
        if (language.includes('-')) return translation[language.split('-')[0]]
      }

      return translation['en']
    }),
})
