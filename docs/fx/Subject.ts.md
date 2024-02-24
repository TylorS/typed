---
title: Subject.ts
nav_order: 18
parent: "@typed/fx"
---

## Subject overview

Subject is an Fx type which can also be imperatively pushed into.

Added in v1.20.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Subject (interface)](#subject-interface)
  - [Subject (namespace)](#subject-namespace)
    - [Tagged (interface)](#tagged-interface)
    - [Provide (type alias)](#provide-type-alias)
  - [fromTag](#fromtag)
  - [make](#make)
  - [tagged](#tagged)
  - [unsafeMake](#unsafemake)

---

# utils

## Subject (interface)

Subject is an Fx type which can also be imperatively pushed into.

**Signature**

```ts
export interface Subject<in out A, in out E = never, out R = never>
  extends Push<A, E, R, A, E, R | Scope.Scope>,
    Pipeable.Pipeable {
  readonly subscriberCount: Effect.Effect<number, never, R>
  readonly interrupt: Effect.Effect<void, never, R>
}
```

Added in v1.20.0

## Subject (namespace)

Added in v1.20.0

### Tagged (interface)

**Signature**

```ts
export interface Tagged<A, E, I> extends Subject<A, E, I> {
  readonly tag: C.Tagged<I, Subject<A, E>>

  readonly make: (replay?: number) => Layer.Layer<I>
  readonly provide: Provide<I>
}
```

Added in v1.20.0

### Provide (type alias)

**Signature**

```ts
export type Provide<I> = <
  const Args extends readonly [Fx<any, any, any> | Effect.Effect<any, any, any>, number?] | readonly [number]
>(
  ...args: Args
) => Args extends readonly [infer _ extends number]
  ? <T extends Fx<any, any, any> | Effect.Effect<any, any, any>>(
      fxOrEffect: T
    ) => [T] extends [Fx<infer B, infer E2, infer R2>]
      ? Fx<B, E2, Exclude<R2, I>>
      : [T] extends [Effect.Effect<infer B, infer E2, infer R2>]
        ? Effect.Effect<B, E2, Exclude<R2, I>>
        : never
  : Args extends readonly [Fx<infer B, infer E2, infer R2>]
    ? Fx<B, E2, Exclude<R2, I>>
    : Args extends readonly [Effect.Effect<infer B, infer E2, infer R2>]
      ? Effect.Effect<B, E2, Exclude<R2, I>>
      : never
```

Added in v1.20.0

## fromTag

**Signature**

```ts
export declare function fromTag<I, S, A, E, R>(tag: C.Tag<I, S>, f: (s: S) => Subject<A, E, R>): Subject<A, E, I | R>
```

Added in v1.20.0

## make

**Signature**

```ts
export declare function make<A, E>(replay?: number): Effect.Effect<Subject<A, E>, never, Scope.Scope>
```

Added in v1.20.0

## tagged

**Signature**

```ts
export declare function tagged<A, E = never>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Subject.Tagged<A, E, C.IdentifierOf<I>>
  <const I>(identifier: I): Subject.Tagged<A, E, C.IdentifierOf<I>>
}
```

Added in v1.20.0

## unsafeMake

**Signature**

```ts
export declare function unsafeMake<A, E = never>(replay: number = 0): Subject<A, E>
```

Added in v1.20.0
