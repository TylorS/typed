---
title: Directive.ts
nav_order: 1
parent: "@typed/template"
---

## Directive overview

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

## Directive (interface)

**Signature**

```ts
export interface Directive<R, E> extends Placeholder<R, E, unknown> {
  readonly [DirectiveTypeId]: DirectiveTypeId

  (part: Part.Part): Effect.Effect<R, E, unknown>
}
```

## DirectiveTypeId

**Signature**

```ts
export declare const DirectiveTypeId: typeof DirectiveTypeId
```

## DirectiveTypeId (type alias)

**Signature**

```ts
export type DirectiveTypeId = typeof DirectiveTypeId
```

## attribute

**Signature**

```ts
export declare const attribute: <R, E>(
  directive: (part: Part.AttributePart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

## boolean

**Signature**

```ts
export declare const boolean: <R, E>(
  directive: (part: Part.BooleanPart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

## className

**Signature**

```ts
export declare const className: <R, E>(
  directive: (part: Part.ClassNamePart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

## comment

**Signature**

```ts
export declare const comment: <R, E>(
  directive: (part: Part.CommentPart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

## data

**Signature**

```ts
export declare const data: <R, E>(directive: (part: Part.DataPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

## event

**Signature**

```ts
export declare const event: <R, E>(directive: (part: Part.EventPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

## isDirective

**Signature**

```ts
export declare function isDirective<R, E>(
  renderable: Renderable<R, E> | Placeholder<R, E>
): renderable is Directive<R, E>
```

## node

**Signature**

```ts
export declare const node: <R, E>(directive: (part: Part.NodePart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

## property

**Signature**

```ts
export declare const property: <R, E>(
  directive: (part: Part.PropertyPart) => Effect.Effect<R, E, unknown>
) => Directive<R, E>
```

## ref

**Signature**

```ts
export declare const ref: <R, E>(directive: (part: Part.RefPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```

## text

**Signature**

```ts
export declare const text: <R, E>(directive: (part: Part.TextPart) => Effect.Effect<R, E, unknown>) => Directive<R, E>
```
