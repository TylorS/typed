import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { either } from '@fp-ts/data'
import { pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'
import { renderInto } from '@typed/html'
import express from 'express'
import isbot from 'isbot'
import viteDevServer from 'vavite/vite-dev-server'

import {
  RuntimeModule,
  provideServerIntrinsics,
  runMatcherWithFallback,
  HtmlModule,
} from '@typed/framework'

const prettyPrintCause = Cause.pretty()

export const runExpressApp = (
  runtimeModule: RuntimeModule,
  htmlModule: HtmlModule,
  getParentElement: (doc: Document) => HTMLElement | null,
): express.RequestHandler => {
  const main = runMatcherWithFallback(runtimeModule.matcher, runtimeModule.fallback)

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      await Effect.unsafeRunPromise(
        Effect.gen(function* ($) {
          const window = htmlModule.makeWindow(req)

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const parentElement = getParentElement(window.document)

          if (!parentElement) {
            return yield* $(Effect.dieMessage(`Unable to find parent element`))
          }

          const fiber = yield* $(
            pipe(
              main,
              renderInto(parentElement),
              provideServerIntrinsics(window, {
                parentElement,
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

          return res
            .status(200)
            .send(htmlModule.docType + window.document.documentElement.outerHTML)
        }),
      )
    } catch (error) {
      if (error instanceof Error && viteDevServer) {
        viteDevServer.ssrFixStacktrace(error)
      }

      next(error)
    }
  }
}
