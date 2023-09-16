---
title: Interface.ts
nav_order: 11
parent: "@typed/context"
---

## Interface overview

Helpers for adding useful methods to Tag services.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Actions (interface)](#actions-interface)
  - [Actions (namespace)](#actions-namespace)
  - [Provision (interface)](#provision-interface)
  - [Provision (namespace)](#provision-namespace)
  - [Tagged (interface)](#tagged-interface)
  - [tagged](#tagged)
  - [withActions](#withactions)
  - [withProvision](#withprovision)

---

# utils

## Actions (interface)

Create a Tagged service that can be utilized from the Effect Context.

**Signature**

```ts
export interface Actions<I, S> {
  /**
   * Apply a function to the service in the environment
   */
  readonly with: <A>(f: (s: S) => A) => Effect.Effect<I, never, A>
  /**
   * Perform an Effect with the service in the environment
   */
  readonly withEffect: <R, E, A>(f: (s: S) => Effect.Effect<R, E, A>) => Effect.Effect<R | I, E, A>
}
```

Added in v1.0.0

## Actions (namespace)

Added in v1.0.0

## Provision (interface)

**Signature**

```ts
export interface Provision<I, S> {
  /**
   * Create a ContextBuilder from the service
   */
  readonly build: (s: S) => ContextBuilder<I>
  readonly provide: (service: S) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, I>, E, A>
  readonly provideEffect: <R2, E2>(
    effect: Effect.Effect<R2, E2, S>
  ) => <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<R2 | Exclude<R, I>, E | E2, A>
  readonly layer: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.Layer<R, E, I>
  readonly scoped: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.Layer<Exclude<R, Scope>, E, I>
}
```

Added in v1.0.0

## Provision (namespace)

Added in v1.0.0

## Tagged (interface)

A Tagged service that can be utilized from the Effect Context.

**Signature**

```ts
export interface Tagged<I, S> extends Actions<I, S>, Provision<I, S> {}
```

Added in v1.0.0

## tagged

Create a Tagged service that can be utilized from the Effect Context.

**Signature**

```ts
export declare function tagged<I, S>(tag: Tag<I, S>): Tag<I, S> & Tagged<I, S>
```

Added in v1.0.0

## withActions

Create a Tagged service that can be utilized from the Effect Context.

**Signature**

```ts
export declare function withActions<T extends Tag<any, any>>(tag: T): T & Actions<Tag.Identifier<T>, Tag.Service<T>>
```

Added in v1.0.0

## withProvision

Add Provision to a Tag

**Signature**

```ts
export declare function withProvision<T extends Tag<any, any>>(tag: T): T & Provision<Tag.Identifier<T>, Tag.Service<T>>
```

Added in v1.0.0
