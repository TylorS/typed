import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as T from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'

export namespace Document {
  export const Tag: T.Tag<Document> = T.Tag<Document>()
  export const provide = (doc: Document) => Effect.provideService(Tag, doc)
}

export const getDocument: Effect.Effect<Document, never, Document> = Effect.service(Document.Tag)

export const getBody: Effect.Effect<Document, never, HTMLBodyElement> = pipe(
  getDocument,
  Effect.map((d) => d.body as HTMLBodyElement),
)

export const getHead: Effect.Effect<Document, never, HTMLHeadElement> = pipe(
  getDocument,
  Effect.map((d) => d.head),
)

export const addDocumentListener = <EventName extends keyof DocumentEventMap>(
  event: EventName,
  options?: AddEventListenerOptions,
) => pipe(getDocument, Fx.fromEffect, Fx.flatMap(addEventListener(event, options)))

export const createElement = <TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName,
): Effect.Effect<Document, never, HTMLElementTagNameMap[TagName]> =>
  Effect.serviceWith(Document.Tag, (d) => d.createElement(tagName))

export const createElementNS = (
  namespaceURI: string,
  tagName: string,
): Effect.Effect<Document, never, Element> =>
  Effect.serviceWith(Document.Tag, (d) => d.createElementNS(namespaceURI, tagName))

export const createSvgElement = <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName,
): Effect.Effect<Document, never, SVGElementTagNameMap[TagName]> =>
  createElementNS('http://www.w3.org/2000/svg', tagName) as Effect.Effect<
    Document,
    never,
    SVGElementTagNameMap[TagName]
  >

export const createTextNode = (data: string): Effect.Effect<Document, never, Text> =>
  Effect.serviceWith(Document.Tag, (d) => d.createTextNode(data))

export const createComment = (data: string): Effect.Effect<Document, never, Comment> =>
  Effect.serviceWith(Document.Tag, (d) => d.createComment(data))

export const createDocumentFragment: Effect.Effect<Document, never, DocumentFragment> =
  Effect.serviceWith(Document.Tag, (d) => d.createDocumentFragment())

export const createTreeWalker = (root: Node, whatToShow?: number, filter?: NodeFilter | null) =>
  Effect.serviceWith(Document.Tag, (d) => d.createTreeWalker(root, whatToShow, filter))

export const createRange: Effect.Effect<Document, never, Range> = Effect.serviceWith(
  Document.Tag,
  (d) => d.createRange(),
)

export const createAttributeNS = (
  namespace: string | null,
  qualifiedName: string,
): Effect.Effect<Document, never, Attr> =>
  Effect.serviceWith(Document.Tag, (d) => d.createAttributeNS(namespace, qualifiedName))

export const getDocumentElement = Effect.serviceWith(Document.Tag, (d) => d.documentElement)

export const importNode = <T extends Node>(node: T, deep?: boolean) =>
  Effect.serviceWith(Document.Tag, (d) => d.importNode(node, deep))

export const updateTitle = (title: string) =>
  pipe(
    getDocument,
    Effect.tap((d) => Effect.sync(() => (d.title = title))),
    Effect.asUnit,
  )

export type MetaParams = {
  readonly name: string
  readonly content: string
  readonly httpEquiv?: string
}

export const updateMeta = (params: MetaParams) =>
  pipe(
    getDocument,
    Effect.flatMap((d) =>
      Effect.sync(() => {
        const meta =
          d.querySelector<HTMLMetaElement>(`meta[name="${params.name}"]`) ??
          createNewHeadElement(d, 'meta')

        setAttrs(meta, params)

        return meta
      }),
    ),
  )

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
  pipe(
    getDocument,
    Effect.flatMap((d) =>
      Effect.sync(() => {
        const link =
          d.querySelector<HTMLLinkElement>(`link[rel="${params.rel}"][href="${params.href}"]`) ??
          createNewHeadElement(d, 'link')

        setAttrs(link, params)

        return link
      }),
    ),
  )

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
