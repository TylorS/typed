import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { either } from '@fp-ts/data'
import { pipe } from '@fp-ts/data/function'
import { IntrinsicServices, provideServerIntrinsics } from '@typed/framework'
import * as Fx from '@typed/fx'
import { Renderable, renderInto } from '@typed/html'
import { Redirect } from '@typed/router'
import express from 'express'
import isbot from 'isbot'

import { html5Doctype, makeServerWindowFromExpress } from './makeServerWindow.js'

const prettyPrintCause = Cause.pretty()

export const runExpressApp =
  (
    main: Fx.Fx<IntrinsicServices, Redirect, Renderable>,
    indexHtml: string,
  ): express.RequestHandler =>
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      await Effect.unsafeRunPromise(
        Effect.gen(function* ($) {
          const window = makeServerWindowFromExpress(req)
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
