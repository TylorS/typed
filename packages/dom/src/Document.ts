/**
 * Low-level Effect wrappers for Document APIS and usage from the Context.
 * @since 8.19.0
 */

import type * as Effect from "@effect/io/Effect"
import * as C from "@typed/context"

import type * as Scope from "@effect/io/Scope"
import type { AddEventListenerOptions } from "./EventTarget"
import { addEventListener } from "./EventTarget"

/**
 * @since 8.19.0
 * @category models
 */
export interface Document extends globalThis.Document {}

/**
 * @since 8.19.0
 * @category context
 */
export const Document: C.Tagged<Document> = C.Tagged<Document>("@typed/dom/Document")

/**
 * Retrieve the body element from the current Document
 * @since 8.19.0
 * @category elements
 */
export const getBody: Effect.Effect<Document, never, HTMLBodyElement> = Document.with(
  (d) => d.body as HTMLBodyElement
)

/**
 * Retrieve the head element from the current Document
 * @since 8.19.0
 * @category elements
 */
export const getHead: Effect.Effect<Document, never, HTMLHeadElement> = Document.with((d) => d.head)

/**
 * Add an event listener to the document
 * @since 8.19.0
 * @category events
 */
export const addDocumentListener = <EventName extends string, R = never>(
  options: AddEventListenerOptions<Document, EventName, R>
): Effect.Effect<R | Document | Scope.Scope, never, void> => Document.withEffect((d) => addEventListener(d, options))

/**
 * Create a new element
 * @since 8.19.0
 * @category elements
 */
export const createElement: <TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName
) => Effect.Effect<Document, never, HTMLElementTagNameMap[TagName]> = <
  TagName extends keyof HTMLElementTagNameMap
>(
  tagName: TagName
): Effect.Effect<Document, never, HTMLElementTagNameMap[TagName]> => Document.with((d) => d.createElement(tagName))

/**
 * Create a new element with a namespace
 * @since 8.19.0
 * @category elements
 */
export const createElementNS = (
  namespaceURI: string,
  tagName: string
): Effect.Effect<Document, never, Element> => Document.with((d) => d.createElementNS(namespaceURI, tagName))

/**
 * Create a new SVG element
 * @since 8.19.0
 * @category elements
 */
export const createSvgElement = <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName
): Effect.Effect<Document, never, SVGElementTagNameMap[TagName]> =>
  createElementNS("http://www.w3.org/2000/svg", tagName) as Effect.Effect<
    Document,
    never,
    SVGElementTagNameMap[TagName]
  >

/**
 * Create a new text node
 * @since 8.19.0
 * @category elements
 */
export const createTextNode = (data: string): Effect.Effect<Document, never, Text> =>
  Document.with((d) => d.createTextNode(data))

/**
 * Create a new comment node
 * @since 8.19.0
 * @category elements
 */
export const createComment = (data: string): Effect.Effect<Document, never, Comment> =>
  Document.with((d) => d.createComment(data))

/**
 * Create a new document fragment
 * @since 8.19.0
 * @category elements
 */
export const createDocumentFragment: Effect.Effect<Document, never, DocumentFragment> = Document.with((d) =>
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
export const createRange: Effect.Effect<Document, never, Range> = Document.with((d) => d.createRange())

/**
 * Create a new Attr
 * @since 8.19.0
 * @category atrributes
 */
export const createAttributeNS = (
  namespace: string | null,
  qualifiedName: string
): Effect.Effect<Document, never, Attr> => Document.with((d) => d.createAttributeNS(namespace, qualifiedName))

/**
 * Get the <html> element
 * @since 8.19.0
 */
export const getDocumentElement: Effect.Effect<Document, never, HTMLElement> = Document.with(
  (d) => d.documentElement
)

/**
 * Import a node into the current document
 * @since 8.19.0
 */
export const importNode: <T extends Node>(
  node: T,
  deep?: boolean
) => Effect.Effect<Document, never, T> = <T extends Node>(node: T, deep?: boolean) =>
  Document.with((d) => d.importNode(node, deep))

/**
 * Update the title of the document
 * @since 8.19.0
 */
export const updateTitle: (title: string) => Effect.Effect<Document, never, string> = (
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
export const updateMeta: (params: MetaParams) => Effect.Effect<Document, never, HTMLMetaElement> = (
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
export const updateLink: (params: LinkParams) => Effect.Effect<Document, never, HTMLLinkElement> = (
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
