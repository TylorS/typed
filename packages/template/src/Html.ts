/**
 * @since 1.0.0
 */

import type { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import * as Sink from "@typed/fx/Sink"
import { FxTypeId } from "@typed/fx/TypeId"
import { join } from "effect/Array"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import type * as Record from "effect/Record"
import type * as Scope from "effect/Scope"
import { isDirective } from "./Directive.js"
import type { ServerEntry } from "./Entry.js"
import type { HtmlChunk, PartChunk, SparsePartChunk, TextChunk } from "./HtmlChunk.js"
import { templateToHtmlChunks } from "./HtmlChunk.js"
import { parse } from "./internal/parser2.js"
import { partNodeToPart } from "./internal/server.js"
import { isNullOrUndefined } from "./internal/v2/helpers.js"
import { TEXT_START, TYPED_HOLE_END, TYPED_HOLE_START } from "./Meta.js"
import type { Placeholder } from "./Placeholder.js"
import type { Renderable } from "./Renderable.js"
import * as RenderContext from "./RenderContext.js"
import { HtmlRenderEvent, isHtmlRenderEvent } from "./RenderEvent.js"
import type { RenderEvent } from "./RenderEvent.js"
import * as RenderQueue from "./RenderQueue.js"
import { RenderTemplate } from "./RenderTemplate.js"

const toHtml = (r: RenderEvent | null) => r === null ? "" : (r as HtmlRenderEvent).html

/**
 * @since 1.0.0
 */
export const serverLayer: Layer.Layer<
  | RenderContext.RenderContext
  | RenderQueue.RenderQueue
  | RenderTemplate
  | CurrentEnvironment
> = Layer.provideMerge(
  RenderTemplate.layer(RenderContext.RenderContext.with(renderHtmlTemplate)),
  RenderContext.server
).pipe(Layer.provideMerge(RenderQueue.sync))

/**
 * @since 1.0.0
 */
export const staticLayer: Layer.Layer<
  | RenderContext.RenderContext
  | RenderQueue.RenderQueue
  | RenderTemplate
  | CurrentEnvironment
> = Layer.provideMerge(
  RenderTemplate.layer(RenderContext.RenderContext.with(renderHtmlTemplate)),
  RenderContext.static
).pipe(Layer.provideMerge(RenderQueue.sync))

/**
 * @since 1.0.0
 */
export function renderToHtml<E, R>(
  fx: Fx.Fx<RenderEvent | null, E, R>
): Fx.Fx<string, E, R> {
  return Fx.map(fx, toHtml)
}

/**
 * @since 1.0.0
 */
export function renderToHtmlString<E, R>(
  fx: Fx.Fx<RenderEvent | null, E, R>
): Effect.Effect<string, E, R> {
  return Effect.map(Fx.toReadonlyArray(renderToHtml(fx)), join(""))
}

/**
 * @since 1.0.0
 */
export function renderHtmlTemplate(ctx: RenderContext.RenderContext) {
  return <Values extends ReadonlyArray<Renderable<any, any>>>(
    templateStrings: TemplateStringsArray,
    values: Values
  ): Fx.Fx<
    RenderEvent,
    Placeholder.Error<Values[number]>,
    | Scope.Scope
    | Placeholder.Context<Values[number]>
  > => {
    const isStatic = ctx.environment === "static" || ctx.environment === "test:static"
    const entry = getServerEntry(templateStrings, ctx.templateCache, isStatic)

    if (values.length === 0) {
      return Fx.succeed(
        HtmlRenderEvent((entry.chunks[0] as TextChunk).value, true)
      )
    } else {
      const lastIndex = entry.chunks.length - 1
      return Fx.mergeOrdered(
        entry.chunks.map((chunk, i) =>
          renderChunk<
            Placeholder.Error<Values[number]>,
            Placeholder.Context<Values[number]>
          >(chunk, values, isStatic, i === lastIndex)
        )
      ).pipe(
        Fx.filter((x) => x.html.length > 0),
        Fx.dropAfter((x) => x.done)
      )
    }
  }
}

function renderChunk<E, R>(
  chunk: HtmlChunk,
  values: ReadonlyArray<Renderable<any, any>>,
  isStatic: boolean,
  done: boolean
): Fx.Fx<HtmlRenderEvent, E, R | Scope.Scope> {
  if (chunk._tag === "text") {
    return Fx.succeed(HtmlRenderEvent(chunk.value, done))
  } else if (chunk._tag === "part") {
    return renderPart<E, R>(chunk, values, isStatic, done)
  } else {
    return renderSparsePart<E, R>(chunk, values, done) as Fx.Fx<
      HtmlRenderEvent,
      E,
      R
    >
  }
}

function renderNode<E, R>(
  renderable: Renderable<any, any>,
  isStatic: boolean,
  done: boolean
): Fx.Fx<HtmlRenderEvent, E, R | Scope.Scope> {
  switch (typeof renderable) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return Fx.succeed(
        HtmlRenderEvent(
          (isStatic ? "" : TEXT_START) + renderable.toString(),
          done
        )
      )
    case "undefined":
    case "object":
      return renderObject(renderable, isStatic, done)
    default:
      return Fx.empty
  }
}

function renderObject<E, R>(
  renderable: object | null | undefined,
  isStatic: boolean,
  done: boolean
): Fx.Fx<HtmlRenderEvent, E, R | Scope.Scope> {
  if (isNullOrUndefined(renderable)) {
    return isStatic ? Fx.empty : Fx.succeed(HtmlRenderEvent(TEXT_START, done))
  } else if (Array.isArray(renderable)) {
    const lastIndex = renderable.length - 1
    return Fx.mergeOrdered(
      renderable.map((r, i) => renderNode(r, isStatic, done && i === lastIndex))
    ) as any
  } else if (Effect.isEffect(renderable)) {
    return Fx.fromFxEffect(
      Effect.map(renderable as Effect.Effect<Renderable, E, R>, (r) => renderNode<E, R>(r, isStatic, done))
    )
  } else if (Fx.isFx<RenderEvent, E, R>(renderable)) {
    return takeOneIfNotRenderEvent(renderable, isStatic, done)
  } else if (isHtmlRenderEvent(renderable)) {
    if (done) {
      return Fx.succeed(renderable)
    } else {
      return Fx.succeed(HtmlRenderEvent(renderable.html, done))
    }
  } else {
    return Fx.empty
  }
}

function renderPart<E, R>(
  chunk: PartChunk,
  values: ReadonlyArray<Renderable<any, any>>,
  isStatic: boolean,
  done: boolean
): Fx.Fx<HtmlRenderEvent, E, R | Scope.Scope> {
  const { node, render } = chunk
  const renderable: Renderable<any, any> = values[node.index]

  // Refs and events are not rendered into HTML
  if (isDirective<E, R>(renderable)) {
    return Fx.make<HtmlRenderEvent, E, R>(
      (sink: Sink.Sink<HtmlRenderEvent, E>) => {
        const part = partNodeToPart(node, (value) => sink.onSuccess(HtmlRenderEvent(render(value), done)))

        return Effect.catchAllCause(renderable(part), sink.onFailure)
      }
    )
  } else if (node._tag === "node") {
    if (isStatic) return renderNode<E, R>(renderable, isStatic, done)
    let first = true
    return Fx.continueWith(
      Fx.map(renderNode<E, R>(renderable, isStatic, true), (x) => {
        if (x.done) {
          const y = HtmlRenderEvent(
            (first ? TYPED_HOLE_START(node.index) : "") +
              x.html +
              TYPED_HOLE_END(node.index),
            done
          )
          first = false
          return y
        } else {
          if (first) {
            first = false
            return HtmlRenderEvent(
              TYPED_HOLE_START(node.index) + x.html,
              false
            )
          }
          return x
        }
      }),
      () =>
        first
          ? Fx.succeed(
            HtmlRenderEvent(
              TYPED_HOLE_START(node.index) + TYPED_HOLE_END(node.index),
              done
            )
          )
          : Fx.empty
    )
  } else if (node._tag === "properties") {
    if (renderable == null) return Fx.empty

    return Fx.mergeAll(
      Object.entries(renderable as Record<string, Renderable<any, any>>).map(
        ([key, renderable]) => {
          return Fx.filterMap(
            Fx.take(unwrapRenderable<E, R>(renderable), 1),
            (value) => {
              const s = render({ [key]: value })

              return s ? Option.some(HtmlRenderEvent(s, done)) : Option.none()
            }
          )
        }
      )
    )
  } else {
    if (renderable === null) {
      return Fx.succeed(HtmlRenderEvent(render(renderable), done))
    }

    const html = Fx.filterMap(
      Fx.take(unwrapRenderable<E, R>(renderable), 1),
      (value) => {
        const s = render(value)

        return s ? Option.some(HtmlRenderEvent(s, done)) : Option.none()
      }
    )

    return html
  }
}

function renderSparsePart<E, R>(
  chunk: SparsePartChunk,
  values: ReadonlyArray<Renderable<any, any>>,
  done: boolean
): Fx.Fx<RenderEvent, E, R> {
  const { node, render } = chunk

  return Fx.map(
    Fx.take(
      Fx.tuple(
        node.nodes.map((node) => {
          if (node._tag === "text") return Fx.succeed(node.value)

          const renderable: Renderable<any, any> = (values as any)[node.index]

          if (isDirective<E, R>(renderable)) {
            return Fx.make<unknown, E, R>((sink: Sink.Sink<unknown, E>) =>
              Effect.catchAllCause(
                renderable(
                  partNodeToPart(node, (value) => sink.onSuccess(value))
                ),
                sink.onFailure
              )
            )
          }

          return unwrapRenderable<E, R>(renderable)
        })
      ),
      1
    ),
    (value) => HtmlRenderEvent(render(value), done)
  )
}

function takeOneIfNotRenderEvent<A, E, R>(
  fx: Fx.Fx<A, E, R>,
  isStatic: boolean,
  done: boolean
): Fx.Fx<HtmlRenderEvent, E, R> {
  return Fx.make<HtmlRenderEvent, E, R>((sink) =>
    Effect.uninterruptible(Sink.withEarlyExit(sink, (sink) =>
      fx.run(
        Sink.make(sink.onFailure, (event) => {
          if (isHtmlRenderEvent(event)) {
            if (done) {
              return sink.onSuccess(event)
            } else {
              return sink.onSuccess(HtmlRenderEvent(event.html, false))
            }
          }

          if (isNullOrUndefined(event)) {
            return sink.earlyExit
          }

          return Effect.zipRight(
            sink.onSuccess(
              HtmlRenderEvent(
                (isStatic ? "" : TEXT_START) + String(event),
                done
              )
            ),
            sink.earlyExit
          )
        })
      )))
  )
}

function getServerEntry(
  templateStrings: TemplateStringsArray,
  templateCache: RenderContext.RenderContext["templateCache"],
  isStatic: boolean
): ServerEntry {
  const cached = templateCache.get(templateStrings)

  if (cached === undefined || cached._tag === "Browser") {
    const template = parse(templateStrings)
    const entry: ServerEntry = {
      _tag: "Server",
      template,
      chunks: templateToHtmlChunks(template, isStatic)
    }

    templateCache.set(templateStrings, entry)

    return entry
  } else {
    return cached
  }
}

function unwrapRenderable<E, R>(
  renderable: Renderable<any, any>
): Fx.Fx<any, E, R> {
  switch (typeof renderable) {
    case "undefined":
    case "object": {
      if (isNullOrUndefined(renderable)) {
        return Fx.null
      } else if (Array.isArray(renderable)) {
        return Fx.mergeOrdered(
          renderable.map((r) => takeOneIfNotRenderEvent(unwrapRenderable(r), true, false))
        ) as any
      } else if (Effect.EffectTypeId in renderable) {
        return Fx.fromFxEffect(
          Effect.map(renderable as any, unwrapRenderable<any, any>)
        )
      } else if (FxTypeId in renderable) {
        return renderable as any
      } else return Fx.succeed(renderable as any)
    }
    default:
      return Fx.succeed(renderable)
  }
}
