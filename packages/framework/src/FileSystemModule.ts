import type { Layer } from '@effect/io/Layer'
import type { Fx } from '@typed/fx'
import type { Renderable } from '@typed/html'
import type { ParamsOf } from '@typed/path'
import type { Route } from '@typed/route'
import type { Redirect } from '@typed/router'

import type { IntrinsicServices } from './IntrinsicServices.js'
import type { Main } from './Module.js'

/**
 * The possible configurations of a Module that the runtime, and @typed/compiler,
 * are capable of handling.
 */
export type FileSystemModule<R, P extends string> =
  | RenderModule<R, P>
  | LayoutModule<R>
  | RedirectModule<R, P>
  | FallbackModule<R>

export type RenderModule<R, P extends string> =
  | BaseRenderModule<P>
  | MainRenderModuleWithEnvironment<R, P>

export interface BaseRenderModule<P extends string> {
  readonly _tag: 'Render/Basic'

  readonly route: Route<IntrinsicServices, P> | Route<never, P>

  readonly main: Main<IntrinsicServices, this['route']> | Main<never, this['route']>
}

export interface MainRenderModuleWithEnvironment<R, P extends string> {
  readonly _tag: 'Render/Main/Environment'

  readonly route: Route<R | IntrinsicServices, P> | Route<IntrinsicServices, P> | Route<never, P>

  readonly main:
    | Main<R | IntrinsicServices, this['route']>
    | Main<R, this['route']>
    | Main<never, this['route']>

  readonly environment:
    | Layer<IntrinsicServices, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<never, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<IntrinsicServices, never, Exclude<R, IntrinsicServices>>
    | Layer<never, never, Exclude<R, IntrinsicServices>>
}

export type LayoutModule<R> = BasicLayoutModule | LayoutModuleWithEnvironment<R>

export interface BasicLayoutModule {
  readonly _tag: 'Layout/Basic'

  readonly layout:
    | Fx<IntrinsicServices, Redirect, Renderable>
    | Fx<never, Redirect, Renderable>
    | Fx<IntrinsicServices, never, Renderable>
    | Fx<never, never, Renderable>
}

export interface LayoutModuleWithEnvironment<R> {
  readonly _tag: 'Layout/Environment'

  readonly layout:
    | Fx<R | IntrinsicServices, Redirect, Renderable>
    | Fx<R, Redirect, Renderable>
    | Fx<never, Redirect, Renderable>
    | Fx<R | IntrinsicServices, never, Renderable>
    | Fx<R, never, Renderable>
    | Fx<never, never, Renderable>

  readonly environment:
    | Layer<IntrinsicServices, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<never, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<IntrinsicServices, never, Exclude<R, IntrinsicServices>>
    | Layer<never, never, Exclude<R, IntrinsicServices>>
}

export type RedirectModule<R, P extends string> =
  | BasicRedirectModule<P>
  | RedirectModuleWithEnvironment<R, P>

export interface BasicRedirectModule<P extends string> {
  readonly _tag: 'Redirect/Basic'
  readonly route: Route<IntrinsicServices, P> | Route<never, P>
  readonly params: [keyof ParamsOf<P>] extends [never] ? undefined : ParamsOf<P>
}

export interface RedirectModuleWithEnvironment<R, P extends string> {
  readonly _tag: 'Redirect/Environment'

  readonly route: Route<R | IntrinsicServices, P> | Route<IntrinsicServices, P> | Route<never, P>

  readonly environment:
    | Layer<IntrinsicServices, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<never, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<IntrinsicServices, never, Exclude<R, IntrinsicServices>>
    | Layer<never, never, Exclude<R, IntrinsicServices>>

  readonly params: [keyof ParamsOf<P>] extends [never] ? undefined : ParamsOf<P>
}

export type FallbackModule<R> = BasicFallbackModule | FallbackModuleWithEnvironment<R>

export interface BasicFallbackModule {
  readonly _tag: 'Fallback/Basic'

  readonly fallback:
    | Fx<IntrinsicServices, Redirect, Renderable>
    | Fx<never, Redirect, Renderable>
    | Fx<IntrinsicServices, never, Renderable>
    | Fx<never, never, Renderable>
}

export interface FallbackModuleWithEnvironment<R> {
  readonly _tag: 'Fallback/Environment'

  readonly fallback:
    | Fx<R | IntrinsicServices, Redirect, Renderable>
    | Fx<IntrinsicServices, Redirect, Renderable>
    | Fx<never, Redirect, Renderable>
    | Fx<R | IntrinsicServices, never, Renderable>
    | Fx<IntrinsicServices, never, Renderable>
    | Fx<never, never, Renderable>

  readonly environment:
    | Layer<IntrinsicServices, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<never, Redirect, Exclude<R, IntrinsicServices>>
    | Layer<IntrinsicServices, never, Exclude<R, IntrinsicServices>>
    | Layer<never, never, Exclude<R, IntrinsicServices>>
}
