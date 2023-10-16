---
title: HtmlChunk.ts
nav_order: 7
parent: "@typed/template"
---

## HtmlChunk overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AttrValue (type alias)](#attrvalue-type-alias)
  - [HtmlChunk (type alias)](#htmlchunk-type-alias)
  - [PartChunk (class)](#partchunk-class)
    - [\_tag (property)](#_tag-property)
  - [SparsePartChunk (class)](#sparsepartchunk-class)
    - [\_tag (property)](#_tag-property-1)
  - [TextChunk (class)](#textchunk-class)
    - [\_tag (property)](#_tag-property-2)
  - [templateToHtmlChunks](#templatetohtmlchunks)

---

# utils

## AttrValue (type alias)

**Signature**

```ts
export type AttrValue = string | null | undefined | ReadonlyArray<AttrValue>
```

## HtmlChunk (type alias)

**Signature**

```ts
export type HtmlChunk = TextChunk | PartChunk | SparsePartChunk
```

## PartChunk (class)

**Signature**

```ts
export declare class PartChunk {
  constructor(readonly node: PartNode, readonly render: (value: unknown) => string)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "part"
```

## SparsePartChunk (class)

**Signature**

```ts
export declare class SparsePartChunk {
  constructor(readonly node: SparseAttrNode | SparseClassNameNode, readonly render: (value: AttrValue) => string)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "sparse-part"
```

## TextChunk (class)

**Signature**

```ts
export declare class TextChunk {
  constructor(readonly value: string)
}
```

### \_tag (property)

**Signature**

```ts
readonly _tag: "text"
```

## templateToHtmlChunks

**Signature**

```ts
export declare function templateToHtmlChunks({ hash, nodes }: Template)
```
