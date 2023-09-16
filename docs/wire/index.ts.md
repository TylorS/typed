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
  - [Wire (interface)](#wire-interface)
  - [diffable](#diffable)
  - [isWire](#iswire)
  - [persistent](#persistent)

---

# utils

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
