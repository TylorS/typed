import { pipe } from '@effect/data/Function'
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

export function hydrateRootTemplateResult(
  hydrateContext: HydateContext,
  result: TemplateResult,
  where: HTMLElement,
): Effect.Effect<never, never, Rendered | null> {
  const cache = getBrowserCache(hydrateContext.renderContext.renderCache, where)
  const rootPartChildNodes = findRootParentChildNodes(where)

  // If we can't find where to hydrate, we render normally
  if (rootPartChildNodes.childNodes.length === 0) {
    return renderRootTemplateResult(
      hydrateContext.document,
      hydrateContext.renderContext,
      result,
      where,
    )
  }

  return Effect.tap(
    hydrateTemplateResult(hydrateContext, result, cache, rootPartChildNodes, -1),
    (wire) =>
      Effect.sync(() => {
        cache.wire = wire
        // We only utilize hydration the first time around
        hydrateContext.hydrate = false
      }),
  )
}

export function hydrateTemplateResult(
  hydrateContext: HydateContext,
  result: TemplateResult,
  cache: BrowserCache,
  where: ParentChildNodes,
  rootIndex: number,
  parentTemplate: Template | null = null,
): Effect.Effect<never, never, Rendered | null> {
  return Effect.catchAllDefect(
    Effect.suspend(() => {
      let { entry } = cache

      if (!entry || entry.result.template !== result.template) {
        if (cache.entry) {
          return Effect.flatMap(Effect.uninterruptible(cache.entry.cleanup), () =>
            renderTemplateResult(
              hydrateContext.document,
              hydrateContext.renderContext,
              result,
              cache,
            ),
          )
        }

        cache.entry = entry = getHydrateEntry({
          document: hydrateContext.document,
          renderContext: hydrateContext.renderContext,
          result,
          browserCache: cache,
          where,
          rootIndex,
          parentTemplate,
        })
      }

      const { template } = entry

      // TODO: Handle lazily instantiating parts

      // Render all children before creating the wire
      if (template.parts.length > 0) {
        return pipe(
          hydratePlaceholders(hydrateContext, result, cache, entry, where),
          Effect.catchAllCause(result.sink.error),
          Effect.provideContext(result.context),
          Effect.map(entry.wire),
        )
      }

      // Lazily creates the wire after all childNodes are available
      return Effect.succeed(entry.wire())
    }),
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

function hydratePlaceholders(
  hydrateContext: HydateContext,
  result: TemplateResult,
  cache: BrowserCache,
  entry: BrowserEntry,
  where: ParentChildNodes,
): Effect.Effect<any, any, void> {
  const { values, sink } = result

  if (result.values === entry.values) return Effect.unit()

  return Effect.flatMap(indexRefCounter(entry.parts.length), ({ onReady, onValue }) => {
    const renderNode = (part: NodePart) => (value: unknown) =>
      Effect.suspend(() => {
        if (isTemplateResult(value)) {
          return Effect.flatMap(
            hydrateTemplateResult(
              hydrateContext,
              value,
              cache.stack[part.index] || (cache.stack[part.index] = makeEmptyBrowerCache()),
              where,
              part.index,
              entry.template,
            ),
            part.update,
          )
        } else if (Array.isArray(value)) {
          // TODO: Diff the array of values against the stack somehow

          const arrayCache =
            cache.stack[part.index] || (cache.stack[part.index] = makeEmptyBrowerCache())

          const effects: Effect.Effect<any, any, any>[] = []
          // Cleanup up entries that have been removed from the array
          for (let j = value.length; j < arrayCache.stack.length; j++) {
            const arrayStackItem = arrayCache.stack[j]

            if (arrayStackItem && arrayStackItem.entry) {
              effects.push(arrayStackItem.entry.cleanup)
              arrayCache.stack[j] = null
            }
          }

          return Effect.flatMap(Effect.forkDaemon(Effect.all(effects)), () =>
            Effect.flatMap(
              Effect.allPar(
                value.map((v, i) =>
                  isTemplateResult(v)
                    ? hydrateTemplateResult(
                        hydrateContext,
                        v,
                        arrayCache.stack[i] || (arrayCache.stack[i] = makeEmptyBrowerCache()),
                        where,
                        part.index,
                        entry.template,
                      )
                    : Effect.succeed(v),
                ),
              ),
              part.update,
            ),
          )
        }

        return part.update(value)
      })

    const renderPart = (
      part: Part | SparsePart,
      index: number,
    ): Effect.Effect<never, never, void> =>
      Effect.suspend(() => {
        if (part._tag === 'Node') {
          const value = values[part.index]

          // If the value hasn't changed, don't re-render
          if (entry.values[part.index] === value) return onValue(index)

          return pipe(
            unwrapRenderable(value),
            Fx.switchMatchCauseEffect(sink.error, renderNode(part)),
            Fx.observe(() => onValue(index)),
            Effect.catchAllCause(sink.error),
            Effect.provideContext(result.context),
            Effect.fork,
            Effect.tap((fiber) => Effect.sync(() => part.fibers.add(fiber))),
          )
        } else if (part._tag === 'SparseClassName' || part._tag === 'SparseAttr') {
          const renderables = part.parts.map((p) =>
            p._tag === 'StaticText' ? p.text : values[p.index],
          )

          return pipe(
            part.observe(
              renderables,
              Fx.Sink(() => onValue(index), sink.error),
            ),
            Effect.provideContext(result.context),
            Effect.fork,
            Effect.tap((fiber) => Effect.sync(() => part.fibers.add(fiber))),
          )
        } else {
          const value = values[part.index]

          // If the value hasn't changed, don't re-render
          if (entry.values[part.index] === value) return onValue(index)

          return pipe(
            part.observe(
              value,
              Fx.Sink(() => onValue(index), sink.error),
            ),
            Effect.provideContext(result.context),
            Effect.fork,
            Effect.tap((fiber) => Effect.sync(() => part.fibers.add(fiber))),
          )
        }
      })

    return Effect.flatMap(Effect.allPar(entry.parts.map(renderPart)), () => onReady)
  })
}
