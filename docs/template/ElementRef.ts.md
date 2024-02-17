---
title: ElementRef.ts
nav_order: 2
parent: "@typed/template"
---

## ElementRef overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ElementRef (interface)](#elementref-interface)
  - [ElementRefTypeId](#elementreftypeid)
  - [ElementRefTypeId (type alias)](#elementreftypeid-type-alias)
  - [dispatchEvent](#dispatchevent)
  - [isElementRef](#iselementref)
  - [make](#make)
  - [of](#of)
  - [set](#set)

---

# utils

## ElementRef (interface)

A reference to a rendered element.

**Signature**

```ts
export interface ElementRef<T extends Rendered = Rendered>
  extends Versioned<never, never, Scope.Scope, never, T, never, NoSuchElementException, T> {
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, never, Option.Option<T>>

  readonly query: ElementSource<T>["query"]
  readonly events: ElementSource<T>["events"]
  readonly elements: ElementSource<T>["elements"]
  readonly dispatchEvent: ElementSource<T>["dispatchEvent"]
}
```

Added in v1.0.0

## ElementRefTypeId

**Signature**

```ts
export declare const ElementRefTypeId: typeof ElementRefTypeId
```

## ElementRefTypeId (type alias)

**Signature**

```ts
export type ElementRefTypeId = typeof ElementRefTypeId
```

## dispatchEvent

**Signature**

```ts
export declare function dispatchEvent<T extends Rendered>(ref: ElementRef<T>, event: Event)
```

Added in v1.0.0

## isElementRef

**Signature**

```ts
export declare function isElementRef(value: unknown): value is ElementRef
```

## make

**Signature**

```ts
export declare function make<T extends Rendered = Rendered>(): Effect.Effect<ElementRef<T>, never, Scope.Scope>
```

Added in v1.0.0

## of

**Signature**

```ts
export declare function of<T extends Rendered>(rendered: T): Effect.Effect<ElementRef<T>, never, Scope.Scope>
```

Added in v1.0.0

## set

**Signature**

```ts
export declare const set: {
  <A extends Rendered>(value: A): (elementRef: ElementRef<A>) => Effect.Effect<A, never, never>
  <A extends Rendered>(elementRef: ElementRef<A>, value: A): Effect.Effect<A, never, never>
}
```

Added in v1.0.0
