import { Fx } from '@typed/fx'
import { Renderable } from '@typed/html'
import { ParamsOf } from '@typed/path'
import { Route } from '@typed/route'
import * as Router from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'

export type Fallback = RenderableFallback | RedirectFallback<any>

export interface RenderableFallback {
  readonly type: 'Renderable'
  readonly fallback: (path: string) => Fx<IntrinsicServices, Router.Redirect, Renderable>
  readonly layout?: Fx<IntrinsicServices, Router.Redirect, Renderable>
}

export function RenderableFallback(
  fallback: (path: string) => Fx<IntrinsicServices, Router.Redirect, Renderable>,
  layout?: Fx<IntrinsicServices, Router.Redirect, Renderable>,
): RenderableFallback {
  return {
    type: 'Renderable',
    fallback,
    layout,
  }
}

export interface RedirectFallback<P extends string> {
  readonly type: 'Redirect'
  readonly route: Route<IntrinsicServices, P>
  readonly params?: ParamsOf<P>
}

export function RedirectFallback<P extends string>(
  route: Route<IntrinsicServices, P>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ...[params]: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): RedirectFallback<P> {
  return {
    type: 'Redirect',
    route,
    params: params as RedirectFallback<P>['params'],
  }
}
