import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { RenderContext } from '../RenderContext.js'
import { Rendered } from '../Rendered.js'
import { TemplateResult } from '../TemplateResult.js'
import { NodePart } from '../part/NodePart.js'
import { Part, SparsePart } from '../part/Part.js'
import { unwrapRenderable } from '../part/updates.js'
import { isTemplateResult } from '../utils.js'

import {
  BrowserCache,
  BrowserEntry,
  getBrowserCache,
  getRenderEntry,
  makeEmptyBrowerCache,
} from './cache.js'
import { indexRefCounter } from './indexRefCounter.js'

export function render<R, E>(
  what: Fx.Fx<R, E, TemplateResult>,
  where: HTMLElement,
): Fx.Fx<R | Document | RenderContext, E, Rendered | null> {
  return Document.withFx((document) =>
    RenderContext.withFx((renderContext) =>
      Fx.switchMapEffect(what, (result) =>
        renderRootTemplateResult(document, renderContext, result, where),
      ),
    ),
  )
}

export function renderRootTemplateResult(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  where: HTMLElement,
): Effect.Effect<never, never, Rendered | null> {
  const cache = getBrowserCache(renderContext.renderCache, where)

  return Effect.tap(renderTemplateResult(document, renderContext, result, cache), (wire) =>
    Effect.sync(() => {
      if (wire !== cache.wire) {
        if (cache.wire && !wire) where.removeChild(cache.wire as globalThis.Node)

        cache.wire = wire
        // valueOf() simply returns the node itself, but in case it was a "wire"
        // it will eventually re-append all nodes to its fragment so that such
        // fragment can be re-appended many times in a meaningful way
        // (wires are basically persistent fragments facades with special behavior)
        if (wire) where.replaceChildren(wire.valueOf() as globalThis.Node)
      }
    }),
  )
}

export function renderTemplateResult(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: BrowserCache,
): Effect.Effect<never, never, Rendered | null> {
  return Effect.suspend(() => {
    let { entry } = cache

    const effects: Effect.Effect<never, never, unknown>[] = []

    if (!entry || entry.result.template !== result.template) {
      // The entry is changing, so we need to cleanup the previous one
      if (cache.entry) {
        effects.push(Effect.uninterruptible(cache.entry.cleanup))
      }

      cache.entry = entry = getRenderEntry({ document, renderContext, result, browserCache: cache })
    }

    const { template } = entry

    // Render all children before creating the wire
    if (template.parts.length > 0) {
      effects.push(
        Effect.provideContext(
          Effect.catchAllCause(
            renderPlaceholders(document, renderContext, result, cache, entry),
            result.sink.error,
          ),
          result.context,
        ),
      )
    }

    // Lazily creates the wire after all childNodes are available
    return Effect.map(Effect.allPar(effects), entry.wire)
  })
}

function renderPlaceholders(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: BrowserCache,
  entry: BrowserEntry,
): Effect.Effect<never, never, void> {
  const { values, sink } = result

  return pipe(
    indexRefCounter(entry.parts.length),
    Effect.flatMap(({ onReady, onValue }) => {
      const renderNode = (part: NodePart) => (value: unknown) =>
        Effect.suspend(() => {
          if (isTemplateResult(value)) {
            return Effect.flatMap(
              renderTemplateResult(
                document,
                renderContext,
                value,
                cache.stack[part.index] || (cache.stack[part.index] = makeEmptyBrowerCache()),
              ),
              part.update,
            )
          } else if (Array.isArray(value)) {
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
                      ? renderTemplateResult(
                          document,
                          renderContext,
                          v,
                          arrayCache.stack[i] || (arrayCache.stack[i] = makeEmptyBrowerCache()),
                        )
                      : Effect.succeed(v),
                  ),
                ),
                part.update,
              ),
            )
          } else {
            return part.update(value)
          }
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

      return Effect.zip(
        Effect.flatMap(Effect.allPar(entry.parts.map(renderPart)), () =>
          Effect.sync(() => (entry.values = values)),
        ),
        onReady,
      )
    }),
  )
}
