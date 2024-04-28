---
title: HtmlChunk.ts
nav_order: 7
parent: "@typed/template"
---

## HtmlChunk overview

Added in v1.0.0

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
  - [escape](#escape)
  - [escapeHtml](#escapehtml)
  - [templateToHtmlChunks](#templatetohtmlchunks)
  - [unescape](#unescape)
  - [unescapeHtml](#unescapehtml)

---

# utils

## AttrValue (type alias)

**Signature**

```ts
export type AttrValue = string | null | undefined | ReadonlyArray<AttrValue>
```

Added in v1.0.0

## HtmlChunk (type alias)

**Signature**

```ts
export type HtmlChunk = TextChunk | PartChunk | SparsePartChunk
```

Added in v1.0.0

## PartChunk (class)

**Signature**

```ts
export declare class PartChunk { constructor(
    readonly node: PartNode,
    readonly render: (value: unknown) => string
  ) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "part"
```

## SparsePartChunk (class)

**Signature**

```ts
export declare class SparsePartChunk { constructor(
    readonly node: SparseAttrNode | SparseClassNameNode,
    readonly render: (value: AttrValue) => string
  ) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "sparse-part"
```

## TextChunk (class)

**Signature**

```ts
export declare class TextChunk { constructor(readonly value: string) }
```

Added in v1.0.0

### \_tag (property)

**Signature**

```ts
readonly _tag: "text"
```

## escape

**Signature**

```ts
export declare function escape(s: unknown): string
```

Added in v1.0.0

## escapeHtml

**Signature**

```ts
export declare function escapeHtml(str: string): string
```

Added in v1.0.0

## templateToHtmlChunks

**Signature**

```ts
export declare function templateToHtmlChunks({ hash, nodes }: Template, isStatic: boolean)
```

Added in v1.0.0

## unescape

**Signature**

```ts
export declare function unescape(s: string)
```

Added in v1.0.0

## unescapeHtml

**Signature**

```ts
export declare function unescapeHtml(html: string)
```

Added in v1.0.0
