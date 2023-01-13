import * as Effect from '@effect/io/Effect'
import { flow, pipe } from '@fp-ts/data/Function'
import { makeDomServices } from '@typed/dom/DomServices'
import type { GlobalThis } from '@typed/dom/GlobalThis'
import type { Window } from '@typed/dom/Window'
import * as Fx from '@typed/fx'
import { type Environment, RenderContext } from '@typed/html'
import * as Router from '@typed/router'
import { Redirect } from '@typed/router'

import type { IntrinsicServices } from './IntrinsicServices.js'

export interface ProvideIntrinsicsOptions {
  readonly environment: Environment
  readonly window: Window
  readonly globalThis: GlobalThis
  readonly currentPath?: Fx.RefSubject<string>
  readonly isBot?: boolean
  readonly parentElement?: HTMLElement
}

export function provideIntrinsics(options: ProvideIntrinsicsOptions) {
  return <E, A>(fx: Fx.Fx<IntrinsicServices, E, A>): Fx.Fx<never, E, A> =>
    pipe(
      fx,
      Fx.provideSomeLayer(Router.live(options.currentPath)),
      Fx.provideSomeEnvironment(
        makeDomServices(options.window, options.globalThis, options.parentElement),
      ),
      RenderContext.provideFx(RenderContext(options.environment, options.isBot)),
    )
}

export type IntrinsicOptions = {
  readonly currentPath?: Fx.RefSubject<string>
  readonly parentElement?: HTMLElement
  readonly isBot?: boolean
}

export function provideBrowserIntrinsics(
  window: Window & GlobalThis,
  options?: IntrinsicOptions,
): <E, A>(fx: Fx.Fx<IntrinsicServices, E, A>) => Fx.Fx<never, Exclude<E, Redirect>, A> {
  return flow(
    provideIntrinsics({ ...options, environment: 'browser', window, globalThis: window }),
    Fx.switchMapErrorEffect((e) => {
      if (Redirect.is(e)) {
        return pipe(
          Effect.sync(() => window.history.pushState(null, '', e.path)),
          Effect.flatMap(Effect.never),
        )
      }

      return Effect.fail(e as Exclude<typeof e, Redirect>)
    }),
  )
}

export function provideServerIntrinsics(window: Window & GlobalThis, options?: IntrinsicOptions) {
  return provideIntrinsics({ ...options, environment: 'server', window, globalThis })
}

export function provideStaticIntrinsics(window: Window & GlobalThis, options?: IntrinsicOptions) {
  return provideIntrinsics({ ...options, environment: 'static', window, globalThis })
}
