/// <reference types="vite/client" />

import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { either } from '@fp-ts/data'
import { pipe } from '@fp-ts/data/function'
import { makeServerWindowFromExpress, html5Doctype } from '@typed/compiler/index.js'
import { runPages, provideServerIntrinsics } from '@typed/framework/index.js'
import express from 'express'
import isbot from 'isbot'
import httpDevServer from 'vavite/http-dev-server'

import * as Fx from '@typed/fx/index.js'
import { renderInto } from '@typed/html/index.js'

const app = express()

const directory = dirname(fileURLToPath(import.meta.url))
const clientDirectory = import.meta.env.PROD ? join(directory, '../client') : directory

if (import.meta.env.PROD) {
  // TODO: Handle mapping assets to a CDN in production
  // eslint-disable-next-line import/no-named-as-default-member
  app.use(express.static(clientDirectory))
}

const pages = import.meta.glob('./pages/**/*', { eager: true })
const main = runPages(pages)

const indexHtml: string = readFileSync(join(clientDirectory, 'index.html'))
  .toString()
  .replace(/<html.+>/, '')
  .replace('</html>', '')

const prettyPrintCause = Cause.pretty()

app.use(async (req, res, next) => {
  const window = makeServerWindowFromExpress(req)
  const documentElement = window.document.documentElement

  documentElement.innerHTML = indexHtml

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const application = window.document.getElementById('application')!

  const program = Effect.gen(function* ($) {
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
  })

  try {
    await Effect.unsafeRunPromise(program)
  } catch (e) {
    return next(e)
  }
})

if (httpDevServer) {
  httpDevServer.on('request', app)
} else {
  console.log('Starting prod server')
  app.listen(3000)
}
