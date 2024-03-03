---
title: index.ts
nav_order: 1
parent: "@typed/wire"
---

## index overview

Wire is a data type that serves as a DocumentFragment that can be
utilized to create a persistent DOM structure.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Rendered (type alias)](#rendered-type-alias)
  - [Rendered (namespace)](#rendered-namespace)
    - [Elements (type alias)](#elements-type-alias)
    - [Value (type alias)](#value-type-alias)
    - [Values (type alias)](#values-type-alias)
  - [Wire (interface)](#wire-interface)
  - [diffable](#diffable)
  - [isArray](#isarray)
  - [isAttr](#isattr)
  - [isComment](#iscomment)
  - [isDocumentFragment](#isdocumentfragment)
  - [isElement](#iselement)
  - [isHtmlElement](#ishtmlelement)
  - [isNode](#isnode)
  - [isSvgElement](#issvgelement)
  - [isText](#istext)
  - [isWire](#iswire)
  - [persistent](#persistent)

---

# utils

## Rendered (type alias)

When supporting a Wire for persisten document fragment behavior,
these are the kinds of values which can be rendered.

**Signature**

```ts
export type Rendered = Rendered.Value | ReadonlyArray<Rendered>
```

Added in v1.0.0

## Rendered (namespace)

Added in v1.0.0

### Elements (type alias)

Extract the elements from a Rendered type

**Signature**

```ts
export type Elements<T extends Rendered> = ReadonlyArray<
  [Node] extends [Exclude<T, DocumentFragment | Wire | ReadonlyArray<Rendered>>]
    ? HTMLElement | SVGElement
    : Exclude<T, DocumentFragment | Wire | ReadonlyArray<Rendered>>
>
```

Added in v1.0.0

### Value (type alias)

When supporting a Wire for persisten document fragment behavior,
these are the kinds of values which can be rendered.

**Signature**

```ts
export type Value = Node | DocumentFragment | Wire
```

Added in v1.0.0

### Values (type alias)

Extract the values from a Rendered type

**Signature**

```ts
export type Values<T extends Rendered> = [T] extends [ReadonlyArray<infer R>]
  ? ReadonlyArray<R | Exclude<T, ReadonlyArray<any>>>
  : ReadonlyArray<T>
```

Added in v1.0.0

## Wire (interface)

Wire is a data type that serves as a DocumentFragment that can be
utilized to create a persistent DOM structure.

**Signature**

```ts
export interface Wire {
  readonly ELEMENT_NODE: 1
  readonly DOCUMENT_FRAGMENT_NODE: 11
  readonly nodeType: 111
  readonly firstChild: Node | null
  readonly lastChild: Node | null
  readonly valueOf: () => DocumentFragment
}
```

Added in v1.0.0

## diffable

Create a diffable node from any Node which also might be a Wire.

**Signature**

```ts
export declare const diffable: (document: Document) => (node: Node, operation: number) => Node
```

Added in v1.0.0

## isArray

Check if is an Array of nodes

**Signature**

```ts
export declare function isArray(node: Rendered): node is ReadonlyArray<Rendered>
```

Added in v1.0.0

## isAttr

Check if a node is an Attr

**Signature**

```ts
export declare function isAttr(node: Rendered): node is Attr
```

Added in v1.0.0

## isComment

Check if a node is a Comment

**Signature**

```ts
export declare function isComment(node: Rendered): node is Comment
```

Added in v1.0.0

## isDocumentFragment

Check if a node is a DocumentFragment

**Signature**

```ts
export declare function isDocumentFragment(node: Rendered): node is DocumentFragment
```

Added in v1.0.0

## isElement

Check if a node is an Element

**Signature**

```ts
export declare function isElement(node: Rendered): node is Element
```

Added in v1.0.0

## isHtmlElement

Check if a node is a HTMLEelement

**Signature**

```ts
export declare function isHtmlElement(node: Rendered): node is HTMLElement
```

Added in v1.0.0

## isNode

Check if a node is a Node

**Signature**

```ts
export declare function isNode(node: Rendered): node is Node
```

Added in v1.0.0

## isSvgElement

Check if a node is an SvgElement

**Signature**

```ts
export declare function isSvgElement(node: Rendered): node is SVGElement
```

Added in v1.0.0

## isText

Check if a node is a Text

**Signature**

```ts
export declare function isText(node: Rendered): node is Text
```

Added in v1.0.0

## isWire

Check if a node is a Wire

**Signature**

```ts
export declare function isWire(node: Rendered): node is Wire
```

Added in v1.0.0

## persistent

Create a Wire from a DocumentFragment only if it has more than one child.
otherwise return the first child.

**Signature**

```ts
export declare const persistent: (fragment: DocumentFragment) => DocumentFragment | Node | Wire
```

Added in v1.0.0
