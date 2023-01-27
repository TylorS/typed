import { join } from 'path'

import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import * as Either from '@fp-ts/core/Either'
import { pipe } from '@fp-ts/core/Function'
import * as RA from '@fp-ts/core/ReadonlyArray'

import { runServerHandler } from '../runServerHandler.js'

import { getAllStaticPaths } from './getAllStaticPaths.js'

import {
  type RuntimeModule,
  type HtmlModule,
  runMatcherWithFallback,
  provideStaticIntrinsicsEffect,
  provideStaticIntrinsics,
} from '@typed/framework'

export function renderStaticHtml(
  htmlModule: HtmlModule,
  runtime: RuntimeModule,
  getParentElement: (d: Document) => HTMLElement | null,
  origin: string,
): Effect.Effect<never, never, ReadonlyArray<readonly [path: string, html: string]>> {
  return Effect.gen(function* ($) {
    const paths = yield* $(
      pipe(
        getAllStaticPaths(runtime),
        Effect.flatMap(
          Effect.forEach((path) =>
            Effect.sync(() => {
              const fullPath = join(htmlModule.basePath, path)

              return htmlModule.basePath === fullPath && fullPath !== '/'
                ? fullPath + '/'
                : fullPath
            }),
          ),
        ),
        provideStaticIntrinsicsEffect(
          htmlModule.makeWindow({ url: new URL(htmlModule.basePath, origin).href }),
        ),
      ),
    )
    const htmlOutputs = Array.from(
      yield* $(
        pipe(
          paths,
          Effect.forEach((path) =>
            renderStaticHtmlPath(htmlModule, getParentElement, runtime, path, origin),
          ),
        ),
      ),
    )

    return RA.zip(htmlOutputs)(paths)
  })
}

function renderStaticHtmlPath(
  htmlModule: HtmlModule,
  getParentElement: (d: Document) => HTMLElement | null,
  runtime: RuntimeModule,
  path: string,
  origin: string,
): Effect.Effect<never, never, string> {
  return Effect.gen(function* ($) {
    const url = new URL(path, origin).href
    const main = runMatcherWithFallback(runtime.matcher, runtime.fallback)

    const exit = yield* $(
      runServerHandler(htmlModule, getParentElement, main, url, (w, e) =>
        provideStaticIntrinsics(w, { parentElement: e }),
      ),
    )

    if (Exit.isFailure(exit)) {
      return yield* $(
        pipe(
          Cause.failureOrCause(exit.cause),
          Either.match(
            (redirect) =>
              renderStaticHtmlPath(htmlModule, getParentElement, runtime, redirect.path, origin),
            Effect.failCause,
          ),
        ),
      )
    }

    return exit.value
  })
}
