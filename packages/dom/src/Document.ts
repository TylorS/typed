import * as Effect from '@effect/io/Effect'
import * as T from '@fp-ts/data/Context'
import * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'

export interface Document extends globalThis.Document {}

export namespace Document {
  export const Tag: T.Tag<Document> = T.Tag<Document>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
  export const provideFx = (service: Document) => Fx.provideService(Tag, service)
}

export const getDocument: Effect.Effect<Document, never, Document> = Effect.service(Document.Tag)

export const getBody: Effect.Effect<Document, never, HTMLBodyElement> = Document.access(
  (d) => d.body as HTMLBodyElement,
)

export const getHead: Effect.Effect<Document, never, HTMLHeadElement> = Document.access(
  (d) => d.head,
)

export const addDocumentListener = <EventName extends keyof DocumentEventMap>(
  event: EventName,
  options?: AddEventListenerOptions,
) => Document.accessFx(addEventListener(event, options))

export const createElement = <TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName,
): Effect.Effect<Document, never, HTMLElementTagNameMap[TagName]> =>
  Document.access((d) => d.createElement(tagName))

export const createElementNS = (
  namespaceURI: string,
  tagName: string,
): Effect.Effect<Document, never, Element> =>
  Document.access((d) => d.createElementNS(namespaceURI, tagName))

export const createSvgElement = <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName,
): Effect.Effect<Document, never, SVGElementTagNameMap[TagName]> =>
  createElementNS('http://www.w3.org/2000/svg', tagName) as Effect.Effect<
    Document,
    never,
    SVGElementTagNameMap[TagName]
  >

export const createTextNode = (data: string): Effect.Effect<Document, never, Text> =>
  Document.access((d) => d.createTextNode(data))

export const createComment = (data: string): Effect.Effect<Document, never, Comment> =>
  Document.access((d) => d.createComment(data))

export const createDocumentFragment: Effect.Effect<Document, never, DocumentFragment> =
  Document.access((d) => d.createDocumentFragment())

export const createTreeWalker = (root: Node, whatToShow?: number, filter?: NodeFilter | null) =>
  Document.access((d) => d.createTreeWalker(root, whatToShow, filter))

export const createRange: Effect.Effect<Document, never, Range> = Document.access((d) =>
  d.createRange(),
)

export const createAttributeNS = (
  namespace: string | null,
  qualifiedName: string,
): Effect.Effect<Document, never, Attr> =>
  Document.access((d) => d.createAttributeNS(namespace, qualifiedName))

export const getDocumentElement = Document.access((d) => d.documentElement)

export const importNode = <T extends Node>(node: T, deep?: boolean) =>
  Document.access((d) => d.importNode(node, deep))

export const updateTitle = (title: string) =>
  Document.accessEffect((d) => Effect.sync(() => (d.title = title)))

export type MetaParams = {
  readonly name: string
  readonly content: string
  readonly httpEquiv?: string
}

export const updateMeta = (params: MetaParams) =>
  Document.accessEffect((d) =>
    Effect.sync(() => {
      const meta =
        d.querySelector<HTMLMetaElement>(`meta[name="${params.name}"]`) ??
        createNewHeadElement(d, 'meta')

      setAttrs(meta, params)

      return meta
    }),
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
  Document.accessEffect((d) =>
    Effect.sync(() => {
      const link =
        d.querySelector<HTMLLinkElement>(`link[rel="${params.rel}"][href="${params.href}"]`) ??
        createNewHeadElement(d, 'link')

      setAttrs(link, params)

      return link
    }),
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
