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
  const parentChildNodes = findRootParentChildNodes(where)
  const renderContext = makeRenderContext({ environment: 'browser' })
  const { context } = Document.build(where.ownerDocument)
    .merge(RenderContext.build(renderContext))
    .merge(HydrateContext.build({ where: parentChildNodes, rootIndex: -1, parentTemplate: null }))
  const layer = Layer.provideMerge(Layer.succeedContext(context), hydrateTemplateInDom)
  const cache = getBrowserCache(renderContext.renderCache, where)

  return Fx.provideSomeLayer(
    Fx.tap(what, (event) => attachRoot(cache, where, event)),
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

      cache.wire = wire
      // valueOf() simply returns the node itself, but in case it was a "wire"
      // it will eventually re-append all nodes to its fragment so that such
      // fragment can be re-appended many times in a meaningful way
      // (wires are basically persistent fragments facades with special behavior)
      if (wire) {
        const value = wire.valueOf()

        where.replaceChildren(...(Array.isArray(value) ? value : [value]))
      }
    }
  })
}
