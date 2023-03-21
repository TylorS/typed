import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { Tag } from '@typed/context'
import type { Express } from 'express'
import express from 'express'

import type { HtmlModule } from '../HtmlModule.js'
import type { RuntimeModule } from '../RuntimeModule.js'
import type { FetchHandler, ResourcesOf } from '../api.js'

import * as A from './assets.js'
import * as L from './listen.js'
import * as REH from './registerExpressHandlers.js'
import * as REA from './runExpressApp.js'

export interface ExpressService {
  readonly app: Express
}

export const ExpressService = Tag<ExpressService>()

export function app<R, E, A>(effect: Effect.Effect<R, E, A>) {
  return Effect.suspend(() => pipe(effect, ExpressService.provide({ app: express() })))
}

export function api<Handlers extends readonly FetchHandler<any, never, any>[]>(
  baseUrl: string,
  handlers: Handlers,
): Effect.Effect<ExpressService | ResourcesOf<Handlers[number]>, never, void> {
  return ExpressService.withEffect(({ app }) =>
    Effect.contextWith<ResourcesOf<Handlers[number]>, void>((context) =>
      app.use(baseUrl, REH.registerExpressHandlers(handlers.map((h) => h.provideContext(context)))),
    ),
  )
}

export function assets(
  basePath: string,
  url: ImportMeta['url'],
  html: readonly HtmlModule[],
  options?: import('express-static-gzip').ExpressStaticGzipOptions,
): Effect.Effect<ExpressService, never, void> {
  return ExpressService.with(({ app }) => app.use(basePath, A.assets(url, html, options)))
}

export function html(
  basePath: string,
  runtime: RuntimeModule,
  html: HtmlModule,
  getParentElement: (d: Document) => HTMLElement | null,
) {
  return ExpressService.with(({ app }) =>
    // Always use a splat to defer all routing to the internal router
    app.get(
      basePath + '*',
      // eslint-disable-next-line import/no-named-as-default-member
      REA.runExpressApp(runtime, html, getParentElement),
    ),
  )
}

export function listen(options: L.ListenOptions) {
  return ExpressService.withEffect(({ app }) => {
    return Effect.promise(
      () =>
        new Promise<{ readonly port: number; readonly host: string }>((resolve) =>
          L.listen(app, options, (port, host) => resolve({ port, host: host || 'localhost' })),
        ),
    )
  })
}
