---
title: Part.ts
nav_order: 11
parent: "@typed/template"
---

## Part overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AttributePart (interface)](#attributepart-interface)
  - [BooleanPart (interface)](#booleanpart-interface)
  - [ClassNamePart (interface)](#classnamepart-interface)
  - [CommentPart (interface)](#commentpart-interface)
  - [DataPart (interface)](#datapart-interface)
  - [EventPart (interface)](#eventpart-interface)
  - [NodePart (interface)](#nodepart-interface)
  - [Part (type alias)](#part-type-alias)
  - [Parts (type alias)](#parts-type-alias)
  - [PropertyPart (interface)](#propertypart-interface)
  - [RefPart (interface)](#refpart-interface)
  - [SparseAttributePart (interface)](#sparseattributepart-interface)
  - [SparseClassNamePart (interface)](#sparseclassnamepart-interface)
  - [SparseCommentPart (interface)](#sparsecommentpart-interface)
  - [SparsePart (type alias)](#sparsepart-type-alias)
  - [StaticText (interface)](#statictext-interface)
  - [TextPart (interface)](#textpart-interface)

---

# utils

## AttributePart (interface)

**Signature**

```ts
export interface AttributePart {
  readonly _tag: 'attribute'
  readonly name: string
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```

## BooleanPart (interface)

**Signature**

```ts
export interface BooleanPart {
  readonly _tag: 'boolean'
  readonly name: string
  readonly value: boolean | null | undefined
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```

## ClassNamePart (interface)

**Signature**

```ts
export interface ClassNamePart {
  readonly _tag: 'className'
  readonly value: ReadonlyArray<string> | null | undefined
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```

## CommentPart (interface)

**Signature**

```ts
export interface CommentPart {
  readonly _tag: 'comment'
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```

## DataPart (interface)

**Signature**

```ts
export interface DataPart {
  readonly _tag: 'data'
  readonly value: Readonly<Record<string, string | undefined>> | null | undefined
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```

## EventPart (interface)

**Signature**

```ts
export interface EventPart {
  readonly _tag: 'event'
  readonly name: string
  readonly value: EventHandler<unknown, never> | null | undefined
  readonly index: number
  readonly onCause: (cause: Cause<unknown>) => Effect<never, never, unknown>

  readonly update: <R>(value: EventHandler<R, never> | null | undefined) => Effect<R | Scope, never, void>
}
```

## NodePart (interface)

**Signature**

```ts
export interface NodePart {
  readonly _tag: 'node'
  readonly value: unknown
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```

## Part (type alias)

**Signature**

```ts
export type Part =
  | AttributePart
  | BooleanPart
  | ClassNamePart
  | CommentPart
  | DataPart
  | EventPart
  | NodePart
  | PropertyPart
  | RefPart
  | TextPart
```

## Parts (type alias)

**Signature**

```ts
export type Parts = ReadonlyArray<Part | SparsePart>
```

## PropertyPart (interface)

**Signature**

```ts
export interface PropertyPart {
  readonly _tag: 'property'
  readonly name: string
  readonly value: unknown
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```

## RefPart (interface)

**Signature**

```ts
export interface RefPart<E = any> {
  readonly _tag: 'ref'
  readonly value: ElementSource<Rendered, E>
  readonly index: number
}
```

## SparseAttributePart (interface)

**Signature**

```ts
export interface SparseAttributePart {
  readonly _tag: 'sparse/attribute'
  readonly name: string
  readonly parts: ReadonlyArray<AttributePart | StaticText>

  readonly update: (value: ReadonlyArray<string>) => Effect<Scope, never, void>
}
```

## SparseClassNamePart (interface)

**Signature**

```ts
export interface SparseClassNamePart {
  readonly _tag: 'sparse/className'
  readonly parts: ReadonlyArray<ClassNamePart | StaticText>

  readonly update: (value: ReadonlyArray<string>) => Effect<Scope, never, void>
}
```

## SparseCommentPart (interface)

**Signature**

```ts
export interface SparseCommentPart {
  readonly _tag: 'sparse/comment'
  readonly parts: ReadonlyArray<CommentPart | StaticText>

  readonly update: (value: ReadonlyArray<string>) => Effect<Scope, never, void>
}
```

## SparsePart (type alias)

**Signature**

```ts
export type SparsePart = SparseAttributePart | SparseClassNamePart | SparseCommentPart
```

## StaticText (interface)

**Signature**

```ts
export interface StaticText {
  readonly _tag: 'static/text'
  readonly value: string
}
```

## TextPart (interface)

**Signature**

```ts
export interface TextPart {
  readonly _tag: 'text'
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this['value']) => Effect<Scope, never, void>
}
```
