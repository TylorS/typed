import type * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'

import { addEventListener } from './EventTarget.js'

export interface Document extends globalThis.Document {}
export const Document = C.Tag<Document>('@typed/dom/Document')

export const getBody: Effect.Effect<Document, never, HTMLBodyElement> = Document.with(
  (d) => d.body as HTMLBodyElement,
)

export const getHead: Effect.Effect<Document, never, HTMLHeadElement> = Document.with((d) => d.head)

export const addDocumentListener = <EventName extends keyof DocumentEventMap>(
  event: EventName,
  options?: AddEventListenerOptions,
) => Document.withFx(addEventListener(event, options))

export const createElement = <TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName,
): Effect.Effect<Document, never, HTMLElementTagNameMap[TagName]> =>
  Document.with((d) => d.createElement(tagName))

export const createElementNS = (
  namespaceURI: string,
  tagName: string,
): Effect.Effect<Document, never, Element> =>
  Document.with((d) => d.createElementNS(namespaceURI, tagName))

export const createSvgElement = <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName,
): Effect.Effect<Document, never, SVGElementTagNameMap[TagName]> =>
  createElementNS('http://www.w3.org/2000/svg', tagName) as Effect.Effect<
    Document,
    never,
    SVGElementTagNameMap[TagName]
  >

export const createTextNode = (data: string): Effect.Effect<Document, never, Text> =>
  Document.with((d) => d.createTextNode(data))

export const createComment = (data: string): Effect.Effect<Document, never, Comment> =>
  Document.with((d) => d.createComment(data))

export const createDocumentFragment: Effect.Effect<Document, never, DocumentFragment> =
  Document.with((d) => d.createDocumentFragment())

export const createTreeWalker = (root: Node, whatToShow?: number, filter?: NodeFilter | null) =>
  Document.with((d) => d.createTreeWalker(root, whatToShow, filter))

export const createRange: Effect.Effect<Document, never, Range> = Document.with((d) =>
  d.createRange(),
)

export const createAttributeNS = (
  namespace: string | null,
  qualifiedName: string,
): Effect.Effect<Document, never, Attr> =>
  Document.with((d) => d.createAttributeNS(namespace, qualifiedName))

export const getDocumentElement = Document.with((d) => d.documentElement)

export const importNode = <T extends Node>(node: T, deep?: boolean) =>
  Document.with((d) => d.importNode(node, deep))

export const updateTitle = (title: string) =>
  Document.with((d) => (d.title = title))

export type MetaParams = {
  readonly name: string
  readonly content: string
  readonly httpEquiv?: string
}

export const updateMeta = (params: MetaParams) =>
  Document.with((d) => {
    const meta =
      d.querySelector<HTMLMetaElement>(`meta[name="${params.name}"]`) ??
      createNewHeadElement(d, 'meta')

    setAttrs(meta, params)

    return meta
  })

export type LinkParams = {
  readonly rel: string
  readonly href: string

  readonly crossOrigin?: 'anonymous' | 'use-credentials'
  readonly hreflang?: string
  readonly media?: string
  readonly referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url'
  readonly sizes?: string
  readonly type?: string
}

export const updateLink = (params: LinkParams) =>
  Document.with((d) => {
    const link =
      d.querySelector<HTMLLinkElement>(`link[rel="${params.rel}"][href="${params.href}"]`) ??
      createNewHeadElement(d, 'link')

    setAttrs(link, params)

    return link
  })

function createNewHeadElement<T extends keyof HTMLElementTagNameMap>(
  document: Document,
  tagName: T,
) {
  const newLink = document.createElement(tagName)
  document.head.appendChild(newLink)
  return newLink
}

function setAttrs(element: Element, attrs: Record<string, string>) {
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value))
}
