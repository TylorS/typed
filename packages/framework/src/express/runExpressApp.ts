import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Either from '@fp-ts/data/Either'
import { pipe } from '@fp-ts/data/Function'
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
          const url = new URL(req.url, getOriginFromRequest(req))
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
            return pipe(
              Cause.failureOrCause(exit.cause),
              Either.match(
                (redirect) => res.redirect(redirect.path),
                (error) => next(new Error(prettyPrintCause(error))),
              ),
            )
          }

          return res.status(200).send(exit.value)
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
