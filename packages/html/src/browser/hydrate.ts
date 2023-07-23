import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { Document, RootElement } from '@typed/dom'
import * as Fx from '@typed/fx'

import { RenderContext } from '../RenderContext.js'
import { RenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { Rendered } from '../Rendered.js'

import { HydrateContext, hydrateTemplateInDom } from './HydrateTemplate.js'
import { BrowserCache, findRootParentChildNodes, getBrowserCache } from './cache.js'

export function hydrate<R, E>(
  what: Fx.Fx<R, E, RenderEvent>,
): Fx.Fx<
  RootElement | RenderContext | Document | Exclude<R, RenderTemplate | HydrateContext>,
  E,
  RenderEvent
> {
  return Fx.fromFxEffect(
    Effect.map(
      RootElement.withEffect(({ rootElement }) =>
        RenderContext.with((ctx) => [rootElement, ctx] as const),
      ),
      ([where, renderContext]) => {
        const ctx: HydrateContext = {
          where: findRootParentChildNodes(where),
          rootIndex: -1,
          parentTemplate: null,
          hydrate: true,
        }

        const layer = Layer.provideMerge(
          Layer.succeedContext(HydrateContext.build(ctx).context),
          hydrateTemplateInDom,
        )
        const cache = getBrowserCache(renderContext.renderCache, where)

        return Fx.provideSomeLayer(
          Fx.tap(what, (event) => attachRoot(cache, where, event)),
          layer,
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
