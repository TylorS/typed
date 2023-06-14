import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Scope } from '@effect/io/Scope'
import { Document } from '@typed/dom'
import * as Fx from '@typed/fx'

import { isDirective } from './Directive.js'
import { RenderContext } from './RenderContext.js'
import { TemplateResult } from './TemplateResult.js'
import { getTemplateCache } from './getCache.js'
import { holeToPart } from './holeToPart.js'
import { handleEffectPart, handlePart, unwrapRenderable } from './makeUpdate.js'
import { Part } from './part/Part.js'
import { nodeToHtml, addDataTypedAttributes, trimEmptyQuotes } from './part/templateHelpers.js'
import { findPath } from './paths.js'

export const START_COMMENT = `<!--typed-start-->`
export const END_COMMENT = `<!--typed-end-->`

export const renderToHtmlStream = <R, E>(
  what: Fx.Fx<R, E, TemplateResult>,
): Fx.Fx<Document | RenderContext | Scope | R, E, HtmlEvent> =>
  Fx.Fx(<R2>(sink: Fx.Sink<R2, E, HtmlEvent>) => {
    return Effect.catchAllCause(
      Effect.gen(function* ($) {
        const [templateResult] = yield* $(Fx.toArray(Fx.take(what, 1)))
        const input: RenderResultInput = {
          document: yield* $(Document),
          renderContext: yield* $(RenderContext),
        }

        let first = true

        const getFirst = () => {
          if (first) {
            first = false
            return START_COMMENT
          }

          return ''
        }

        yield* $(
          Fx.map(renderTemplateResult<E>(input, templateResult, -1), (event) => {
            return event._tag === 'Full'
              ? new FullHtml(START_COMMENT + event.html + END_COMMENT)
              : event.isLast
              ? new PartialHtml(getFirst() + event.html + END_COMMENT, true)
              : new PartialHtml(getFirst() + event.html, false)
          }).run(sink),
        )
      }),
      sink.error,
    )
  })

export const renderToHtml: <R, E>(
  what: Fx.Fx<R, E, TemplateResult>,
) => Effect.Effect<Document | RenderContext | Scope | R, E, string> = <R, E>(
  what: Fx.Fx<R, E, TemplateResult>,
) =>
  Effect.map(Fx.toReadonlyArray(renderToHtmlStream(what)), (events) =>
    events.map((e) => e.html).join(''),
  )

function renderTemplateResult<E>(
  input: RenderResultInput,
  result: TemplateResult,
  templateIndex: number,
): Fx.Fx<Scope, E, HtmlEvent> {
  const { document, renderContext } = input
  const { values } = result
  const { content, holes } = getTemplateCache(document, renderContext.templateCache, result)
  const template = result.template.map((x) => addDataTypedAttributes(x, templateIndex))

  if (holes.length === 0) {
    return Fx.succeed(
      new FullHtml(
        addDataTypedAttributes(
          Array.from(content.childNodes).map(nodeToHtml).join(''),
          templateIndex,
        ),
      ),
    )
  }

  return Fx.Fx(<R>(sink: Fx.Sink<R, E, HtmlEvent>) => {
    return Effect.catchAllCause(
      Effect.gen(function* ($) {
        const deferred = yield* $(Deferred.make<never, void>())
        const parts = holes.map((h) => holeToPart(document, h, findPath(content, h.path)))
        const lastIndex = parts.length - 1
        const fibers = Array(parts.length)
        const indexToHtml = new Map<number, string>()
        const pendingHtml = new Map<number, string>()

        let hasRendered = 0

        function emitHtml(index: number): Effect.Effect<R, never, void> {
          return Effect.gen(function* ($) {
            if (index === hasRendered && indexToHtml.has(index)) {
              const html = indexToHtml.get(index) as string
              const isLast = index === lastIndex
              const nextIndex = ++hasRendered
              const fullHtml = trimEmptyQuotes(isLast ? html + template[index + 1] : html)

              // Emit our HTML
              yield* $(sink.event(new PartialHtml(fullHtml, isLast)))

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

        function renderNode(part: Part, index: number) {
          let isFirst = true

          const getFirst = (html: string) => {
            if (isFirst) {
              isFirst = false
              const base = template[index] + html

              return base
            }
            return html
          }

          const getComment = () => {
            if (part._tag === 'Node') {
              return `<!--${part.comment.nodeValue}-->`
            }
            return ''
          }

          function handleHtmlEvent(event: HtmlEvent): Effect.Effect<R, never, void> {
            return Effect.gen(function* ($) {
              if (event._tag === 'Full') {
                indexToHtml.set(index, getFirst(event.html) + getComment())

                yield* $(emitHtml(index))
              } else {
                const currentHtml = pendingHtml.get(index) ?? ''
                const html = getFirst(currentHtml + event.html)

                if (event.isLast) {
                  pendingHtml.delete(index)
                  indexToHtml.set(index, html + getComment())

                  yield* $(emitHtml(index))
                } else {
                  // If it's already ready, just stream out directly
                  if (index === hasRendered) {
                    yield* $(sink.event(new PartialHtml(trimEmptyQuotes(html), false)))
                  } else {
                    pendingHtml.set(index, html)
                  }
                }
              }
            })
          }

          return (value: unknown) =>
            Effect.gen(function* ($) {
              if (isTemplateResult(value)) {
                yield* $(renderTemplateResult<E>(input, value, index), Fx.observe(handleHtmlEvent))
              } else {
                yield* $(part.update(value))

                indexToHtml.set(index, part.getHTML(template[index]))

                yield* $(emitHtml(index))
              }
            })
        }

        for (let i = 0; i < parts.length; ++i) {
          const part = parts[i]
          const value = values[i]
          const index = i

          // Directives need to be handled separately to listen to events
          if (isDirective(value)) {
            // Subscribe to a part's value changes
            yield* $(
              part.subscribe((part: Part) =>
                Effect.suspend(() => {
                  indexToHtml.set(index, part.getHTML(template[index]))

                  return emitHtml(index)
                }),
              ),
            )

            fibers[index] = yield* $(
              Effect.forkScoped(
                Effect.catchAllCause(
                  value.f(part as Part) as Effect.Effect<R, E, unknown>,
                  sink.error,
                ),
              ),
            )
          } else {
            switch (part._tag) {
              case 'Node': {
                fibers[index] = yield* $(
                  unwrapRenderable<R, E>(value),
                  Fx.switchMatchCauseEffect(sink.error, renderNode(part, index)),
                  Fx.drain,
                  Effect.catchAllCause(sink.error),
                  Effect.forkScoped,
                )

                break
              }
              case 'Ref':
              case 'Event': {
                yield* $(handleEffectPart(part, value))

                indexToHtml.set(index, part.getHTML(template[index]))
                fibers[index] = Fiber.unit()

                yield* $(emitHtml(index))

                break
              }
              default: {
                // Other parts may or may not return an Fx to be executed over time
                const fx = yield* $(handlePart(part, value))

                if (fx) {
                  fibers[index] = yield* $(
                    fx,
                    Fx.switchMatchCauseEffect(sink.error, () => {
                      indexToHtml.set(index, part.getHTML(template[index]))

                      return emitHtml(index)
                    }),
                    Fx.drain,
                    Effect.forkScoped,
                  )
                } else {
                  fibers[index] = Fiber.unit()
                  indexToHtml.set(index, part.getHTML(template[index]))

                  yield* $(emitHtml(index))
                }
              }
            }
          }
        }

        yield* $(Deferred.await(deferred))
      }),
      sink.error,
    )
  })
}

type RenderResultInput = {
  readonly document: Document
  readonly renderContext: RenderContext
}

export type HtmlEvent = FullHtml | PartialHtml

export class FullHtml {
  readonly _tag = 'Full'

  constructor(readonly html: string) {}
}

export class PartialHtml {
  readonly _tag = 'Partial'

  constructor(readonly html: string, readonly isLast: boolean) {}
}

function isTemplateResult(value: unknown): value is TemplateResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_tag' in value &&
    value._tag === 'TemplateResult'
  )
}
