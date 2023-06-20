import * as Effect from '@effect/io/Effect'
import { Sink } from '@typed/fx'

import { RenderContext } from '../RenderContext.js'
import { TemplateResult } from '../TemplateResult.js'

import { getTemplateCache } from './getTemplateCache.js'
import { AttrPart } from './part/AttrPart.js'
import { PartChunk, SparsePartChunk } from './templateToHtmlChunks.js'

export function resultToTemplateInstance(result: TemplateResult, context: RenderContext) {
  const { template, chunks } = getTemplateCache(result.template, context.templateCache)

  return <R2>(sink: Sink<R2, never, string>) => {
    return Effect.gen(function* ($) {
      let partIndex = 0
      const textForPartIndex = new Map<number, string>()
      const remaining = [...chunks]

      function findNextPartIndex() {

      }


      function emitHtml(index: number) {
        return Effect.gen(function* ($) {

        })
      }

      function handlePart(part: PartChunk) {
        // eslint-disable-next-line require-yield
        return Effect.gen(function* ($) {
          const index = part.node.index
          const value = result.values[part.node.index]

          switch (part.node.type) {
            case 'attr': {
              const attr = new AttrPart((value) => on)
            }
          }
        })
      }

      function handleSparsePart(part: SparsePartChunk) {
        return Effect.gen(function* ($) {})
      }

      for (let i = 0; i < chunks.length; ++i) {
        const chunk = chunks[i]

        if (chunk.type === 'text') {
          if (i === 0) {
            yield* $(sink.event(chunk.value))
          }
        } else if (chunk.type === 'part') {
          partIndex += 1
          yield* $(handlePart(chunk))
        } else {
          partIndex += chunk.node.nodes.length
          yield* $(handleSparsePart(chunk))
        }
      }
    })
  }
}
