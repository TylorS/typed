import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'
import { persistent } from '@typed/wire'

import { RenderContext } from '../RenderContext.js'
import { TemplateResult } from '../TemplateResult.js'
import { isTemplateResult } from '../isTemplateResult.js'
import { Parser, Template } from '../parser/parser.js'
import { AttrPart } from '../partV2/AttrPart.js'
import { BooleanPart } from '../partV2/BooleanPart.js'
import { ClassNamePart } from '../partV2/ClassNamePart.js'
import { CommentPart } from '../partV2/CommentPart.js'
import { DataPart } from '../partV2/DataPart.js'
import { EventPart } from '../partV2/EventPart.js'
import { NodePart } from '../partV2/NodePart.js'
import { Part, SparsePart } from '../partV2/Part.js'
import { PropertyPart } from '../partV2/PropertyPart.js'
import { RefPart } from '../partV2/RefPart.js'
import { SparseAttrPart } from '../partV2/SparseAttrPart.js'
import { SparseClassNamePart } from '../partV2/SparseClassNamePart.js'
import { TextPart } from '../partV2/TextPart.js'
import { findPath } from '../paths.js'
import { Rendered } from '../render.js'
import { unwrapRenderable } from '../server/updates.js'

import { buildTemplate } from './buildTemplate.js'
import { indexRefCounter } from './indexRefCounter.js'

// TODO: Add support for directives

export type BrowserCache = {
  readonly stack: Array<BrowserCache | null>

  wire: Rendered | null
  entry: BrowserEntry | null
}

export type BrowserTemplateCache = {
  readonly template: Template
  readonly content: DocumentFragment
}

export type BrowserEntry = {
  readonly result: TemplateResult
  readonly template: Template
  readonly cleanup: Effect.Effect<never, never, void>
  readonly parts: ReadonlyArray<Part | SparsePart>
  readonly wire: () => Rendered | null
}

const parser = new Parser()

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

  return Effect.gen(function* ($) {
    const wire = yield* $(
      hydrateTemplateResult<R, E>(document, renderContext, result, cache),
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
): Effect.Effect<R, E, Rendered | null> {
  return Effect.gen(function* ($) {
    let { entry } = cache

    if (!entry || entry.result.template !== result.template) {
      // The entry is changing, so we need to cleanup the previous one
      if (cache.entry) {
        yield* $(cache.entry.cleanup)
      }

      cache.entry = entry = getHydrateEntry(document, renderContext, result, cache)
    }

    const { template } = entry

    // Render all children before creating the wire
    if (template.parts.length > 0) {
      yield* $(renderPlaceholders<R, E>(document, renderContext, result, cache, entry))
    }

    // Lazily creates the wire after all childNodes are available
    return entry.wire()
  })
}

function renderPlaceholders<R, E>(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  cache: BrowserCache,
  entry: BrowserEntry,
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

const makeEmptyBrowerCache = (): BrowserCache => ({
  entry: null,
  stack: [],
  wire: null,
})

export function getBrowserCache(
  renderCache: RenderContext['renderCache'],
  where: HTMLElement,
): BrowserCache {
  const cache = renderCache.get(where)

  if (cache) return cache as BrowserCache

  const newCache: BrowserCache = {
    entry: null,
    stack: [],
    wire: null,
  }

  renderCache.set(where, newCache)

  return newCache
}

function getHydrateEntry(
  document: Document,
  renderContext: RenderContext,
  result: TemplateResult,
  browserCache: BrowserCache,
): BrowserEntry {
  const { deferred } = result
  const { template, content } = getBrowserTemplateCache(
    document,
    result,
    renderContext.templateCache,
  )

  const parts = template.parts.map(([part, path]): Part | SparsePart => {
    const node = findPath(content, path) as HTMLElement

    switch (part.type) {
      case 'attr':
        return AttrPart.fromElement(node, part.name, part.index)
      case 'boolean-part':
        return BooleanPart.fromElement(node, part.name, part.index)
      case 'className-part':
        return ClassNamePart.fromElement(node, part.index)
      case 'comment-part':
        return CommentPart.fromParentElement(node, part.index)
      case 'data':
        return DataPart.fromHTMLElement(node, part.index)
      case 'event':
        return EventPart.fromHTMLElement(
          node,
          part.name,
          part.index,
          (cause) => Effect.provideContext(result.sink.error(cause), result.context),
          result.context,
        )
      case 'node':
        return NodePart.fromParentElemnt(document, node, part.index)
      case 'property':
        return PropertyPart.fromElement(node, part.name, part.index)
      case 'ref':
        return RefPart.fromElement(node, part.index)
      case 'sparse-attr':
        return SparseAttrPart.fromPartNodes(
          (value) =>
            Effect.sync(() =>
              value ? node.setAttribute(part.name, value) : node.removeAttribute(part.name),
            ),
          part.nodes,
        )
      case 'sparse-class-name':
        return SparseClassNamePart.fromPartNodes(
          (value) => Effect.sync(() => (node.className = value ?? '')),
          part.nodes,
        )
      case 'text-part':
        return TextPart.fromElement(node, part.index)
    }
  })

  const cleanup = Effect.forkDaemon(
    Effect.allPar(
      Effect.suspend(() => Fiber.interruptAll(parts.flatMap((p) => Array.from(p.fibers)))),
      Deferred.succeed(deferred, undefined),
      Effect.suspend(() =>
        Effect.allPar(
          browserCache.stack.map((cache, i) =>
            cache && cache.entry
              ? Effect.map(cache.entry.cleanup, () => (browserCache.stack[i] = null))
              : Effect.unit(),
          ),
        ),
      ),
    ),
  )

  let wire: Rendered | null = null

  const entry: BrowserEntry = {
    result,
    template,
    cleanup,
    parts,
    wire: () => wire || (wire = persistent(content)),
  }

  return entry
}

function getBrowserTemplateCache(
  document: Document,
  result: TemplateResult,
  templateCache: RenderContext['templateCache'],
): BrowserTemplateCache {
  const current = templateCache.get(result.template)

  if (current) {
    return {
      template: (current as BrowserTemplateCache).template,
      content: (current as BrowserTemplateCache).content.cloneNode(true) as DocumentFragment,
    }
  }

  const template = parser.parse(result.template)
  const content = buildTemplate(document, template)

  const newCache: BrowserTemplateCache = {
    template,
    content,
  }

  templateCache.set(result.template, newCache)

  return newCache
}
