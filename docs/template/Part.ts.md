---
title: Part.ts
nav_order: 13
parent: "@typed/template"
---

## Part overview

Added in v1.0.0

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
  - [PropertiesPart (interface)](#propertiespart-interface)
  - [PropertyPart (interface)](#propertypart-interface)
  - [RefPart (interface)](#refpart-interface)
  - [TextPart (interface)](#textpart-interface)

---

# utils

## AttributePart (interface)

**Signature**

```ts
export interface AttributePart {
  readonly _tag: "attribute"
  readonly name: string
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

## BooleanPart (interface)

**Signature**

```ts
export interface BooleanPart {
  readonly _tag: "boolean"
  readonly name: string
  readonly value: boolean | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

## ClassNamePart (interface)

**Signature**

```ts
export interface ClassNamePart {
  readonly _tag: "className"
  readonly value: ReadonlyArray<string>
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

## CommentPart (interface)

**Signature**

```ts
export interface CommentPart {
  readonly _tag: "comment"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

## DataPart (interface)

**Signature**

```ts
export interface DataPart {
  readonly _tag: "data"
  readonly value: Readonly<Record<string, string | undefined>> | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

## EventPart (interface)

**Signature**

```ts
export interface EventPart {
  readonly _tag: "event"
  readonly name: string
  readonly source: ElementSource<any>
  readonly value: null
  readonly index: number
  readonly onCause: (cause: Cause<unknown>) => Effect<unknown>
  readonly addEventListener: (handler: EventHandler<Event>) => void
}
```

Added in v1.0.0

## NodePart (interface)

**Signature**

```ts
export interface NodePart {
  readonly _tag: "node"
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

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
  | PropertiesPart
  | RefPart
  | TextPart
```

Added in v1.0.0

## Parts (type alias)

**Signature**

```ts
export type Parts = ReadonlyArray<Part>
```

Added in v1.0.0

## PropertiesPart (interface)

**Signature**

```ts
export interface PropertiesPart {
  readonly _tag: "properties"
  readonly value: Record<string, any> | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

## PropertyPart (interface)

**Signature**

```ts
export interface PropertyPart {
  readonly _tag: "property"
  readonly name: string
  readonly value: unknown
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0

## RefPart (interface)

**Signature**

```ts
export interface RefPart<T extends HTMLElement | SVGElement = HTMLElement | SVGElement> {
  readonly _tag: "ref"
  readonly value: ElementSource<T>
  readonly index: number
}
```

Added in v1.0.0

## TextPart (interface)

**Signature**

```ts
export interface TextPart {
  readonly _tag: "text"
  readonly value: string | null | undefined
  readonly index: number

  readonly update: (value: this["value"], priority?: number) => Effect<void, never, Scope>
}
```

Added in v1.0.0
