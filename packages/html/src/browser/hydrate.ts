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
import { renderRootTemplateResult, renderTemplateResult } from './render.js'

// TODO: Add support for directives

type HydateContext = {
  hydrate: boolean
  document: Document
  renderContext: RenderContext
}

export function hydrate<R, E>(
  what: Fx.Fx<R, E, TemplateResult>,
  where: HTMLElement,
): Fx.Fx<R | Document | RenderContext, E, Rendered | null> {
  return Document.withFx((document) =>
    RenderContext.withFx((renderContext) => {
      const hydrateContext: HydateContext = { hydrate: true, document, renderContext }

      return Fx.switchMapEffect(what, (result) =>
        hydrateRootTemplateResult(hydrateContext, result, where),
      )
    }),
  )
}

export function hydrateRootTemplateResult<R, E>(
  hydrateContext: HydateContext,
  result: TemplateResult,
  where: HTMLElement,
): Effect.Effect<R, E, Rendered | null> {
  const cache = getBrowserCache(hydrateContext.renderContext.renderCache, where)
  const rootPartChildNodes = findRootParentChildNodes(where)

  return Effect.gen(function* ($) {
    if (rootPartChildNodes.childNodes.length === 0) {
      return yield* $(renderRootTemplateResult<R, E>(hydrateContext.document, hydrateContext.renderContext, result, where))
    }

    const wire = yield* $(
      hydrateTemplateResult<R, E>(hydrateContext, result, cache, rootPartChildNodes, -1),
    )

    if (wire !== cache.wire) {
      if (cache.wire && !wire) {
        const nodes = cache.wire.valueOf()

        if (Array.isArray(nodes)) {
          nodes.forEach((node) => where.removeChild(node))
        } else {
          where.removeChild(nodes as globalThis.Node)
        }
      }

      cache.wire = wire

      // valueOf() simply returns the node itself, but in case it was a "wire"
      // it will eventually re-append all nodes to its fragment so that such
      // fragment can be re-appended many times in a meaningful way
      // (wires are basically persistent fragments facades with special behavior)
      if (wire) {
        const nodes = wire.valueOf()

        where.replaceChildren(...(Array.isArray(nodes) ? nodes : [nodes]))
      }
    }

    hydrateContext.hydrate = false

    return cache.wire
  })
}

export function hydrateTemplateResult<R, E>(
  hydrateContext: HydateContext,
  result: TemplateResult,
  cache: BrowserCache,
  where: ParentChildNodes,
  rootIndex: number,
  parentTemplate: Template | null = null,
): Effect.Effect<R, E, Rendered | null> {
  return Effect.catchAllDefect(
    Effect.provideSomeContext(
      Effect.gen(function* ($) {
        if (!hydrateContext.hydrate) {
          return yield* $(
            renderTemplateResult<R, E>(
              hydrateContext.document,
              hydrateContext.renderContext,
              result,
              cache,
            ),
          )
        }

        let { entry } = cache

        if (!entry || entry.result.template !== result.template) {
          if (cache.entry) {
            // The entry is changing, so we need to cleanup the previous one
            yield* $(cache.entry.cleanup)

            // We also need to switch to "standard" rendering
            return yield* $(
              renderTemplateResult<R, E>(
                hydrateContext.document,
                hydrateContext.renderContext,
                result,
                cache,
              ),
            )
          }

          cache.entry = entry = getHydrateEntry(
            { document: hydrateContext.document, renderContext: hydrateContext.renderContext, result, browserCache: cache, where, rootIndex, parentTemplate },
          )
        }

        const { template } = entry

        // Render all children before creating the wire
        if (template.parts.length > 0) {
          yield* $(hydratePlaceholders<R, E>(hydrateContext, result, cache, entry, where))
        }

        // Lazily creates the wire after all childNodes are available
        return entry.wire()
      }),
      result.context,
    ),
    (defect) => {
      // If we can't find a comment/rootElement then we need to render the result without hydration
      if (defect instanceof CouldNotFindCommentError || defect instanceof CouldNotFindRootElement) {
        return renderTemplateResult(document, hydrateContext.renderContext, result, cache)
      } else {
        return Effect.die(defect)
      }
    },
  )
}

function hydratePlaceholders<R, E>(
  hydrateContext: HydateContext,

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
                  hydrateContext,
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
                const renderables = part.parts.map((p) =>
                  p._tag === 'StaticText' ? p.text : values[p.index],
                )

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
