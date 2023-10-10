import * as Context from "@typed/context"
import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import * as Versioned from "@typed/fx/Versioned"
import { ElementRef } from "@typed/template/ElementRef"
import type { BrowserEntry } from "@typed/template/Entry"
import { parser } from "@typed/template/internal/parser"
import {
  AttributePartImpl,
  BooleanPartImpl,
  ClassNamePartImpl,
  CommentPartImpl,
  DataPartImpl,
  EventPartImpl,
  NodePartImpl,
  PropertyPartImpl,
  RefPartImpl,
  SparseAttributePartImpl,
  SparseClassNamePartImpl,
  SparseCommentPartImpl,
  StaticTextImpl,
  TextPartImpl
} from "@typed/template/internal/parts"
import { findPath } from "@typed/template/internal/utils"
import type {
  AttributePart,
  ClassNamePart,
  CommentPart,
  Part,
  Parts,
  SparsePart,
  StaticText
} from "@typed/template/Part"
import type { Renderable } from "@typed/template/Renderable"
import { RenderContext } from "@typed/template/RenderContext"
import { DomRenderEvent, type RenderEvent } from "@typed/template/RenderEvent"
import { RenderTemplate } from "@typed/template/RenderTemplate"
import type * as Template from "@typed/template/Template"
import { TemplateInstance } from "@typed/template/TemplateInstance"
import type { Rendered } from "@typed/wire"
import * as Effect from "effect/Effect"
import { replace } from "effect/ReadonlyArray"

export function render<R, E>(
  rendered: Fx.Fx<R, E, RenderEvent | null>
): Fx.Fx<Exclude<R, RenderTemplate> | Document | RenderContext | RootElement, E, Rendered | null> {
  return Fx.fromFxEffect(Effect.contextWith((context) => {
    const [document, ctx, { rootElement }] = Context.getMany(context, Document, RenderContext, RootElement)

    return Fx.mapEffect(rendered, (what) => attachRoot(ctx.renderCache, rootElement, what)).pipe(
      Fx.provideService(RenderTemplate, renderTemplate(document, ctx))
    )
  }))
}

const renderTemplate: (document: Document, ctx: RenderContext) => RenderTemplate =
  (document, ctx) =>
  <Values extends ReadonlyArray<Renderable<any, any>>, T extends Rendered = Rendered>(
    templateStrings: TemplateStringsArray,
    values: Values,
    providedRef?: ElementRef<T>
  ) =>
    Effect.gen(function*(_) {
      const ref = providedRef || (yield* _(ElementRef<T>()))
      const events = Versioned.map(ref, { onFx: DomRenderEvent, onEffect: DomRenderEvent })
      const entry = getBrowserEntry(document, ctx, templateStrings)
      const content = document.importNode(entry.content, true) // Clone our template
      const parts = buildParts(ctx, entry.template, content) // Build runtime-variant of parts with our content.

      // TODO: Utilize the Values to update the parts
      // TODO: ensure Ref's are updated last

      return TemplateInstance(events, ref)
    })

function attachRoot(
  cache: RenderContext["renderCache"],
  where: HTMLElement,
  what: RenderEvent | null // TODO: Should we support HTML RenderEvents here too?
): Effect.Effect<never, never, Rendered | null> {
  return Effect.sync(() => {
    const wire = what?.valueOf() as Rendered | null
    const previous = cache.get(where)

    if (wire !== previous) {
      if (previous && !wire) where.removeChild(previous.valueOf() as globalThis.Node)

      cache.set(where, wire || null)

      if (wire) where.replaceChildren(wire.valueOf() as globalThis.Node)

      return wire
    }

    return previous
  })
}

function getBrowserEntry(document: Document, ctx: RenderContext, templateStrings: TemplateStringsArray): BrowserEntry {
  const cached = ctx.templateCache.get(templateStrings)

  if (cached === undefined || cached._tag === "Server") {
    const template = parser.parse(templateStrings)
    const content = buildTemplate(document, template)
    const entry: BrowserEntry = {
      _tag: "Browser",
      template,
      content
    }

    ctx.templateCache.set(templateStrings, entry)

    return entry
  } else {
    return cached
  }
}

function buildParts(ctx: RenderContext, template: Template.Template, content: DocumentFragment): Parts {
  return template.parts.map(([part, path]) => buildPartWithNode(ctx, part, findPath(content, path)))
}

function buildPartWithNode(
  ctx: RenderContext,
  part: Template.PartNode | Template.SparsePartNode,
  node: Node
): Part | SparsePart {
  switch (part._tag) {
    case "attr":
      return AttributePartImpl.browser(node as Element, part.name, ctx)
    case "boolean-part":
      return BooleanPartImpl.browser(node as Element, part.name, ctx)
    case "className-part":
      return ClassNamePartImpl.browser(node as Element, ctx)
    case "comment-part":
      return CommentPartImpl.browser(node as Comment, ctx)
    case "data":
      return DataPartImpl.browser(node as HTMLElement | SVGElement, ctx)
    case "event":
      return EventPartImpl.browser(part.name, node as HTMLElement | SVGElement, Effect.logError, ctx)
    case "node":
      return NodePartImpl.browser(node as HTMLElement | SVGElement, ctx)
    case "property":
      return PropertyPartImpl.browser(node, part.name, ctx)
    case "ref":
      return RefPartImpl.browser(node, ctx)
    case "sparse-attr": {
      const parts: Array<AttributePart | StaticText> = Array(part.nodes.length)
      const sparse = SparseAttributePartImpl.browser(
        part.name,
        parts,
        node as HTMLElement | SVGElement,
        ctx
      )

      for (let i = 0; i < part.nodes.length; ++i) {
        const node = part.nodes[i]

        if (node._tag === "text") {
          parts.push(new StaticTextImpl(node.value))
        } else {
          parts.push(
            new AttributePartImpl(
              node.name,
              ctx,
              ({ value }) => sparse.update(replace(sparse.value, i, value || "")),
              sparse.value[i]
            )
          )
        }
      }

      return sparse
    }
    case "sparse-class-name": {
      const parts: Array<ClassNamePart | StaticText> = Array(part.nodes.length)
      const sparse = SparseClassNamePartImpl.browser(
        parts,
        node as HTMLElement | SVGElement,
        ctx
      )

      for (let i = 0; i < part.nodes.length; ++i) {
        const node = part.nodes[i]

        if (node._tag === "text") {
          parts.push(new StaticTextImpl(node.value))
        } else {
          parts.push(
            new ClassNamePartImpl(
              ctx,
              ({ value }) => sparse.update(replace(sparse.value, i, value || "")),
              (Array.isArray(sparse.value[i]) ? sparse.value[i] : [sparse.value[i]]) as Array<string>
            )
          )
        }
      }

      return sparse
    }
    case "sparse-comment": {
      const parts: Array<CommentPart | StaticText> = Array(part.nodes.length)
      const sparse = SparseCommentPartImpl.browser(
        node as Comment,
        parts,
        ctx
      )

      for (let i = 0; i < part.nodes.length; ++i) {
        const node = part.nodes[i]

        if (node._tag === "text") {
          parts.push(new StaticTextImpl(node.value))
        } else {
          parts.push(
            new CommentPartImpl(
              ctx,
              ({ value }) => sparse.update(replace(sparse.value, i, value || "")),
              sparse.value[i]
            )
          )
        }
      }

      return sparse
    }
    case "text-part":
      return TextPartImpl.browser(node as Element, ctx)
  }
}

export function buildTemplate(document: Document, { nodes }: Template.Template): DocumentFragment {
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < nodes.length; ++i) {
    fragment.append(buildNode(document, nodes[i], false))
  }

  return fragment
}

function buildNode(document: Document, node: Template.Node, isSvgContext: boolean): globalThis.Node {
  switch (node._tag) {
    case "element":
    case "self-closing-element":
    case "text-only-element":
      return buildElement(document, node, isSvgContext)
    case "text":
      return document.createTextNode(node.value)
    case "comment":
      return document.createComment(node.value)
    case "sparse-comment":
      return document.createComment("")
    // Create placeholders for these elements
    case "comment-part":
    case "node":
      return document.createComment(`hole${node.index}`)
  }
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

function buildElement(
  document: Document,
  node: Template.ElementNode | Template.SelfClosingElementNode | Template.TextOnlyElement,
  isSvgContext: boolean
): Element {
  const { _tag, attributes, tagName } = node
  const isSvg = isSvgContext ? tagName !== "foreignObject" : tagName === "svg"
  const element = isSvg
    ? document.createElementNS(SVG_NAMESPACE, tagName)
    : document.createElement(tagName)

  for (let i = 0; i < attributes.length; ++i) {
    const attr = attributes[i]

    // We only handle static attributes here, parts are handled elsewhere
    if (attr._tag === "attribute") {
      element.setAttribute(attr.name, attr.value)
    } else if (attr._tag === "boolean") {
      element.toggleAttribute(attr.name, true)
    }
  }

  if (_tag === "element") {
    element.append(...node.children.map((child) => buildNode(document, child, isSvg)))
  } else if (_tag === "text-only-element") {
    element.append(...node.children.map((child) => buildTextChild(document, child)))
  }

  return element
}

function buildTextChild(document: Document, node: Template.Text): globalThis.Node {
  if (node._tag === "text") {
    return document.createTextNode(node.value)
  }

  return document.createComment(`hole${node.index}`)
}
