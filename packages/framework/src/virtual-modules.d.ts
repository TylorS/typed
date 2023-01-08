/**
 * typed:module:./path/to/modules is the base way to constructing a graph
 * of related modules together by routes, renderables, and layouts.
 */
declare module 'typed:modules:*' {
  import { RouteMatcher, Redirect } from '@typed/router'

  import { Fallback, Module, IntrinsicServices } from '@typed/framework'

  export const modules: ReadonlyArray<Module<IntrinsicServices, string>>

  export const matcher: RouteMatcher<IntrinsicServices, Redirect>

  export const fallback: Fallback | null
}

/**
 * typed:browser:./path/to/modules extends typed:module:* by
 * adding a render function that can be used to render the application
 * provided with all IntrinsicServices and handles redirects.
 */
declare module 'typed:browser:*' {
  import { Fx } from '@typed/fx'

  /**
   * Render the application given a parent element
   */
  export const render: <T extends HTMLElement>(parentElement: T) => Fx<never, never, T>

  /**
   * Re-exports from typed:module
   */
  export * from 'typed:modules:*'
}

/**
 * typed:server:*.html helps load associated HTML template as a string and potentially
 * an asset directory where you can serve any assets it requires from.
 *
 * TODO: Should have helpers for constructing happy-dom instance
 */
declare module 'typed:html:*' {
  import { IncomingMessage } from 'http'

  import { ServerWindowOptions } from '@typed/framework'

  /**
   * The path to the directory where assets will be found
   */
  export const assetDirectory: string | null

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
   * Construct a server-side implementation of Window & GlobalThis
   */
  export function makeWindow(
    req: IncomingMessage,
    options?: ServerWindowOptions,
  ): Window & typeof globalThis
}

declare module 'typed:api:*' {
  // TODO: We should have a way for constructing API modules here
}
