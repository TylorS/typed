/**
 * runtime:./path/to/modules is the base way to constructing a graph
 * of related modules together by routes, renderables, and layouts.
 */
declare module 'runtime:*' {
  import type { RouteMatcher, Redirect } from '@typed/router'

  import type { Fallback, Module, IntrinsicServices } from '@typed/framework'

  export const modules: ReadonlyArray<Module<IntrinsicServices, never, string>>

  export const matcher: RouteMatcher<IntrinsicServices, Redirect>

  export const fallback: Fallback | null
}

/**
 * browser:./path/to/modules extends module:* by
 * adding a render function that can be used to render the application
 * provided with all IntrinsicServices and handles redirects.
 */
declare module 'browser:*' {
  import type { Fx } from '@typed/fx'

  /**
   * Render the application given a parent element
   */
  export const render: <T extends HTMLElement>(parentElement: T) => Fx<never, never, T>

  /**
   * Re-exports from module
   */
  export * from 'runtime:*'
}

/**
 * html:*.html helps load associated HTML template as a string and potentially
 * an asset directory where you can serve any assets it requires from.
 *
 * TODO: Should have helpers for constructing happy-dom instance
 */
declare module 'html:*' {
  import type * as happyDom from 'happy-dom'

  import type { ServerWindowOptions } from '@typed/framework/makeServerWindow'

  /**
   * The path to the directory where assets will be found
   */
  export const assetDirectory: string

  /**
   * The html to utilize for rendering
   */
  export const html: string

  /**
   * Html attributes that should be re-added to the document element
   */
  export const htmlAttributes: Record<string, string>

  /**
   * The docType of the html
   */
  export const docType: string

  /**
   * The basePath of the html
   */
  export const basePath: string

  /**
   * Construct a server-side implementation of Window & GlobalThis
   */
  export function makeWindow(
    options: ServerWindowOptions,
  ): Window & typeof globalThis & Pick<InstanceType<typeof happyDom.Window>, 'happyDOM'>
}

declare module 'api:*' {
  import type { FetchHandler } from '@typed/framework/api'

  export const handlers: ReadonlyArray<FetchHandler<never, never, string>>
}

declare module 'express:*' {
  import type { Router } from 'express'

  export const router: Router

  export * from 'api:*'
}

declare module 'typed:config' {
  export const sourceDirectory: string

  export const tsConfig: string

  export const serverFilePath: string

  export const clientOutputDirectory: string

  export const serverOutputDirectory: string

  export const htmlFiles: readonly string[]

  export const debug: boolean

  export const saveGeneratedModules: boolean

  export const base: string
}
