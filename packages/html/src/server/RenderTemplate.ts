import { pipe } from '@effect/data/Function'
import { none, some } from '@effect/data/Option'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Scope from '@effect/io/Scope'
import { Context } from '@typed/context'
import * as Fx from '@typed/fx'

import { isDirective } from '../Directive.js'
import { RenderContext } from '../RenderContext.js'
import { HtmlRenderEvent, RenderEvent, isRenderEvent } from '../RenderEvent.js'
import { RenderTemplate } from '../RenderTemplate.js'
import { Renderable } from '../Renderable.js'
import { TEXT_START, TYPED_HOLE } from '../meta.js'
import { unwrapRenderable } from '../part/updates.js'

import { getTemplateCache } from './getTemplateCache.js'
import { partNodeToPart } from './htmlChunksTorRenderChunks.js'
import { HtmlChunk, PartChunk, SparsePartChunk, TextChunk } from './templateToHtmlChunks.js'

export const renderTemplateToHtml: Layer.Layer<RenderContext, never, RenderTemplate> =
  RenderTemplate.layer(
    Effect.gen(function* ($) {
      const renderContext = yield* $(RenderContext)

      return {
        renderTemplate: (template, values) => {
          const cache = getTemplateCache(template, renderContext.templateCache)

          if (values.length === 0) {
            return Fx.succeed(HtmlRenderEvent((cache.chunks[0] as TextChunk).value))
          } else {
            return Fx.mergeBufferConcurrently(
              ...cache.chunks.map((chunk) => renderChunk(chunk, values)),
            )
          }
        },
      }
    }),
  )

function renderChunk<R, E>(
  chunk: HtmlChunk,
  values: ReadonlyArray<Renderable<R, E>>,
): Fx.Fx<R, E, RenderEvent> {
  if (chunk.type === 'text') {
    return Fx.succeed(HtmlRenderEvent(chunk.value))
  } else if (chunk.type === 'part') {
    return renderPart(chunk, values)
  } else {
    return renderSparsePart(chunk, values)
  }
}

function renderNode<R, E>(renderable: Renderable<R, E>): Fx.Fx<R, E, RenderEvent> {
  switch (typeof renderable) {
    case 'string':
    case 'number':
    case 'boolean':
      return Fx.succeed(HtmlRenderEvent(TEXT_START + renderable))
    case 'undefined':
    case 'object': {
      if (renderable == null) {
        return Fx.succeed(HtmlRenderEvent(TEXT_START))
      } else if (Array.isArray(renderable)) {
        return Fx.mergeBufferConcurrently(...renderable.map(renderNode)) as any
      } else if (Fx.isFx<R, E, Renderable>(renderable)) {
        return Fx.switchMap(takeOneIfNotRenderEvent(renderable), renderNode)
      } else if (Effect.isEffect(renderable)) {
        return Fx.switchMap(
          Fx.fromEffect(renderable as Effect.Effect<R, E, Renderable>),
          renderNode,
        )
      } else if (isRenderEvent(renderable)) {
        return Fx.succeed(renderable)
      } else {
        return Fx.empty()
      }
    }
    default:
      return Fx.empty()
  }
}

function renderPart<R, E>(
  chunk: PartChunk,
  values: ReadonlyArray<Renderable<R, E>>,
): Fx.Fx<R, E, RenderEvent> {
  const { node, render } = chunk
  const renderable = values[node.index]
  const { type } = node

  // Refs and events are not rendered into HTML
  if (type === 'ref' || type === 'event') {
    return Fx.empty()
  } else if (type === 'node') {
    if (isDirective<R, E>(renderable)) {
      return Fx.Fx(<R2>(sink: Fx.Sink<R2, E, RenderEvent>) =>
        Effect.contextWithEffect((ctx: Context<R2>) =>
          Effect.catchAllCause(
            renderable.f(
              partNodeToPart(node, (value) =>
                Effect.provideContext(sink.event(HtmlRenderEvent(render(value))), ctx),
              ),
            ),
            sink.error,
          ),
        ),
      )
    } else {
      return Fx.continueWith(renderNode(renderable), () =>
        Fx.succeed(HtmlRenderEvent(TYPED_HOLE(node.index))),
      )
    }
  } else {
    if (isDirective<R, E>(renderable)) {
      return Fx.Fx(<R2>(sink: Fx.Sink<R2, E, RenderEvent>) =>
        Effect.contextWithEffect((ctx: Context<R2>) => {
          const part = partNodeToPart(node, (value) =>
            Effect.provideContext(sink.event(HtmlRenderEvent(render(value))), ctx),
          )

          return Effect.catchAllCause(renderable.f(part), sink.error)
        }),
      )
    } else {
      return Fx.filterMap(Fx.take(unwrapRenderable(renderable), 1), (value) => {
        const s = render(value)

        return s ? some(HtmlRenderEvent(s)) : none()
      })
    }
  }
}

function renderSparsePart<R, E>(
  chunk: SparsePartChunk,
  values: ReadonlyArray<Renderable<R, E>>,
): Fx.Fx<R, E, RenderEvent> {
  const { node, render } = chunk

  return Fx.map(
    Fx.combineAll(
      ...node.nodes.map((node) => {
        if (node.type === 'text') return Fx.succeed(node.value)

        const renderable = values[node.index]

        if (isDirective<R, E>(renderable)) {
          return Fx.Fx<R, E, unknown>(<R2>(sink: Fx.Sink<R2, E, unknown>) =>
            Effect.contextWithEffect((ctx: Context<R2>) =>
              Effect.suspend(() => {
                const part = partNodeToPart(node, (value) =>
                  Effect.provideContext(sink.event(value), ctx),
                )

                return Effect.catchAllCause(renderable.f(part), sink.error)
              }),
            ),
          )
        }

        return unwrapRenderable<R, E, string | null | undefined>(values[node.index])
      }),
    ),
    (value) => HtmlRenderEvent(render(value as any)),
  )
}

function takeOneIfNotRenderEvent<R, E, A>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.Fx((sink) =>
    Effect.acquireUseRelease(
      Scope.make(),
      (scope) =>
        Effect.flatMap(Deferred.make<never, void>(), (deferred) =>
          pipe(
            fx,
            Fx.observe((event) =>
              isRenderEvent(event)
                ? sink.event(event)
                : Effect.flatMap(sink.event(event), () => Deferred.succeed(deferred, undefined)),
            ),
            Effect.onExit((exit) => Deferred.done(deferred, exit)),
            Effect.provideService(Scope.Scope, scope),
            Effect.forkIn(scope),
            Effect.flatMap(() => Deferred.await(deferred)),
          ),
        ),
      (scope, exit) => Scope.close(scope, exit),
    ),
  )
}
