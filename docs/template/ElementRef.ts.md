---
title: ElementRef.ts
nav_order: 2
parent: "@typed/template"
---

## ElementRef overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [ElementRef](#elementref)
  - [ElementRef (interface)](#elementref-interface)
  - [ElementRefTypeId](#elementreftypeid)
  - [ElementRefTypeId (type alias)](#elementreftypeid-type-alias)
  - [of](#of)
  - [set](#set)

---

# utils

## ElementRef

**Signature**

```ts
export declare function ElementRef<T extends Rendered = Rendered, E = never>(): Effect.Effect<
  never,
  never,
  ElementRef<T, E>
>
```

## ElementRef (interface)

A reference to a rendered element.

**Signature**

```ts
export interface ElementRef<T extends Rendered = Rendered, E = never>
  extends Versioned<never, never, E, T, never, E | NoSuchElementException, T> {
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, E, Option.Option<T>>

  readonly query: ElementSource<T, E>['query']
  readonly events: ElementSource<T, E>['events']
  readonly elements: ElementSource<T, E>['elements']
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

## of

**Signature**

```ts
export declare function of<T extends Rendered, E = never>(rendered: T): Effect.Effect<never, never, ElementRef<T, E>>
```

## set

**Signature**

```ts
export declare const set: {
  <A extends Rendered>(value: A): <E>(elementRef: ElementRef<A, E>) => Effect.Effect<never, never, A>
  <A extends Rendered, E>(elementRef: ElementRef<A, E>, value: A): Effect.Effect<never, never, A>
}
```
