import { pipe } from '@fp-ts/data/Function'
import * as Router from '@typed/Router'
import { makeDomServices } from '@typed/dom/DomServices'
import { GlobalThis } from '@typed/dom/GlobalThis'
import { Window } from '@typed/dom/Window'
import * as Fx from '@typed/fx'
import { Environment, RenderContext } from '@typed/html'

import { IntrinsicServices } from './IntrinsicServices.js'

export function provideIntrinsics(environment: Environment, isBot?: boolean) {
  return (window: Window, globalThis: GlobalThis) =>
    <E, A>(fx: Fx.Fx<IntrinsicServices, E, A>): Fx.Fx<never, E, A> =>
      pipe(
        fx,
        Fx.provideSomeLayer(Router.live),
        Fx.provideSomeEnvironment(makeDomServices(window, globalThis)),
        RenderContext.provideFx(RenderContext(environment, isBot)),
      )
}
