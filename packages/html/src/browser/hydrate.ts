import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { RenderContext, makeRenderContext } from '../RenderContext.js'
import { RenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { Rendered } from '../Rendered.js'

import { HydrateContext, hydrateTemplateInDom } from './HydrateTemplate.js'
import { BrowserCache, findRootParentChildNodes, getBrowserCache } from './cache.js'

export function hydrate<R, E>(
  what: Fx.Fx<R, E, RenderEvent>,
  where: HTMLElement,
): Fx.Fx<Exclude<R, Document | RenderContext | RenderTemplate>, E, RenderEvent> {
  const renderContext = makeRenderContext({ environment: 'browser' })
  const ctx: HydrateContext = {
    where: findRootParentChildNodes(where),
    rootIndex: -1,
    parentTemplate: null,
    hydrate: true,
  }
  const { context } = Document.build(where.ownerDocument)
    .add(RenderContext, renderContext)
    .add(HydrateContext, ctx)

  const layer = Layer.provideMerge(Layer.succeedContext(context), hydrateTemplateInDom)
  const cache = getBrowserCache(renderContext.renderCache, where)

  return Fx.provideSomeLayer(
    Fx.tap(what, (event) => {
      ctx.hydrate = false
      return attachRoot(cache, where, event)
    }),
    layer,
  ) as Fx.Fx<Exclude<R, Document | RenderContext | RenderTemplate>, E, RenderEvent>
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

      const previouslyHadWire = cache.wire

      cache.wire = wire

      if (wire) {
        const value = wire.valueOf()

        // Only replace children after the first render
        if (previouslyHadWire) where.replaceChildren(...(Array.isArray(value) ? value : [value]))
      }
    }
  })
}
