import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { RenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { Rendered } from '../Rendered.js'

import { renderTemplateToDom } from './RenderTemplate.js'
import { BrowserCache, getBrowserCache } from './cache.js'

export function render<R, E>(
  what: Fx.Fx<R, E, RenderEvent>,
  where: HTMLElement,
): Fx.Fx<Exclude<R, Document | RenderContext | RenderTemplate>, E, RenderEvent> {
  const renderContext = makeRenderContext({ environment: 'browser' })
  const { context } = Document.build(where.ownerDocument).merge(RenderContext.build(renderContext))
  const layer = Layer.provideMerge(Layer.succeedContext(context), renderTemplateToDom)
  const cache = getBrowserCache(renderContext.renderCache, where)

  return Fx.provideSomeLayer(
    Fx.tap(what, (event) => attachRoot(cache, where, event)),
    layer,
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
