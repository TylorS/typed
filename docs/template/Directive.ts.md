---
title: Directive.ts
nav_order: 1
parent: "@typed/template"
---

## Directive overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Directive](#directive)
  - [Directive (interface)](#directive-interface)
  - [DirectiveTypeId](#directivetypeid)
  - [DirectiveTypeId (type alias)](#directivetypeid-type-alias)
  - [attribute](#attribute)
  - [boolean](#boolean)
  - [className](#classname)
  - [comment](#comment)
  - [data](#data)
  - [event](#event)
  - [isDirective](#isdirective)
  - [node](#node)
  - [property](#property)
  - [ref](#ref)
  - [text](#text)

---

# utils

## Directive

**Signature**

```ts
export declare function Directive<E, R>(directive: (part: Part.Part) => Effect.Effect<unknown, E, R>): Directive<E, R>
```

Added in v1.0.0

## Directive (interface)

**Signature**

```ts
export interface Directive<E, R> extends Placeholder<unknown, E, R> {
  readonly [DirectiveTypeId]: DirectiveTypeId

  (part: Part.Part): Effect.Effect<unknown, E, R>
}
```

Added in v1.0.0

## DirectiveTypeId

**Signature**

```ts
export declare const DirectiveTypeId: typeof DirectiveTypeId
```

Added in v1.0.0

## DirectiveTypeId (type alias)

**Signature**

```ts
export type DirectiveTypeId = typeof DirectiveTypeId
```

Added in v1.0.0

## attribute

**Signature**

```ts
export declare const attribute: <E, R>(
  directive: (part: Part.AttributePart) => Effect.Effect<unknown, E, R>
) => Directive<E, R>
```

Added in v1.0.0

## boolean

**Signature**

```ts
export declare const boolean: <E, R>(
  directive: (part: Part.BooleanPart) => Effect.Effect<unknown, E, R>
) => Directive<E, R>
```

Added in v1.0.0

## className

**Signature**

```ts
export declare const className: <E, R>(
  directive: (part: Part.ClassNamePart) => Effect.Effect<unknown, E, R>
) => Directive<E, R>
```

Added in v1.0.0

## comment

**Signature**

```ts
export declare const comment: <E, R>(
  directive: (part: Part.CommentPart) => Effect.Effect<unknown, E, R>
) => Directive<E, R>
```

Added in v1.0.0

## data

**Signature**

```ts
export declare const data: <E, R>(directive: (part: Part.DataPart) => Effect.Effect<unknown, E, R>) => Directive<E, R>
```

Added in v1.0.0

## event

**Signature**

```ts
export declare const event: <E, R>(directive: (part: Part.EventPart) => Effect.Effect<unknown, E, R>) => Directive<E, R>
```

Added in v1.0.0

## isDirective

**Signature**

```ts
export declare function isDirective<E, R>(renderable: unknown): renderable is Directive<E, R>
```

Added in v1.0.0

## node

**Signature**

```ts
export declare const node: <E, R>(directive: (part: Part.NodePart) => Effect.Effect<unknown, E, R>) => Directive<E, R>
```

Added in v1.0.0

## property

**Signature**

```ts
export declare const property: <E, R>(
  directive: (part: Part.PropertyPart) => Effect.Effect<unknown, E, R>
) => Directive<E, R>
```

Added in v1.0.0

## ref

**Signature**

```ts
export declare const ref: <E, R>(directive: (part: Part.RefPart) => Effect.Effect<unknown, E, R>) => Directive<E, R>
```

Added in v1.0.0

## text

**Signature**

```ts
export declare const text: <E, R>(directive: (part: Part.TextPart) => Effect.Effect<unknown, E, R>) => Directive<E, R>
```

Added in v1.0.0
