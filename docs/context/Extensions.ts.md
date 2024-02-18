---
title: Extensions.ts
nav_order: 7
parent: "@typed/context"
---

## Extensions overview

Helpers for adding useful methods to Tag services.

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [Actions](#actions)
  - [Actions (interface)](#actions-interface)
  - [fromTag](#fromtag)
  - [withActions](#withactions)
- [models](#models)
  - [Tagged (interface)](#tagged-interface)
- [utils](#utils)
  - [Provision](#provision)
  - [Provision (interface)](#provision-interface)
  - [Tagged](#tagged)
  - [withProvision](#withprovision)

---

# constructors

## Actions

**Signature**

```ts
export declare const Actions: { fromTag: <I, S>(tag: Tag<I, S>) => Actions<I, S> }
```

Added in v1.0.0

## Actions (interface)

Create a Tagged service that can be utilized from the Effect Context.

**Signature**

```ts
export interface Actions<I, S> {
  /**
   * Apply a function to the service in the environment
   */
  readonly with: <A>(f: (s: S) => A) => Effect.Effect<A, never, I>
  /**
   * Perform an Effect with the service in the environment
   */
  readonly withEffect: <A, E, R>(f: (s: S) => Effect.Effect<A, E, R>) => Effect.Effect<A, E, R | I>
}
```

Added in v1.0.0

## fromTag

Create a Tagged service that can be utilized from the Effect Context.

**Signature**

```ts
export declare function fromTag<I, S>(tag: Tag<I, S>): Tagged<I, S>
```

Added in v1.0.0

## withActions

Create a Tagged service that can be utilized from the Effect Context.

**Signature**

```ts
export declare function withActions<T extends Tag<any, any>>(tag: T): T & Actions<Tag.Identifier<T>, Tag.Service<T>>
```

Added in v1.0.0

# models

## Tagged (interface)

A Tagged service is a @effect/data/Context.Tag with additional methods for
utilizing and providing the service without needing additional imports from Effect, Layer, or Context
so you're not redefining the same methods over and over again.

**Signature**

```ts
export interface Tagged<I, S = I> extends Tag<I, S>, Actions<I, S>, Provision<I, S> {}
```

Added in v1.0.0

# utils

## Provision

**Signature**

```ts
export declare const Provision: { readonly fromTag: <I, S>(tag: Tag<I, S>) => Provision<I, S> }
```

Added in v1.0.0

## Provision (interface)

**Signature**

```ts
export interface Provision<I, S> {
  /**
   * Create a ContextBuilder from the service
   * @since 1.0.0
   */
  readonly build: (s: S) => ContextBuilder<I>

  /**
   * Provide a service to an Effect
   * @since 1.0.0
   */
  readonly provide: (service: S) => <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, I>>

  /**
   * Provide a service to an Effect using a service Effect
   * @since 1.0.0
   */
  readonly provideEffect: <E2, R2>(
    effect: Effect.Effect<S, E2, R2>
  ) => <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E | E2, R2 | Exclude<R, I>>

  /**
   * Create a Layer from the service
   * @since 1.0.0
   */
  readonly layer: <R = never, E = never>(
    effect: Effect.Effect<S, E, R> | Exclude<S, Effect.Effect<any, any, any>>
  ) => Layer.Layer<I, E, R>

  /**
   * Create a Layer from the service that is scoped.
   * @since 1.0.0
   */
  readonly scoped: <E, R>(effect: Effect.Effect<S, E, R>) => Layer.Layer<I, E, Exclude<R, Scope>>
}
```

Added in v1.0.0

## Tagged

Construct a Tagged implementation to be utilized from the Effect Context.

**Signature**

```ts
export declare function Tagged<const I extends IdentifierFactory<any>, S = I>(
  id: I | string
): Tagged<IdentifierOf<I>, S>
export declare function Tagged<const I, S = I>(id: I | string): Tagged<IdentifierOf<I>, S>
export declare function Tagged<const I, S>(id: I): Tagged<IdentifierOf<I>, S>
export declare function Tagged<S>(): {
  <const I extends IdentifierFactory<any>>(id: I): Tagged<IdentifierOf<I>, S>
  <const I>(id: I | string): Tagged<IdentifierOf<I>, S>
}
```

Added in v1.0.0

## withProvision

Add Provision to a Tag

**Signature**

```ts
export declare function withProvision<T extends Tag<any, any>>(tag: T): T & Provision<Tag.Identifier<T>, Tag.Service<T>>
```

Added in v1.0.0
