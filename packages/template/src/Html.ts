/**
 * @since 1.0.0
 */

import * as Fx from "@typed/fx/Fx"
import * as Sink from "@typed/fx/Sink"
import { TypeId } from "@typed/fx/TypeId"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { join } from "effect/ReadonlyArray"
import type * as Scope from "effect/Scope"
import { isDirective } from "./Directive.js"
import type { ServerEntry } from "./Entry.js"
import type { HtmlChunk, PartChunk, SparsePartChunk, TextChunk } from "./HtmlChunk.js"
import { templateToHtmlChunks } from "./HtmlChunk.js"
import { parse } from "./internal/parser.js"
import { partNodeToPart } from "./internal/server.js"
import { TEXT_START, TYPED_END, TYPED_HOLE, TYPED_START } from "./Meta.js"
import type { Placeholder } from "./Placeholder.js"
import type { Renderable } from "./Renderable.js"
import { RenderContext } from "./RenderContext.js"
import { HtmlRenderEvent, isRenderEvent } from "./RenderEvent.js"
import type { RenderEvent } from "./RenderEvent.js"
import { RenderTemplate } from "./RenderTemplate.js"

const toHtml = (r: RenderEvent) => (r as HtmlRenderEvent).html

const [padStart, padEnd] = [[TYPED_START], [TYPED_END]] as const

/**
 * @since 1.0.0
 */
export function renderToHtml<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>
): Fx.Fx<Exclude<R, RenderTemplate> | RenderContext, E, string> {
  return Fx.fromFxEffect(
    RenderContext.with((ctx) =>
      fx.pipe(
        Fx.provide(RenderTemplate.layer(renderHtml(ctx))),
        Fx.map(toHtml),
        (x) => ctx.environment === "static" ? x : Fx.padWith(x, padStart, padEnd)
      )
    )
  )
}

/**
 * @since 1.0.0
 */
export function renderToHtmlString<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>
): Effect.Effect<Exclude<R, RenderTemplate> | RenderContext, E, string> {
  return Effect.map(Fx.toReadonlyArray(renderToHtml(fx)), join(""))
}

function renderHtml(ctx: RenderContext) {
  return <Values extends ReadonlyArray<Renderable<any, any>>>(
    templateStrings: TemplateStringsArray,
    values: Values
  ): Fx.Fx<
    Scope.Scope | Placeholder.Context<readonly [] extends Values ? never : Values[number]>,
    Placeholder.Error<Values[number]>,
    RenderEvent
  > => {
    const isStatic = ctx.environment === "static"
    const entry = getServerEntry(templateStrings, ctx.templateCache, isStatic)
    if (values.length === 0) {
      return Fx.succeed(HtmlRenderEvent((entry.chunks[0] as TextChunk).value))
    } else {
      return Fx.filter(
        Fx.mergeOrdered(
          entry.chunks.map((chunk) =>
            renderChunk<
              Placeholder.Context<readonly [] extends Values ? never : Values[number]>,
              Placeholder.Error<Values[number]>
            >(chunk, values, isStatic)
          )
        ),
        (x) => (x.valueOf() as string).length > 0
      )
    }
  }
}

function renderChunk<R, E>(
  chunk: HtmlChunk,
  values: ReadonlyArray<Renderable<any, any>>,
  isStatic: boolean
): Fx.Fx<R, E, RenderEvent> {
  if (chunk._tag === "text") {
    return Fx.succeed(HtmlRenderEvent(chunk.value))
  } else if (chunk._tag === "part") {
    return renderPart<R, E>(chunk, values, isStatic)
  } else {
    return renderSparsePart<R, E>(chunk, values) as Fx.Fx<R, E, RenderEvent>
  }
}

function renderNode<R, E>(renderable: Renderable<any, any>, isStatic: boolean): Fx.Fx<R, E, RenderEvent> {
  switch (typeof renderable) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return Fx.succeed(HtmlRenderEvent((isStatic ? "" : TEXT_START) + renderable.toString()))
    case "undefined":
    case "object":
      return renderObject(renderable, isStatic)
    default:
      return Fx.empty
  }
}

function renderObject<R, E>(renderable: object | null | undefined, isStatic: boolean) {
  if (renderable === null || renderable === undefined) {
    return isStatic ? Fx.empty : Fx.succeed(HtmlRenderEvent(TEXT_START))
  } else if (Array.isArray(renderable)) {
    return Fx.mergeOrdered(renderable.map((r) => renderNode(r, isStatic))) as any
  } else if (Fx.isFx<R, E, Renderable>(renderable)) {
    // @ts-expect-error Types are to deep to infer
    return Fx.concatMap(takeOneIfNotRenderEvent(renderable), (r) => renderNode(r, isStatic) as any)
  } else if (Effect.isEffect(renderable)) {
    return Fx.switchMap(
      Fx.fromEffect(renderable as Effect.Effect<R, E, Renderable>),
      (r) => renderNode<R, E>(r, isStatic)
    )
  } else if (isRenderEvent(renderable)) {
    return Fx.succeed(renderable)
  } else {
    return Fx.empty
  }
}

function renderPart<R, E>(
  chunk: PartChunk,
  values: ReadonlyArray<Renderable<any, any>>,
  isStatic: boolean
): Fx.Fx<R, E, RenderEvent> {
  const { node, render } = chunk
  const renderable: Renderable<any, any> = values[node.index]

  // Refs and events are not rendered into HTML
  if (isDirective<R, E>(renderable)) {
    return Fx.make((sink: Sink.Sink<never, E, RenderEvent>) => {
      const part = partNodeToPart(
        node,
        (value) => sink.onSuccess(HtmlRenderEvent(render(value)))
      )

      return Effect.catchAllCause(renderable(part), sink.onFailure)
    })
  } else if (node._tag === "node") {
    if (isStatic) return renderNode<R, E>(renderable, isStatic)
    return Fx.append(renderNode<R, E>(renderable, isStatic), HtmlRenderEvent(TYPED_HOLE(node.index)))
  } else if (node._tag === "properties") {
    if (renderable == null) return Fx.empty
    return Fx.map(
      Fx.take(
        Fx.struct(
          Object.fromEntries(Object.entries(renderable).map(([k, v]) => [k, unwrapRenderable(v)] as const))
        ),
        1
      ),
      render
    ) as any
  } else {
    if (renderable === null) return Fx.succeed(HtmlRenderEvent(render(renderable)))

    const html = Fx.filterMap(Fx.take(unwrapRenderable<R, E>(renderable), 1), (value) => {
      const s = render(value)

      return s ? Option.some(HtmlRenderEvent(s)) : Option.none()
    })

    if (isStatic === false && node._tag === "text-part") {
      return Fx.append(Fx.prepend(html, HtmlRenderEvent(TEXT_START)), HtmlRenderEvent(TYPED_HOLE(node.index)))
    }

    return html
  }
}

function renderSparsePart<R, E>(
  chunk: SparsePartChunk,
  values: ReadonlyArray<Renderable<any, any>>
): Fx.Fx<R, E, RenderEvent> {
  const { node, render } = chunk

  return Fx.map(
    Fx.take(
      Fx.tuple(
        node.nodes.map((node) => {
          if (node._tag === "text") return Fx.succeed(node.value)

          const renderable: Renderable<any, any> = (values as any)[node.index]

          if (isDirective<R, E>(renderable)) {
            return Fx.make<R, E, unknown>((sink: Sink.Sink<never, E, unknown>) =>
              Effect.catchAllCause(
                renderable(partNodeToPart(node, (value) => sink.onSuccess(value))),
                sink.onFailure
              )
            )
          }

          return unwrapRenderable<R, E>(renderable)
        })
      ),
      1
    ),
    (value) => HtmlRenderEvent(render(value))
  )
}

function takeOneIfNotRenderEvent<R, E, A>(fx: Fx.Fx<R, E, A>): Fx.Fx<R, E, A> {
  return Fx.make<R, E, A>((sink) =>
    Sink.withEarlyExit(sink, (sink) =>
      fx.run(
        Sink.make(
          sink.onFailure,
          (event) =>
            isRenderEvent(event) ? sink.onSuccess(event) : Effect.zipRight(sink.onSuccess(event), sink.earlyExit)
        )
      ))
  )
}

function getServerEntry(
  templateStrings: TemplateStringsArray,
  templateCache: RenderContext["templateCache"],
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

function unwrapRenderable<R, E>(renderable: Renderable<any, any>): Fx.Fx<R, E, any> {
  switch (typeof renderable) {
    case "undefined":
    case "object": {
      if (renderable === null || renderable === undefined) return Fx.succeed(null)
      else if (Array.isArray(renderable)) {
        return Fx.tuple(renderable.map(unwrapRenderable)) as any
      } else if (TypeId in renderable) {
        return renderable as any
      } else if (Effect.EffectTypeId in renderable) {
        return Fx.fromFxEffect(Effect.map(renderable as any, unwrapRenderable<any, any>))
      } else return Fx.succeed(renderable as any)
    }
    default:
      return Fx.succeed(renderable)
  }
}
