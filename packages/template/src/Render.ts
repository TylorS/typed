import * as Context from "@typed/context"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { RenderContext } from "@typed/template/RenderContext"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type * as Template from "@typed/template/Template"
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

function attachRoot(
  cache: RenderContext["renderCache"],
  where: HTMLElement,
  what: RenderEvent | null
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
