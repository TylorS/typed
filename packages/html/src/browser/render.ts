import * as Effect from '@effect/io/Effect'
import { Document, RootElement } from '@typed/dom'
import * as Fx from '@typed/fx'

import { RenderContext } from '../RenderContext.js'
import { RenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { Rendered } from '../Rendered.js'

import { renderTemplateToDom } from './RenderTemplate.js'
import { BrowserCache, getBrowserCache } from './cache.js'

export function render<R, E>(
  what: Fx.Fx<R, E, RenderEvent>,
): Fx.Fx<RootElement | RenderContext | Document | Exclude<R, RenderTemplate>, E, RenderEvent> {
  return Fx.fromFxEffect(
    Effect.map(
      RootElement.withEffect(({ rootElement }) =>
        RenderContext.with((ctx) => [rootElement, ctx] as const),
      ),
      ([where, renderContext]) => {
        const cache = getBrowserCache(renderContext.renderCache, where)

        return Fx.provideSomeLayer(
          Fx.tap(what, (event) => attachRoot(cache, where, event)),
          renderTemplateToDom,
        )
      },
    ),
  )
}

function attachRoot(
  cache: BrowserCache,
  where: HTMLElement,
  what: RenderEvent,
): Effect.Effect<never, never, void> {
  return Effect.sync(() => {
    const wire = what.valueOf() as Rendered

    if (wire !== cache.wire) {
      if (cache.wire && !wire) where.removeChild(cache.wire.valueOf() as globalThis.Node)

      cache.wire = wire

      if (wire) where.replaceChildren(wire.valueOf() as globalThis.Node)
    }
  })
}
