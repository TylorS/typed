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
export declare function Directive<R, E>(directive: (part: Part.Part) => Effect.Effect<R, E, unknown>): Directive<R, E>
```

Added in v1.0.0

## Directive (interface)

**Signature**

```ts
export interface Directive<R, E> extends Placeholder<R, E, unknown> {
  readonly [DirectiveTypeId]: DirectiveTypeId

  (part: Part.Part): Effect.Effect<R, E, unknown>
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
export declare const attribute: <R, E>(
  directive: (part: Part.AttributePart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

Added in v1.0.0

## boolean

**Signature**

```ts
export declare const boolean: <R, E>(
  directive: (part: Part.BooleanPart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

Added in v1.0.0

## className

**Signature**

```ts
export declare const className: <R, E>(
  directive: (part: Part.ClassNamePart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

Added in v1.0.0

## comment

**Signature**

```ts
export declare const comment: <R, E>(
  directive: (part: Part.CommentPart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

Added in v1.0.0

## data

**Signature**

```ts
export declare const data: <R, E>(directive: (part: Part.DataPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

Added in v1.0.0

## event

**Signature**

```ts
export declare const event: <R, E>(directive: (part: Part.EventPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

Added in v1.0.0

## isDirective

**Signature**

```ts
export declare function isDirective<R, E>(renderable: unknown): renderable is Directive<R, E>
```

Added in v1.0.0

## node

**Signature**

```ts
export declare const node: <R, E>(directive: (part: Part.NodePart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

Added in v1.0.0

## property

**Signature**

```ts
export declare const property: <R, E>(
  directive: (part: Part.PropertyPart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

Added in v1.0.0

## ref

**Signature**

```ts
export declare const ref: <R, E>(directive: (part: Part.RefPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

Added in v1.0.0

## text

**Signature**

```ts
export declare const text: <R, E>(directive: (part: Part.TextPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

Added in v1.0.0
