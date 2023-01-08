import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { either } from '@fp-ts/data'
import { pipe } from '@fp-ts/data/function'
import { RuntimeModule, provideServerIntrinsics, runMatcherWithFallback } from '@typed/framework'
import * as Fx from '@typed/fx'
import { renderInto } from '@typed/html'
import express from 'express'
import isbot from 'isbot'

import { html5Doctype, makeServerWindow } from './makeServerWindow.js'

const prettyPrintCause = Cause.pretty()

export const runExpressApp = (
  runtimeModule: RuntimeModule,
  indexHtml: string,
): express.RequestHandler => {
  const main = runMatcherWithFallback(runtimeModule.matcher, runtimeModule.fallback)

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      await Effect.unsafeRunPromise(
        Effect.gen(function* ($) {
          const window = makeServerWindow(req)
          const documentElement = window.document.documentElement

          documentElement.innerHTML = indexHtml
          documentElement.lang = 'en-us'

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const application = window.document.getElementById('application')!
          const fiber = yield* $(
            pipe(
              main,
              renderInto(application),
              provideServerIntrinsics(window, window, {
                parentElement: application,
                isBot: isbot(req.get('user-agent') ?? ''),
              }),
              Fx.drain,
              Effect.fork,
            ),
          )

          const exit = yield* $(fiber.await())

          if (Exit.isFailure(exit)) {
            return pipe(
              Cause.failureOrCause(exit.cause),
              either.match(
                (redirect) => res.redirect(redirect.path),
                (error) => next(new Error(prettyPrintCause(error))),
              ),
            )
          }

          return res.status(200).send(html5Doctype + documentElement.outerHTML)
        }),
      )
    } catch (error) {
      next(error)
    }
  }
}
