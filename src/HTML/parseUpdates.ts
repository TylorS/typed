import * as Effect from '@effect/core/io/Effect'

import { importNode } from '../DOM/Document.js'

import type { Entry } from './Entry.js'
import { Hole } from './Hole.js'
import { RenderContext } from './RenderContext.js'
import { TemplateCache } from './TemplateCache.js'
import { parseTemplate } from './parseTemplate.js'

export function parseUpdates(
  hole: Hole,
): Effect.Effect<RenderContext | Document, never, Pick<Entry, 'content' | 'updates'>> {
  return Effect.gen(function* ($) {
    const cache = yield* $(RenderContext.getTemplateCache)
    if (!cache.has(hole.template)) {
      cache.set(hole.template, yield* $(parseTemplate(hole)))
    }
    const templateCache = cache.get(hole.template) as TemplateCache
    const content = yield* $(importNode(templateCache.content, true))

    // TODO: Generate Update functions
    // const runtime = yield* $(Effect.runtime<R>())
    const updates: Entry['updates'] = Array.from(
      yield* $(
        Effect.forEach(templateCache.holes, () => Effect.succeed(() => Effect.succeed(void 0))),
      ),
    )

    return {
      content,
      updates,
    }
  })
}
