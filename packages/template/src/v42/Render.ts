import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import { persistent, type Rendered } from "@typed/wire"
import { Effect, Predicate } from "effect"
import { getElements } from "../ElementSource.js"
import type * as ParsedTemplate from "./ParsedTemplate.js"
import { makeRenderCache, type RenderCache } from "./RenderCache.js"
import { RenderContext } from "./RenderContext.js"
import type { Template } from "./Template.js"

export function render(templateOrNull: Template | null) {
  return Effect.gen(function*(_) {
    const document = yield* _(Document)
    const { rootElement } = yield* _(RootElement)
    const { renderCache } = yield* _(RenderContext)
    let cache = renderCache.get(rootElement)

    // If the template is null, we should remove the previously rendered elements
    if (templateOrNull === null) {
      if (cache) {
        removeChildren(rootElement, cache.rendered)
        renderCache.delete(rootElement)
      }

      return rootElement
    }

    // If the cache exists and the template is the same, we can just update the values
    if (cache && cache.template.entry === templateOrNull.entry) {
      yield* _(updateValues(cache, templateOrNull))
      return rootElement
    }

    // If the cache exists, but the template is different, we need to remove the previously rendered elements
    if (cache) {
      removeChildren(rootElement, cache?.rendered)
      renderCache.delete(rootElement)
    }

    // Create a new cache and set it
    cache = makeRenderCache(templateOrNull)
    renderCache.set(rootElement, cache)

    // Render the template
    yield* _(renderTemplate(document, cache, templateOrNull))

    return rootElement
  })
}

function updateValues(cache: RenderCache, template: Template) {
  return Effect.gen(function*(_) {})
}

function renderTemplate(document: Document, cache: RenderCache, template: Template) {
  // eslint-disable-next-line require-yield
  return Effect.gen(function*(_) {
    const fragment = buildTemplate(document, template.entry.template)

    // TODO: Setup All of the parts, use the stack for any nested templates

    const rendered = persistent(document, fragment)

    cache.rendered = rendered
  })
}

function removeChildren(where: HTMLElement, rendered: Rendered | null | undefined) {
  if (Predicate.isNotNullable(rendered)) {
    const elements = getElements(rendered)
    elements.forEach((element) => where.removeChild(element))
  }
}

export function buildTemplate(document: Document, { nodes }: ParsedTemplate.ParsedTemplate): DocumentFragment {
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < nodes.length; ++i) {
    fragment.append(buildNode(document, nodes[i], false))
  }

  return fragment
}

function buildNode(document: Document, node: ParsedTemplate.ParsedNode, isSvgContext: boolean): globalThis.Node {
  switch (node._tag) {
    case "element":
    case "self-closing-element":
    case "text-only-element":
      return buildElement(document, node, isSvgContext)
    case "text":
      return document.createTextNode(node.value)
    case "comment":
      return document.createComment(node.value)
      // Create placeholders for these elements
    case "sparse-comment":
      return document.createComment(`hole${node.nodes.map((n) => n._tag === "text" ? "" : n.index).join("")}`)
    case "comment-part":
    case "node":
      return document.createComment(`hole${node.index}`)
    // Probably won't happen in the DOM, but we'll handle it just in case
    case "doctype":
      return document.implementation.createDocumentType(
        node.name,
        docTypeNameToPublicId(node.name),
        docTypeNameToSystemId(node.name)
      )
  }
}

function docTypeNameToPublicId(name: string): string {
  switch (name) {
    case "html":
      return "-//W3C//DTD HTML 4.01//EN"
    case "svg":
      return "-//W3C//DTD SVG 1.1//EN"
    case "math":
      return "-//W3C//DTD MathML 2.0//EN"
    default:
      return ""
  }
}

function docTypeNameToSystemId(name: string): string {
  switch (name) {
    // HTML5
    case "html":
      return "http://www.w3.org/TR/html4/strict.dtd"
    case "svg":
      return "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"
    case "math":
      return "http://www.w3.org/Math/DTD/mathml2/mathml2.dtd"
    default:
      return ""
  }
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

function buildElement(
  document: Document,
  node: ParsedTemplate.ElementNode | ParsedTemplate.SelfClosingElementNode | ParsedTemplate.TextOnlyElement,
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

function buildTextChild(document: Document, node: ParsedTemplate.Text): globalThis.Node {
  if (node._tag === "text") {
    return document.createTextNode(node.value)
  }

  return document.createComment(`hole${node.index}`)
}
