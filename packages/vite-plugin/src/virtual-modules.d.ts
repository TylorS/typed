declare module 'virtual:browser-entry:*' {
  import { Module, IntrinsicServices } from '@typed/framework'
  import { Renderable } from '@typed/html'
  import { RouteMatcher, Redirect } from '@typed/router'

  export const modules: ReadonlyArray<Module<IntrinsicServices, string>>

  export const matcher: RouteMatcher<IntrinsicServices, Redirect>

  export const main: Fx<IntrinsicServices, Redirect, Renderable>

  export const render: <T extends HTMLElement>(parentElement: T) => Fx<never, never, T>
}

declare module 'virtual:server-entry:*' {
  import { IntrinsicServices } from '@typed/framework'
  import { Renderable } from '@typed/html'
  import { RouteMatcher, Redirect } from '@typed/router'
  import express from 'express'
  import expressStaticGzip from 'express-static-gzip'

  export const app: express.Express

  export const clientDirectory: string

  export function staticGzip(
    options?: expressStaticGzip.ExpressStaticGzipOptions,
  ): express.RequestHandler

  export const modules: ReadonlyArray<Module<IntrinsicServices, string>>

  export const matcher: RouteMatcher<IntrinsicServices, Redirect>

  export const main: Fx<IntrinsicServices, Redirect, Renderable>

  export const indexHtml: string

  export const requestHandler: express.RequestHandler

  export const listen: typeof app['listen']

  type ArgsOf<T> = T extends (...args: infer A) => any ? A : never
}
