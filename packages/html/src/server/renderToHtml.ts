import { pipe } from '@effect/data/Function'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { withScopedFork } from '@typed/fx/helpers.js'

import { isDirective } from '../Directive.js'
import { RenderContext } from '../RenderContext.js'
import { Renderable } from '../Renderable.js'
import { TemplateResult } from '../TemplateResult.js'
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

  // Traverse all chunks, create runtime Parts, ensure they render in order

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
              yield* $(onChunk(renderChunk.index, renderChunk.value))
            } else if (renderChunk.type === 'part') {
              // Node parts have more capabilities as they support arrays and TemplateResults
              if (renderChunk.part._tag === 'Node') {
                fibers.set(
                  renderChunk.index,
                  yield* $(
                    unwrapRenderable<R, E>(renderChunk.renderable),
                    Fx.take(1),
                    Fx.switchMap((value) => {
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
                        return Effect.unit()
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

          function emitHtml(index: number): Effect.Effect<R2, E, void> {
            return Effect.gen(function* ($) {
              if (index === currentIndex && indexToHtml.has(index)) {
                const html = indexToHtml.get(index) as string

                indexToHtml.delete(index)

                if (html.length > 0) yield* $(sink.event(html))

                const fiber = fibers.get(index)
                if (fiber) {
                  yield* $(Fiber.interruptFork(fiber))
                }

                if (index === lastIndex) {
                  yield* $(Deferred.succeed(deferred, undefined))
                } else {
                  yield* $(emitHtml(++currentIndex))
                }
              }
            })
          }

          function onChunk(index: number, value: string) {
            if (currentIndex > index)
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              return fibers.has(index) ? Fiber.interrupt(fibers.get(index)!) : Effect.unit()

            return Effect.provideContext(
              Effect.catchAllCause(
                Effect.gen(function* ($) {
                  // TemplateResult's are handled differently as they can be rendered
                  // incrementally
                  if (templateResults.has(index)) {
                    const currentHtml = pendingHtml.get(index) || ''
                    const html = currentHtml + value

                    // Stream the HTML if we're at the current index
                    if (index === currentIndex) {
                      pendingHtml.delete(index)
                      yield* $(sink.event(html))
                      // Otherwise store the HTML for later
                    } else {
                      pendingHtml.set(index, html)
                    }
                    // All others are rendered immediately
                  } else {
                    indexToHtml.set(index, value)

                    yield* $(emitHtml(index))
                  }
                }),
                sink.error,
              ),
              context,
            )
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
