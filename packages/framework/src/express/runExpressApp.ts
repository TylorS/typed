import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import type express from 'express'
import isbot from 'isbot'
import viteDevServer from 'vavite/vite-dev-server'

import { runServerHandler } from '../runServerHandler.js'

import { getOriginFromRequest } from './getOriginFromRequest.js'

import {
  type RuntimeModule,
  runMatcherWithFallback,
  type HtmlModule,
  provideServerIntrinsics,
} from '@typed/framework'

export const runExpressApp = (
  runtimeModule: RuntimeModule,
  htmlModule: HtmlModule,
  getParentElement: (doc: Document) => HTMLElement | null,
): express.RequestHandler => {
  const main = runMatcherWithFallback(runtimeModule.matcher, runtimeModule.fallback)

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* ($) {
            const url = new URL(req.url, getOriginFromRequest(req))

            yield* $(Effect.logInfo(`Handling request for ${url.pathname}`))

            const exit = yield* $(
              runServerHandler(
                htmlModule,
                getParentElement,
                main,
                url.href,
                (window, parentElement) =>
                  provideServerIntrinsics(window, {
                    parentElement,
                    isBot: isbot(req.get('user-agent')),
                  }),
              ),
            )

            if (Exit.isFailure(exit)) {
              yield* $(
                Effect.logErrorCauseMessage(
                  `Failure handler request for ${url.pathname}`,
                  exit.cause,
                ),
              )

              return pipe(
                Cause.failureOrCause(exit.cause),
                Either.match(
                  (redirect) => res.redirect(redirect.path),
                  (error) => next(new Error(Cause.pretty(error))),
                ),
              )
            }

            yield* $(Effect.logInfo(`Successfully handled request for ${url.pathname}`))

            return res.status(200).send(exit.value)
          }),
        ),
      )
    } catch (error) {
      if (error instanceof Error && viteDevServer) {
        viteDevServer.ssrFixStacktrace(error)
      }

      next(error)
    }
  }
}
