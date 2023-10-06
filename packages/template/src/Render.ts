import * as Context from "@typed/context"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import * as Versioned from "@typed/fx/Versioned"
import { ElementRef } from "@typed/template/ElementRef"
import type { BrowserEntry } from "@typed/template/Entry"
import { parser } from "@typed/template/internal/parser"
import { AttributePartImpl } from "@typed/template/internal/parts"
import { findPath } from "@typed/template/internal/utils"
import type { Part, Parts, SparsePart } from "@typed/template/Part"
import type { Renderable } from "@typed/template/Renderable"
import { RenderContext } from "@typed/template/RenderContext"
import { DomRenderEvent, type RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import type * as Template from "@typed/template/Template"
import { TemplateInstance } from "@typed/template/TemplateInstance"
import type { Rendered } from "@typed/wire"
import * as Effect from "effect/Effect"

export function render<R, E>(
  rendered: Fx.Fx<R, E, RenderEvent | null>
): Fx.Fx<R | RenderContext | RootElement, E, Rendered | null> {
  return Fx.fromFxEffect(Effect.contextWith((context) => {
    const [{ renderCache }, { rootElement }] = Context.getMany(context, RenderContext, RootElement)

    return Fx.mapEffect(rendered, (what) => attachRoot(renderCache, rootElement, what))
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
  switch (part.type) {
    case "attr":
      return AttributePartImpl.browser(node as Element, part.name, ctx)
    case "boolean-part":
      return void 0
    case "className-part":
      return void 0
    case "comment-part":
      return void 0
    case "data":
      return void 0
    case "event":
      return void 0
    case "node":
      return void 0
    case "property":
      return void 0
    case "ref":
      return void 0
    case "sparse-attr":
      return void 0
    case "sparse-class-name":
      return void 0
    case "sparse-comment":
      return void 0
    case "text-part":
      return void 0
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
  switch (node.type) {
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
  const { attributes, tagName, type } = node
  const isSvg = isSvgContext ? tagName !== "foreignObject" : tagName === "svg"
  const element = isSvg
    ? document.createElementNS(SVG_NAMESPACE, tagName)
    : document.createElement(tagName)

  for (let i = 0; i < attributes.length; ++i) {
    const attr = attributes[i]

    // We only handle static attributes here, parts are handled elsewhere
    if (attr.type === "attribute") {
      element.setAttribute(attr.name, attr.value)
    } else if (attr.type === "boolean") {
      element.toggleAttribute(attr.name, true)
    }
  }

  if (type === "element") {
    element.append(...node.children.map((child) => buildNode(document, child, isSvg)))
  } else if (node.type === "text-only-element") {
    element.append(...node.children.map((child) => buildTextChild(document, child)))
  }

  return element
}

function buildTextChild(document: Document, node: Template.Text): globalThis.Node {
  if (node.type === "text") {
    return document.createTextNode(node.value)
  }

  return document.createComment(`hole${node.index}`)
}
