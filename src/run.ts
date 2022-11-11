import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { DomSource, EventDelegationDomSource } from './DOM/DomSource.js'
import { Hole } from './HTML/Hole.js'
import { RenderContext } from './HTML/RenderContext.js'
import { renderInto } from './HTML/render.js'

export function run<T extends HTMLElement>(where: T) {
  return <R, E>(
    what: Fx.Fx<R | DomSource, E, Hole>,
  ): Effect.Effect<Document | Exclude<R, DomSource>, E, T> =>
    Effect.suspendSucceed(() => {
      const rootEl = Fx.HoldSubject.unsafeMake<never, T>()
      const domSource = EventDelegationDomSource(rootEl)

      return pipe(
        what,
        renderInto(where),
        Fx.runObserve(rootEl.emit),
        DomSource.provide(domSource),
        RenderContext.provide,
        Effect.as(where),
      )
    })
}
