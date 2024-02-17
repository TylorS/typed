/**
 * Low-level Effect wrappers for Document APIS and usage from the Context.
 * @since 8.19.0
 */

import * as Context from "@typed/context/Extensions"
import type * as Effect from "effect/Effect"

import type * as Scope from "effect/Scope"
import type { AddEventListenerOptions } from "./EventTarget.js"
import { addEventListener } from "./EventTarget.js"

/**
 * @since 8.19.0
 * @category models
 */
export interface Document extends globalThis.Document {}

/**
 * @since 8.19.0
 * @category context
 */
export const Document: Context.Tagged<Document> = Context.Tagged<Document>("@typed/dom/Document")

/**
 * Retrieve the body element from the current Document
 * @since 8.19.0
 * @category elements
 */
export const getBody: Effect.Effect<HTMLBodyElement, never, Document> = Document.with(
  (d) => d.body as HTMLBodyElement
)

/**
 * Retrieve the head element from the current Document
 * @since 8.19.0
 * @category elements
 */
export const getHead: Effect.Effect<HTMLHeadElement, never, Document> = Document.with((d) => d.head)

/**
 * Add an event listener to the document
 * @since 8.19.0
 * @category events
 */
export const addDocumentListener = <EventName extends string, R = never>(
  options: AddEventListenerOptions<Document, EventName, R>
): Effect.Effect<void, never, R | Document | Scope.Scope> => Document.withEffect((d) => addEventListener(d, options))

/**
 * Create a new element
 * @since 8.19.0
 * @category elements
 */
export const createElement: <TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName
) => Effect.Effect<HTMLElementTagNameMap[TagName], never, Document> = <
  TagName extends keyof HTMLElementTagNameMap
>(
  tagName: TagName
): Effect.Effect<HTMLElementTagNameMap[TagName], never, Document> => Document.with((d) => d.createElement(tagName))

/**
 * Create a new element with a namespace
 * @since 8.19.0
 * @category elements
 */
export const createElementNS = (
  namespaceURI: string,
  tagName: string
): Effect.Effect<Element, never, Document> => Document.with((d) => d.createElementNS(namespaceURI, tagName))

/**
 * Create a new SVG element
 * @since 8.19.0
 * @category elements
 */
export const createSvgElement = <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName
): Effect.Effect<SVGElementTagNameMap[TagName], never, Document> =>
  createElementNS("http://www.w3.org/2000/svg", tagName) as Effect.Effect<
    SVGElementTagNameMap[TagName],
    never,
    Document
  >

/**
 * Create a new text node
 * @since 8.19.0
 * @category elements
 */
export const createTextNode = (data: string): Effect.Effect<Text, never, Document> =>
  Document.with((d) => d.createTextNode(data))

/**
 * Create a new comment node
 * @since 8.19.0
 * @category elements
 */
export const createComment = (data: string): Effect.Effect<Comment, never, Document> =>
  Document.with((d) => d.createComment(data))

/**
 * Create a new document fragment
 * @since 8.19.0
 * @category elements
 */
export const createDocumentFragment: Effect.Effect<DocumentFragment, never, Document> = Document.with((d) =>
  d.createDocumentFragment()
)

/**
 * Create a new TreeWalker
 * @since 8.19.0
 */
export const createTreeWalker = (root: Node, whatToShow?: number, filter?: NodeFilter | null) =>
  Document.with((d) => d.createTreeWalker(root, whatToShow, filter))

/**
 * Create a new Range
 * @since 8.19.0
 */
export const createRange: Effect.Effect<Range, never, Document> = Document.with((d) => d.createRange())

/**
 * Create a new Attr
 * @since 8.19.0
 * @category atrributes
 */
export const createAttributeNS = (
  namespace: string | null,
  qualifiedName: string
): Effect.Effect<Attr, never, Document> => Document.with((d) => d.createAttributeNS(namespace, qualifiedName))

/**
 * Get the <html> element
 * @since 8.19.0
 */
export const getDocumentElement: Effect.Effect<HTMLElement, never, Document> = Document.with(
  (d) => d.documentElement
)

/**
 * Import a node into the current document
 * @since 8.19.0
 */
export const importNode: <T extends Node>(
  node: T,
  deep?: boolean
) => Effect.Effect<T, never, Document> = <T extends Node>(node: T, deep?: boolean) =>
  Document.with((d) => d.importNode(node, deep))

/**
 * Update the title of the document
 * @since 8.19.0
 */
export const updateTitle: (title: string) => Effect.Effect<string, never, Document> = (
  title: string
) => Document.with((d) => (d.title = title))

/**
 * Params for updating a meta tag
 * @since 8.19.0
 */
export type MetaParams = {
  readonly name: string
  readonly content: string
  readonly httpEquiv?: string
}

/**
 * Update a meta tag
 * @since 8.19.0
 * @category metadata
 */
export const updateMeta: (params: MetaParams) => Effect.Effect<HTMLMetaElement, never, Document> = (
  params: MetaParams
) =>
  Document.with((d) => {
    const meta = d.querySelector<HTMLMetaElement>(`meta[name="${params.name}"]`) ??
      createNewHeadElement(d, "meta")

    setAttrs(meta, params)

    return meta
  })

/**
 * Update a link tag
 * @since 8.19.0
 * @category metadata
 */
export type LinkParams = {
  readonly rel: string
  readonly href: string

  readonly crossOrigin?: "anonymous" | "use-credentials"
  readonly hreflang?: string
  readonly media?: string
  readonly referrerPolicy?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url"
  readonly sizes?: string
  readonly type?: string
}

/**
 * Update a link tag
 * @since 8.19.0
 * @category metadata
 */
export const updateLink: (params: LinkParams) => Effect.Effect<HTMLLinkElement, never, Document> = (
  params: LinkParams
) =>
  Document.with((d) => {
    const link = d.querySelector<HTMLLinkElement>(`link[rel="${params.rel}"][href="${params.href}"]`) ??
      createNewHeadElement(d, "link")

    setAttrs(link, params)

    return link
  })

function createNewHeadElement<T extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: T
) {
  const newLink = document.createElement(tagName)
  document.head.appendChild(newLink)
  return newLink
}

function setAttrs(element: Element, attrs: Record<string, string>) {
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value))
}
