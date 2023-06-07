import { flow } from '@effect/data/Function'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { isDirective } from './Directive.js'
import type { Placeholder } from './Placeholder.js'
import { RenderContext } from './RenderContext.js'
import { FullHtml, HtmlRenderEvent, PartialHtml, RenderEvent } from './RenderEvent.js'
import { RenderTemplate, RenderTemplateOptions } from './RenderTemplate.js'
import { Renderable } from './Renderable.js'
import type { TemplateCache } from './TemplateCache.js'
import { collectPartsAndValues } from './collectPartsAndValues.js'
import { unwrapRenderable } from './makeUpdate.js'
import { parseTemplate } from './parseTemplate.js'
import { Part } from './part/Part.js'
import { trimEmptyQuotes } from './part/templateHelpers.js'
import { getRenderHoleContext } from './render.js'

export const server: Layer.Layer<Document | RenderContext, never, RenderTemplate> =
  RenderTemplate.layer(
    Effect.gen(function* ($) {
      const context = yield* $(Effect.context<Document | RenderContext>())

      return {
        renderTemplate: flow(renderTemplate, Fx.provideSomeContext(context)),
      }
    }),
  )

export function renderTemplate<Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  values: Values,
  options?: RenderTemplateOptions,
): Fx.Fx<
  Document | RenderContext | Scope.Scope | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  RenderEvent
> {
  type _R = Document | RenderContext | Scope.Scope | Placeholder.ResourcesOf<Values[number]>
  type _E = Placeholder.ErrorsOf<Values[number]>

  return Fx.gen(function* ($) {
    const { document, renderContext } = yield* $(getRenderHoleContext)
    const { templateCache } = renderContext
    const isSvg = options?.isSvg ?? false

    if (!templateCache.has(template)) {
      templateCache.set(template, parseTemplate(template, document, isSvg))
    }

    const cache = templateCache.get(template) as TemplateCache
    const { html, partsToRenderable } = collectPartsAndValues(document, cache, values)

    if (partsToRenderable.size === 0) {
      return Fx.succeed(FullHtml(html()))
    }

    return Fx.Fx<_R, _E, RenderEvent>(<R2>(sink: Fx.Sink<R2, _E, RenderEvent>) =>
      Effect.gen(function* ($) {
        const indexToHtml = new Map<number, string>()
        const pendingHtml = new Map<number, string>()
        const lastIndex = partsToRenderable.size - 1
        const deferred = yield* $(Deferred.make<never, void>())
        const fibers = Array(partsToRenderable.size)

        let hasRendered = 0
        let i = 0

        function emitHtml(index: number): Effect.Effect<R2, never, void> {
          return Effect.gen(function* ($) {
            if (index === hasRendered && indexToHtml.has(index)) {
              const html = indexToHtml.get(index) as string
              const isLast = index === lastIndex
              const nextIndex = ++hasRendered

              indexToHtml.delete(index)

              // Emit our HTML
              yield* $(
                sink.event(
                  PartialHtml(trimEmptyQuotes(isLast ? html + template[index + 1] : html), isLast),
                ),
              )

              // When a fiber is completed we can interrupt the underlying Fiber
              yield* $(Fiber.interruptFork(fibers[index]))

              if (isLast) {
                // We're done!
                yield* $(Deferred.succeed(deferred, void 0))
              } else {
                // See if we can emit the next HTML
                yield* $(emitHtml(nextIndex))
              }
            }
          })
        }

        function renderPart<R, E>(index: number, part: Part<R, E>) {
          let isFirst = true

          const getFirst = (html: string) => {
            if (isFirst) {
              isFirst = false
              return template[index] + html
            }
            return html
          }

          const handleRenderEvent = (value: HtmlRenderEvent) =>
            Effect.gen(function* ($) {
              if (value._tag === 'FullHtml') {
                indexToHtml.set(index, getFirst(value.html))

                yield* $(emitHtml(index))
              } else {
                const currentHtml = pendingHtml.get(index) ?? ''
                const html = currentHtml + getFirst(value.html)

                if (value.isLast) {
                  pendingHtml.delete(index)
                  indexToHtml.set(index, html)

                  yield* $(emitHtml(index))
                } else {
                  // If it's already ready, just stream out directly
                  if (index === hasRendered) {
                    yield* $(sink.event(PartialHtml(trimEmptyQuotes(html), false)))
                  } else {
                    pendingHtml.set(index, html)
                  }
                }
              }
            })

          return (value: unknown) =>
            Effect.gen(function* ($) {
              if (isRenderEvent(value)) {
                yield* $(handleRenderEvent(value))
              } else {
                yield* $(part.update(value))

                indexToHtml.set(index, part.getHTML(template[index]))

                yield* $(emitHtml(index))
              }
            })
        }

        for (const [part, renderable] of partsToRenderable) {
          const index = i

          if (isDirective<_R, _E>(renderable)) {
            yield* $(
              part.subscribe((part) =>
                Effect.suspend(() => {
                  indexToHtml.set(index, part.getHTML(template[index]))

                  return emitHtml(index)
                }),
              ),
            )

            fibers[index] = yield* $(
              Effect.forkScoped(Effect.catchAllCause(renderable.f(part as Part), sink.error)),
            )
          } else {
            if (part._tag === 'Ref' || part._tag === 'Event') {
              yield* $((part as Part).update(renderable))
              indexToHtml.set(index, part.getHTML(template[index]))

              yield* $(emitHtml(index))
            } else {
              fibers[index] = yield* $(
                unwrapRenderable(renderable),
                Fx.observe(renderPart(index, part as Part)),
                Effect.catchAllCause(sink.error),
                Effect.forkScoped,
              )
            }
          }

          ++i
        }

        yield* $(Deferred.await(deferred))
      }),
    )
  })
}

function isRenderEvent(u: unknown): u is HtmlRenderEvent {
  if (typeof u !== 'object' || u === null || Array.isArray(u)) {
    return false
  }

  const { _tag } = u as RenderEvent

  return _tag === 'FullHtml' || _tag === 'PartialHtml'
}
