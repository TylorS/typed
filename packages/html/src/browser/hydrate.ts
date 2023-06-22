import * as Effect from '@effect/io/Effect'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { RenderContext } from '../RenderContext.js'
import { Rendered } from '../Rendered.js'
import { TemplateResult } from '../TemplateResult.js'
import { Template } from '../parser/parser.js'
import { NodePart } from '../part/NodePart.js'
import { Part, SparsePart } from '../part/Part.js'
import { unwrapRenderable } from '../part/updates.js'
import { ParentChildNodes } from '../paths.js'
import { isTemplateResult } from '../utils.js'

import {
  BrowserCache,
  BrowserEntry,
  CouldNotFindCommentError,
  CouldNotFindRootElement,
  findRootParentChildNodes,
  getBrowserCache,
  getHydrateEntry,
  makeEmptyBrowerCache,
} from './cache.js'
import { indexRefCounter } from './indexRefCounter.js'
import { renderTemplateResult } from './render.js'

// TODO: Add support for directives

export function hydrate<R, E>(
  what: Fx.Fx<R, E, TemplateResult>,
  where: HTMLElement,
): Fx.Fx<R | Document | RenderContext, E, Rendered | null> {
  return Document.withFx((document) =>
    RenderContext.withFx((renderContext) =>
      Fx.switchMapEffect(what, (result) =>
        hydrateRootTemplateResult(document, renderContext, result, where),
      ),
    ),
  )
}

export function hydrateRootTemplateResult<R, E>(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  where: HTMLElement,
): Effect.Effect<R, E, Rendered | null> {
  const cache = getBrowserCache(renderContext.renderCache, where)
  const rootPartChildNodes = findRootParentChildNodes(where)

  return Effect.gen(function* ($) {
    const wire = yield* $(
      hydrateTemplateResult<R, E>(document, renderContext, result, cache, rootPartChildNodes, -1),
      Effect.provideSomeContext(result.context),
    )

    if (wire !== cache.wire) {
      if (cache.wire && !wire) where.removeChild(cache.wire as globalThis.Node)

      cache.wire = wire
      // valueOf() simply returns the node itself, but in case it was a "wire"
      // it will eventually re-append all nodes to its fragment so that such
      // fragment can be re-appended many times in a meaningful way
      // (wires are basically persistent fragments facades with special behavior)
      if (wire) where.replaceChildren(wire.valueOf() as globalThis.Node)
    }

    return cache.wire
  })
}

export function hydrateTemplateResult<R, E>(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: BrowserCache,
  where: ParentChildNodes,
  rootIndex: number,
  parentTemplate: Template | null = null,
): Effect.Effect<R, E, Rendered | null> {
  return Effect.catchAllDefect(
    Effect.gen(function* ($) {
      let { entry } = cache

      if (!entry || entry.result.template !== result.template) {
        // The entry is changing, so we need to cleanup the previous one
        if (cache.entry) {
          yield* $(cache.entry.cleanup)
        }

        cache.entry = entry = getHydrateEntry(
          document,
          renderContext,
          result,
          cache,
          where,
          rootIndex,
          parentTemplate,
        )
      }

      const { template } = entry

      // Render all children before creating the wire
      if (template.parts.length > 0) {
        yield* $(hydratePlaceholders<R, E>(document, renderContext, result, cache, entry, where))
      }

      // Lazily creates the wire after all childNodes are available
      return entry.wire()
    }),
    (defect) => {
      // If we can't find a comment/rootElement then we need to render the result without hydration
      if (defect instanceof CouldNotFindCommentError || defect instanceof CouldNotFindRootElement) {
        return renderTemplateResult(document, renderContext, result, cache)
      } else {
        return Effect.die(defect)
      }
    },
  )
}

function hydratePlaceholders<R, E>(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: BrowserCache,
  entry: BrowserEntry,
  where: ParentChildNodes,
): Effect.Effect<R, E, void> {
  return Effect.provideSomeContext(
    Effect.catchAllCause(
      Effect.gen(function* ($) {
        const { values, sink } = result
        const { onReady, onValue } = yield* $(indexRefCounter(entry.parts.length))

        const renderNode = (part: NodePart) => (value: unknown) =>
          Effect.gen(function* ($) {
            if (isTemplateResult(value)) {
              const rendered = yield* $(
                hydrateTemplateResult<R, E>(
                  document,
                  renderContext,
                  value,
                  cache.stack[part.index] || (cache.stack[part.index] = makeEmptyBrowerCache()),
                  where,
                  part.index,
                  entry.template,
                ),
              )

              yield* $(part.update(rendered))
            } else {
              yield* $(part.update(value))
            }
          })

        const renderPart = (part: Part | SparsePart, index: number) =>
          Effect.provideSomeContext(
            Effect.gen(function* ($) {
              if (part._tag === 'Node') {
                const value = values[part.index]

                // If the value hasn't changed, don't re-render
                if (entry.values[part.index] === value) return yield* $(onValue(index))

                part.fibers.add(
                  yield* $(
                    unwrapRenderable(value),
                    Fx.switchMatchCauseEffect(sink.error, renderNode(part)),
                    Fx.observe(() => onValue(index)),
                    Effect.catchAllCause(sink.error),
                    Effect.fork,
                  ),
                )
              } else if (part._tag === 'SparseClassName' || part._tag === 'SparseAttr') {
                const renderables = part.parts.map((p) => values[p.index])

                // TODO: Need to support diffing these values

                part.fibers.add(
                  yield* $(
                    part.observe(
                      renderables,
                      Fx.Sink(() => onValue(index), sink.error),
                    ),
                    Effect.fork,
                  ),
                )
              } else {
                const value = values[part.index]

                // If the value hasn't changed, don't re-render
                if (entry.values[part.index] === value) return yield* $(onValue(index))

                part.fibers.add(
                  yield* $(
                    part.observe(
                      value,
                      Fx.Sink(() => onValue(index), sink.error),
                    ),
                    Effect.fork,
                  ),
                )
              }
            }),
            result.context,
          )

        yield* $(Effect.all(entry.parts.map(renderPart)))

        yield* $(onReady)
      }),
      result.sink.error,
    ),
    result.context,
  )
}
