import { pipe } from '@effect/data/Function'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { withScopedFork } from '@typed/fx/helpers'

import { isDirective } from '../Directive.js'
import { RenderContext } from '../RenderContext.js'
import { Renderable } from '../Renderable.js'
import { TemplateResult, fromValues } from '../TemplateResult.js'
import { TEXT_START, TYPED_END, TYPED_HOLE, TYPED_START } from '../meta.js'
import { globalParser } from '../parser/global.js'
import { Template } from '../parser/parser.js'
import { unwrapRenderable } from '../part/updates.js'
import { isTemplateResult } from '../utils.js'

import { htmlChunksToRenderChunks } from './htmlChunksTorRenderChunks.js'
import { HtmlChunk, templateToHtmlChunks } from './templateToHtmlChunks.js'

// TODO: Add support for directives

export type ServerTemplateCache = {
  readonly template: Template
  readonly chunks: readonly HtmlChunk[]
}

const unit_ = Effect.unit()

export function renderToHtmlStream<R, E>(
  fx: Fx.Fx<R, E, TemplateResult>,
): Fx.Fx<R | RenderContext, E, string> {
  return pipe(
    RenderContext.withFx((context) =>
      Fx.switchMap(Fx.take(fx, 1), (result) => renderTemplateResult<R, E>(context, result)),
    ),
    Fx.startWith(TYPED_START),
    Fx.continueWith(() => Fx.succeed(TYPED_END)),
  )
}

export function renderToHtml<R, E>(
  fx: Fx.Fx<R, E, TemplateResult>,
): Effect.Effect<R | Scope.Scope | RenderContext, E, string> {
  return Effect.map(Fx.toReadonlyArray(renderToHtmlStream(fx)), (chunks) => chunks.join(''))
}

function renderTemplateResult<R, E>(
  renderContext: RenderContext,
  result: TemplateResult,
): Fx.Fx<R, E, string> {
  const { chunks } = getServerTemplateCache(result.template, renderContext.templateCache)

  if (result.values.length === 0) {
    return Fx.succeed(chunksToHtmlWithoutParts(chunks))
  }

  // Traverse all chunks, create runtime Parts, ensure they render in orderis

  return Fx.Fx<R, E, string>(<R2>(sink: Fx.Sink<R2, E, string>) =>
    withScopedFork((fork) =>
      Effect.provideContext(
        Effect.gen(function* ($) {
          let currentIndex = 0

          // Create our render chunks, which zips together HTML chunks with their
          // corresponding values
          const renderChunks = htmlChunksToRenderChunks(chunks, result.values, onChunk)
          // The context we'll use to render parts of our template
          const context = yield* $(Effect.context<R | R2>())
          // Used to keep track of the current index we're rendering
          const deferred = yield* $(Deferred.make<never, void>())
          // Used to keep track of the finished HTML for each index
          const indexToHtml = new Map<number, string>()
          // Used to keep track of the pending HTML for each index with a TemplateResult
          const pendingHtml = new Map<number, string>()
          // Used to keep track of the fibers that are rendering each chunk
          const fibers = new Map<number, Fiber.Fiber<never, void>>()
          // Used to keep track of the indexes that correspond to a TemplateResult
          const templateResults = new Set<number>()
          // Used to determine when the rendering is complete
          const lastIndex = chunks.length - 1

          for (let i = 0; i < renderChunks.length; i++) {
            const renderChunk = renderChunks[i]

            // Text chunks are ready to be rendered immediately
            if (renderChunk.type === 'text') {
              indexToHtml.set(renderChunk.index, renderChunk.value)
              if (i === 0) yield* $(emitHtml(renderChunk.index))
            } else if (renderChunk.type === 'part') {
              // Node parts have more capabilities as they support arrays and TemplateResults
              if (renderChunk.part._tag === 'Node') {
                fibers.set(
                  renderChunk.index,
                  yield* $(
                    unwrapRenderable<R, E>(renderChunk.renderable),
                    Fx.take(1),
                    Fx.switchMap(function renderNodeValue(value) {
                      if (isTemplateResult(value)) {
                        templateResults.add(renderChunk.index)

                        return Fx.continueWith(
                          renderTemplateResult<R, E>(renderContext, value),
                          () => Fx.succeed(TYPED_HOLE(renderChunk.part.index)),
                        )
                      }

                      switch (typeof value) {
                        case 'string':
                        case 'number':
                        case 'boolean':
                          return Fx.succeed(
                            TEXT_START + value.toString() + TYPED_HOLE(renderChunk.part.index),
                          )
                        case 'undefined':
                        case 'object': {
                          if (value == null) {
                            return Fx.succeed(TYPED_HOLE(renderChunk.part.index))
                          } else if (Array.isArray(value)) {
                            if (value.length === 0)
                              return Fx.succeed(TYPED_HOLE(renderChunk.part.index))

                            if (value.length === 1) return renderNodeValue(value[0])

                            templateResults.add(renderChunk.index)

                            return Fx.continueWith(
                              renderTemplateResult<R, E>(
                                renderContext,
                                fromValues(value, result.sink as any, result.context),
                              ),
                              () => Fx.succeed(TYPED_HOLE(renderChunk.part.index)),
                            )
                          }

                          // TODO: Should we continue to handle DOM nodes here?
                        }
                      }

                      return Fx.succeed(
                        renderChunk.chunk.render(value) + TYPED_HOLE(renderChunk.part.index),
                      )
                    }),
                    Fx.observe((value) => onChunk(renderChunk.index, value)),
                    Effect.flatMap(() =>
                      Effect.suspend(() => {
                        if (templateResults.has(renderChunk.index)) {
                          indexToHtml.set(
                            renderChunk.index,
                            pendingHtml.get(renderChunk.index) ?? '',
                          )

                          return emitHtml(renderChunk.index)
                        }
                        return unit_
                      }),
                    ),
                    Effect.catchAllCause(sink.error),
                    fork,
                  ),
                )
                // Other parts are handled consistently
              } else {
                if (isDirective<R, E>(renderChunk.renderable)) {
                  yield* $(
                    renderChunk.renderable.f(renderChunk.part),
                    Effect.matchCauseEffect(sink.error, () =>
                      onChunk(renderChunk.index, renderChunk.chunk.render(renderChunk.part.value)),
                    ),
                    fork,
                  )
                } else {
                  fibers.set(
                    renderChunk.index,
                    yield* $(
                      renderChunk.part.observe<R, E, R2>(
                        unwrapRenderable(renderChunk.renderable) as Renderable<R, E>,
                        Fx.Sink((value) => onChunk(renderChunk.index, value as string), sink.error),
                      ),
                      Effect.catchAllCause(sink.error),
                      fork,
                    ),
                  )
                }
              }
              // Sparse parts are handled consistently waiting for multiple values
            } else {
              fibers.set(
                renderChunk.index,
                yield* $(
                  renderChunk.part.observe<R, E, R2>(
                    renderChunk.renderables,
                    Fx.Sink(
                      (value) =>
                        onChunk(renderChunk.index, renderChunk.chunk.render(value as string)),
                      sink.error,
                    ),
                  ),
                  Effect.catchAllCause(sink.error),
                  fork,
                ),
              )
            }
          }

          // Wait for all chunks to be rendered
          yield* $(Deferred.await(deferred))

          function emitHtml(index: number): Effect.Effect<never, never, void> {
            return Effect.suspend(() => {
              if (index === currentIndex && indexToHtml.has(index)) {
                const html = indexToHtml.get(index) as string
                const fiber = fibers.get(index)

                indexToHtml.delete(index)
                fibers.delete(index)

                const effects = [
                  html.length > 0 ? Effect.provideContext(sink.event(html), context) : unit_,
                  fiber ? Fiber.interruptFork(fiber) : unit_,
                  index === lastIndex
                    ? Deferred.succeed(deferred, undefined)
                    : emitHtml(++currentIndex),
                ]

                return Effect.all(effects)
              }

              return unit_
            })
          }

          function onChunk(index: number, value: string): Effect.Effect<never, never, void> {
            if (currentIndex > index)
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              return fibers.has(index) ? Fiber.interrupt(fibers.get(index)!) : unit_

            return Effect.suspend(() => {
              // TemplateResult's are handled differently as they can be rendered
              // incrementally
              if (templateResults.has(index)) {
                const currentHtml = pendingHtml.get(index) || ''
                const html = currentHtml + value

                // Stream the HTML if we're at the current index
                if (index === currentIndex) {
                  pendingHtml.delete(index)

                  return Effect.provideContext(sink.event(html), context)
                } else {
                  // Otherwise store the HTML for later
                  pendingHtml.set(index, html)

                  return unit_
                }
                // All others are rendered immediately
              } else {
                indexToHtml.set(index, value)

                return emitHtml(index)
              }
            })
          }
        }),
        result.context,
      ),
    ),
  )
}

function chunksToHtmlWithoutParts(chunk: readonly HtmlChunk[]): string {
  let html = ''

  for (const c of chunk) {
    switch (c.type) {
      case 'text':
        html += c.value
        break
      case 'part':
      case 'sparse-part':
        throw new Error(`Invalid chunk type: ${c.type} for template with no interpolations.`)
    }
  }

  return html
}

export function getServerTemplateCache(
  templateStrings: TemplateStringsArray,
  templateCache: RenderContext['templateCache'],
): ServerTemplateCache {
  const cache = templateCache.get(templateStrings)

  if (cache) return cache as ServerTemplateCache

  const template = globalParser.parse(templateStrings)
  const chunks = templateToHtmlChunks(template)

  const newCache = { template, chunks }

  templateCache.set(templateStrings, newCache)

  return newCache
}
