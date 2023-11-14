import * as Fx from "@typed/fx/Fx"
import { Sink } from "@typed/fx/Sink"
import * as FxStream from "@typed/fx/Stream"
import { TypeId } from "@typed/fx/TypeId"
import { isDirective } from "@typed/template/Directive"
import * as ElementRef from "@typed/template/ElementRef"
import type { ServerEntry } from "@typed/template/Entry"
import type { HtmlChunk, PartChunk, SparsePartChunk, TextChunk } from "@typed/template/HtmlChunk"
import { templateToHtmlChunks } from "@typed/template/HtmlChunk"
import { parse } from "@typed/template/internal/parser"
import { partNodeToPart } from "@typed/template/internal/server"
import { TEXT_START, TYPED_END, TYPED_HOLE, TYPED_START } from "@typed/template/Meta"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import { RenderContext } from "@typed/template/RenderContext"
import { HtmlRenderEvent, isRenderEvent } from "@typed/template/RenderEvent"
import type { RenderEvent } from "@typed/template/RenderEvent"
import { RenderTemplate } from "@typed/template/RenderTemplate"
import { TemplateInstance } from "@typed/template/TemplateInstance"
import type { Rendered } from "@typed/wire"
import { Effect, Option } from "effect"
import { join } from "effect/ReadonlyArray"
import type * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import { StreamTypeId } from "effect/Stream"

const toHtml = (r: RenderEvent) => (r as HtmlRenderEvent).html

export function renderToHtml<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>
): Fx.Fx<Exclude<R, RenderTemplate> | RenderContext, E, string> {
  return Fx.fromFxEffect(
    RenderContext.with((ctx) =>
      fx.pipe(
        Fx.provide(RenderTemplate.layer(renderHtml(ctx))),
        Fx.map(toHtml),
        Fx.startWith(TYPED_START),
        Fx.endWith(TYPED_END)
      )
    )
  )
}

export function renderToHtmlString<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>
): Effect.Effect<Exclude<R, RenderTemplate> | RenderContext, E, string> {
  return Effect.map(Fx.toReadonlyArray(renderToHtml(fx)), join(""))
}

export function renderToStream<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>
): Stream.Stream<Exclude<R, RenderTemplate> | RenderContext, E, Uint8Array> {
  return Stream.encodeText(FxStream.toStream(renderToHtml(fx)))
}

function renderHtml(ctx: RenderContext) {
  return <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    providedRef?: ElementRef.ElementRef<T>
  ): Effect.Effect<
    Scope.Scope | Placeholder.Context<readonly [] extends Values ? never : Values[number]>,
    never,
    TemplateInstance<
      Placeholder.Error<Values[number]>,
      T
    >
  > => {
    return Effect.gen(function*(_) {
      const ref = providedRef || (yield* _(ElementRef.make()))
      const entry = getServerEntry(templateStrings, ctx.templateCache)

      if (values.length === 0) {
        return TemplateInstance(Fx.succeed(HtmlRenderEvent((entry.chunks[0] as TextChunk).value)), ref as any)
      } else {
        return TemplateInstance(
          Fx.filter(
            Fx.mergeBuffer(
              entry.chunks.map((chunk) =>
                renderChunk<
                  Placeholder.Context<readonly [] extends Values ? never : Values[number]>,
                  Placeholder.Error<Values[number]>
                >(chunk, values)
              )
            ),
            (x) => (x.valueOf() as string).length > 0
          ) as any,
          ref as any
        )
      }
    })
  }
}

function renderChunk<R, E>(
  chunk: HtmlChunk,
  values: ReadonlyArray<Renderable<any, any>>
): Fx.Fx<R, E, RenderEvent> {
  if (chunk._tag === "text") {
    return Fx.succeed(HtmlRenderEvent(chunk.value))
  } else if (chunk._tag === "part") {
    return renderPart<R, E>(chunk, values)
  } else {
    return renderSparsePart<R, E>(chunk, values) as Fx.Fx<R, E, RenderEvent>
  }
}

function renderNode<R, E>(renderable: Renderable<any, any>): Fx.Fx<R, E, RenderEvent> {
  switch (typeof renderable) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return Fx.succeed(HtmlRenderEvent(TEXT_START + renderable.toString()))
    case "undefined":
    case "object":
      return renderObject(renderable)
    default:
      return Fx.empty
  }
}

function renderObject<R, E>(renderable: object | null | undefined) {
  if (renderable === null || renderable === undefined) {
    return Fx.succeed(HtmlRenderEvent(TEXT_START))
  } else if (Array.isArray(renderable)) {
    return Fx.mergeBuffer(renderable.map(renderNode)) as any
  } else if (Fx.isFx<R, E, Renderable>(renderable)) {
    return Fx.concatMap(takeOneIfNotRenderEvent(renderable), renderNode as any)
  } else if (Effect.isEffect(renderable)) {
    return Fx.switchMap(Fx.fromEffect(renderable as Effect.Effect<R, E, Renderable>), renderNode<R, E>)
  } else if (isRenderEvent(renderable)) {
    return Fx.succeed(renderable)
  } else {
    return Fx.empty
  }
}

function renderPart<R, E>(
  chunk: PartChunk,
  values: ReadonlyArray<Renderable<any, any>>
): Fx.Fx<R, E, RenderEvent> {
  const { node, render } = chunk
  const renderable: Renderable<any, any> = values[node.index]

  // Refs and events are not rendered into HTML
  if (isDirective<R, E>(renderable)) {
    return Fx.fromSink((sink: Sink<E, RenderEvent>) => {
      const part = partNodeToPart(
        node,
        (value) => sink.onSuccess(HtmlRenderEvent(render(value)))
      )

      return Effect.catchAllCause(renderable(part), sink.onFailure)
    })
  } else if (node._tag === "node") {
    return Fx.endWith(renderNode<R, E>(renderable), HtmlRenderEvent(TYPED_HOLE(node.index)))
  } else {
    return Fx.filterMap(Fx.take(unwrapRenderable<R, E>(renderable), 1), (value) => {
      const s = render(value)

      return s ? Option.some(HtmlRenderEvent(s)) : Option.none()
    })
  }
}

function renderSparsePart<R, E>(
  chunk: SparsePartChunk,
  values: ReadonlyArray<Renderable<any, any>>
): Fx.Fx<R, E, RenderEvent> {
  const { node, render } = chunk

  return Fx.map(
    Fx.take(
      Fx.combine(
        node.nodes.map((node) => {
          if (node._tag === "text") return Fx.succeed(node.value)

          const renderable: Renderable<any, any> = (values as any)[node.index]

          if (isDirective<R, E>(renderable)) {
            return Fx.fromSink<R, E, unknown>((sink: Sink<E, unknown>) =>
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
  return Fx.withEarlyExit(({ fork, sink }) =>
    Fx.run(
      fx,
      Sink(
        sink.onFailure,
        (event) => isRenderEvent(event) ? sink.onSuccess(event) : Effect.zipRight(sink.onSuccess(event), sink.earlyExit)
      )
    ).pipe(
      fork,
      Effect.fromFiberEffect
    )
  )
}

function getServerEntry(
  templateStrings: TemplateStringsArray,
  templateCache: RenderContext["templateCache"]
): ServerEntry {
  const cached = templateCache.get(templateStrings)

  if (cached === undefined || cached._tag === "Browser") {
    const template = parse(templateStrings)

    const entry: ServerEntry = {
      _tag: "Server",
      template,
      chunks: templateToHtmlChunks(template)
    }

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
        return Fx.combine(renderable.map(unwrapRenderable)) as any
      } else if (TypeId in renderable) {
        return renderable as any
      } else if (StreamTypeId in renderable) return Fx.from(renderable)
      // Unwrap Effects such that templates can be embeded directly
      else if (Effect.EffectTypeId in renderable) {
        return Fx.fromFxEffect(Effect.map(renderable as any, unwrapRenderable<any, any>))
      } else return Fx.succeed(renderable as any)
    }
    default:
      return Fx.succeed(renderable)
  }
}
