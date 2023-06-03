import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { isDirective } from './Directive.js'
import type { Placeholder } from './Placeholder.js'
import { RenderContext } from './RenderContext.js'
import { DomRenderEvent, RenderEvent, RenderUpdate, RenderedDom } from './RenderEvent.js'
import { RenderTemplate, RenderTemplateOptions } from './RenderTemplate.js'
import { Renderable } from './Renderable.js'
import type { TemplateCache } from './TemplateCache.js'
import { collectPartsAndValues } from './collectPartsAndValues.js'
import { unwrapRenderable } from './makeUpdate.js'
import { parseTemplate } from './parseTemplate.js'
import { Part } from './part/Part.js'
import { getRenderHoleContext } from './render.js'

// TODO: How to implement for a server??
// Can we keep track of ordering of parts to allow streaming values out?
// How can we utilize parts to allow hydration?

export const dom: Layer.Layer<Document | RenderContext, never, RenderTemplate> =
  RenderTemplate.layer(
    Effect.gen(function* ($) {
      const context = yield* $(Effect.context<Document | RenderContext>())

      return {
        renderTemplate: flow(renderTemplate, Fx.provideSomeContext(context)),
      }
    }),
  )

function renderTemplate<Values extends ReadonlyArray<Renderable<any, any>>>(
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
    const { rendered, partsToRenderable } = collectPartsAndValues(document, cache, values)

    if (partsToRenderable.size === 0) {
      return Fx.succeed(RenderedDom(rendered()))
    }

    return Fx.Fx<_R, _E, RenderEvent>(<R2>(sink: Fx.Sink<R2, _E, RenderEvent>) => {
      return Effect.catchAllCause(
        Effect.gen(function* ($) {
          const fibers: Fiber.Fiber<_E, unknown>[] = Array(partsToRenderable.size)
          const hasValue = new Set<number>()
          const context = yield* $(Effect.context<_R | R2 | Scope.Scope>())

          let hasEmittedDom = false

          const emitDom = Effect.gen(function* ($) {
            if (hasValue.size === partsToRenderable.size && !hasEmittedDom) {
              hasEmittedDom = true
              yield* $(sink.event(RenderedDom(rendered())))
            }
          })

          function emitPart(index: number) {
            hasValue.add(index)

            return emitDom
          }

          function renderPart(index: number, part: Part<_R, _E>) {
            return (value: unknown) =>
              Effect.gen(function* ($) {
                hasValue.add(index)

                if (isRenderEvent(value)) {
                  if (value._tag === 'RenderedDom') {
                    yield* $(part.update(value.rendered))
                    yield* $(emitDom)
                  } else {
                    yield* $(sink.event(value))
                  }
                } else {
                  if (hasEmittedDom) {
                    const update = Effect.provideContext(
                      Effect.catchAllCause(part.update(value), sink.error),
                      context,
                    )

                    yield* $(sink.event(RenderUpdate(part, update)))
                  } else {
                    yield* $(part.update(value))
                    yield* $(emitDom)
                  }
                }
              })
          }

          let i = 0
          for (const [part, renderable] of partsToRenderable) {
            const index = i++
            if (isDirective<_R, _E>(renderable)) {
              yield* $(part.subscribe(() => emitPart(index)))

              fibers[index] = yield* $(
                renderable.f(part as Part),
                Effect.catchAllCause(sink.error),
                Effect.forkScoped,
              )
            } else {
              if (part._tag === 'Ref') {
                fibers[index] = Fiber.unit()

                yield* $(part.update(renderable))
                yield* $(emitPart(index))
              } else {
                fibers[index] = yield* $(
                  unwrapRenderable(renderable),
                  Fx.observe(renderPart(index, part)),
                  Effect.catchAllCause(sink.error),
                  Effect.forkScoped,
                )
              }
            }
          }

          yield* $(Fiber.joinAll(fibers))
        }),
        sink.error,
      )
    })
  })
}

export function isRenderEvent(u: unknown): u is DomRenderEvent {
  if (typeof u !== 'object' || u === null || Array.isArray(u)) {
    return false
  }

  const { _tag } = u as RenderEvent

  return _tag === 'RenderedDom' || _tag === 'RenderUpdate'
}
