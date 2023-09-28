---
title: Document.ts
nav_order: 1
parent: "@typed/dom"
---

## Document overview

Low-level Effect wrappers for Document APIS and usage from the Context.

Added in v8.19.0

---

<h2 class="text-delta">Table of contents</h2>

- [atrributes](#atrributes)
  - [createAttributeNS](#createattributens)
- [context](#context)
  - [Document](#document)
- [elements](#elements)
  - [createComment](#createcomment)
  - [createDocumentFragment](#createdocumentfragment)
  - [createElement](#createelement)
  - [createElementNS](#createelementns)
  - [createSvgElement](#createsvgelement)
  - [createTextNode](#createtextnode)
  - [getBody](#getbody)
  - [getHead](#gethead)
- [events](#events)
  - [addDocumentListener](#adddocumentlistener)
- [metadata](#metadata)
  - [LinkParams (type alias)](#linkparams-type-alias)
  - [updateLink](#updatelink)
  - [updateMeta](#updatemeta)
- [models](#models)
  - [Document (interface)](#document-interface)
- [utils](#utils)
  - [MetaParams (type alias)](#metaparams-type-alias)
  - [createRange](#createrange)
  - [createTreeWalker](#createtreewalker)
  - [getDocumentElement](#getdocumentelement)
  - [importNode](#importnode)
  - [updateTitle](#updatetitle)

---

# atrributes

## createAttributeNS

Create a new Attr

**Signature**

```ts
export declare const createAttributeNS: (
  namespace: string | null,
  qualifiedName: string
) => Effect.Effect<Document, never, Attr>
```

Added in v8.19.0

# context

## Document

**Signature**

```ts
export declare const Document: Context.Tagged<Document, Document>
```

Added in v8.19.0

# elements

## createComment

Create a new comment node

**Signature**

```ts
export declare const createComment: (data: string) => Effect.Effect<Document, never, Comment>
```

Added in v8.19.0

## createDocumentFragment

Create a new document fragment

**Signature**

```ts
export declare const createDocumentFragment: Effect.Effect<Document, never, DocumentFragment>
```

Added in v8.19.0

## createElement

Create a new element

**Signature**

```ts
export declare const createElement: <TagName extends keyof HTMLElementTagNameMap>(
  tagName: TagName
) => Effect.Effect<Document, never, HTMLElementTagNameMap[TagName]>
```

Added in v8.19.0

## createElementNS

Create a new element with a namespace

**Signature**

```ts
export declare const createElementNS: (namespaceURI: string, tagName: string) => Effect.Effect<Document, never, Element>
```

Added in v8.19.0

## createSvgElement

Create a new SVG element

**Signature**

```ts
export declare const createSvgElement: <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName
) => Effect.Effect<Document, never, SVGElementTagNameMap[TagName]>
```

Added in v8.19.0

## createTextNode

Create a new text node

**Signature**

```ts
export declare const createTextNode: (data: string) => Effect.Effect<Document, never, Text>
```

Added in v8.19.0

## getBody

Retrieve the body element from the current Document

**Signature**

```ts
export declare const getBody: Effect.Effect<Document, never, HTMLBodyElement>
```

Added in v8.19.0

## getHead

Retrieve the head element from the current Document

**Signature**

```ts
export declare const getHead: Effect.Effect<Document, never, HTMLHeadElement>
```

Added in v8.19.0

# events

## addDocumentListener

Add an event listener to the document

**Signature**

```ts
export declare const addDocumentListener: <EventName extends string, R = never>(
  options: AddEventListenerOptions<Document, EventName, R>
) => Effect.Effect<Scope.Scope | Document | R, never, void>
```

Added in v8.19.0

# metadata

## LinkParams (type alias)

Update a link tag

**Signature**

```ts
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
```

Added in v8.19.0

## updateLink

Update a link tag

**Signature**

```ts
export declare const updateLink: (params: LinkParams) => Effect.Effect<Document, never, HTMLLinkElement>
```

Added in v8.19.0

## updateMeta

Update a meta tag

**Signature**

```ts
export declare const updateMeta: (params: MetaParams) => Effect.Effect<Document, never, HTMLMetaElement>
```

Added in v8.19.0

# models

## Document (interface)

**Signature**

```ts
export interface Document extends globalThis.Document {}
```

Added in v8.19.0

# utils

## MetaParams (type alias)

Params for updating a meta tag

**Signature**

```ts
export type MetaParams = {
  readonly name: string
  readonly content: string
  readonly httpEquiv?: string
}
```

Added in v8.19.0

## createRange

Create a new Range

**Signature**

```ts
export declare const createRange: Effect.Effect<Document, never, Range>
```

Added in v8.19.0

## createTreeWalker

Create a new TreeWalker

**Signature**

```ts
export declare const createTreeWalker: (
  root: Node,
  whatToShow?: number,
  filter?: NodeFilter | null
) => Effect.Effect<Document, never, TreeWalker>
```

Added in v8.19.0

## getDocumentElement

Get the <html> element

**Signature**

```ts
export declare const getDocumentElement: Effect.Effect<Document, never, HTMLElement>
```

Added in v8.19.0

## importNode

Import a node into the current document

**Signature**

```ts
export declare const importNode: <T extends Node>(node: T, deep?: boolean) => Effect.Effect<Document, never, T>
```

Added in v8.19.0

## updateTitle

Update the title of the document

**Signature**

```ts
export declare const updateTitle: (title: string) => Effect.Effect<Document, never, string>
```

Added in v8.19.0
