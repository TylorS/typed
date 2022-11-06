import * as Effect from '@effect/core/io/Effect'
import * as T from '@tsplus/stdlib/service/Tag'

import type { RenderCache } from './RenderCache.js'
import type { TemplateCache } from './TemplateCache.js'

export interface RenderContext {
  readonly context: 'server' | 'client'
  readonly renderCache: WeakMap<HTMLElement | DocumentFragment, RenderCache>
  readonly templateCache: WeakMap<TemplateStringsArray, TemplateCache>
}

export function RenderContext(context: RenderContext['context']) {
  return {
    context,
    renderCache: new WeakMap(),
    templateCache: new WeakMap(),
  }
}

export namespace RenderContext {
  export const Tag: T.Tag<RenderContext> = T.Tag<RenderContext>()
  export const getRenderCache = Effect.serviceWith(Tag, (x) => x.renderCache)
  export const getTemplateCache = Effect.serviceWith(Tag, (x) => x.templateCache)

  export const provide = (context: RenderContext['context']) =>
    Effect.provideService<RenderContext>(Tag, RenderContext(context))
}
