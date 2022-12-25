import { pipe } from '@fp-ts/data/Function'
import { makeDomServices } from '@typed/dom/DomServices'
import { GlobalThis } from '@typed/dom/GlobalThis'
import { Window } from '@typed/dom/Window'
import * as Fx from '@typed/fx'
import { Environment, RenderContext } from '@typed/html'
import * as Router from '@typed/router'

import { IntrinsicServices } from './IntrinsicServices.js'

export function provideIntrinsics(environment: Environment, isBot?: boolean) {
  return (window: Window, globalThis: GlobalThis, parentElement?: HTMLElement) =>
    <E, A>(fx: Fx.Fx<IntrinsicServices, E, A>): Fx.Fx<never, E, A> =>
      pipe(
        fx,
        Fx.provideSomeLayer(Router.live),
        Fx.provideSomeEnvironment(makeDomServices(window, globalThis, parentElement)),
        RenderContext.provideFx(RenderContext(environment, isBot)),
      )
}

export type IntrinsicOptions = {
  readonly parentElement?: HTMLElement
  readonly isBot?: boolean
}

export function provideBrowserIntrinsics(window: Window & GlobalThis, options?: IntrinsicOptions) {
  return provideIntrinsics('browser', options?.isBot)(window, window, options?.parentElement)
}

export function provideServerIntrinsics(
  window: Window,
  globalThis: GlobalThis,
  options?: IntrinsicOptions,
) {
  return provideIntrinsics('browser', options?.isBot)(window, globalThis, options?.parentElement)
}

export function provideStaticIntrinsics(
  window: Window,
  globalThis: GlobalThis,
  options?: IntrinsicOptions,
) {
  return provideIntrinsics('static', options?.isBot)(window, globalThis, options?.parentElement)
}
