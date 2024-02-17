---
title: Subject.ts
nav_order: 19
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
export interface Subject<out R, in out E, in out A> extends Push<R, E, A, R | Scope.Scope, E, A>, Pipeable.Pipeable {
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
export interface Tagged<I, E, A> extends Subject<I, E, A> {
  readonly tag: C.Tagged<I, Subject<never, E, A>>

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
    ) => [T] extends [Fx<infer R2, infer E2, infer B>]
      ? Fx<Exclude<R2, I>, E2, B>
      : [T] extends [Effect.Effect<infer B, infer E2, infer R2>]
        ? Effect.Effect<B, E2, Exclude<R2, I>>
        : never
  : Args extends readonly [Fx<infer R2, infer E2, infer B>]
    ? Fx<Exclude<R2, I>, E2, B>
    : Args extends readonly [Effect.Effect<infer B, infer E2, infer R2>]
      ? Effect.Effect<B, E2, Exclude<R2, I>>
      : never
```

Added in v1.20.0

## fromTag

**Signature**

```ts
export declare function fromTag<I, S, R, E, A>(tag: C.Tag<I, S>, f: (s: S) => Subject<R, E, A>): Subject<I | R, E, A>
```

Added in v1.20.0

## make

**Signature**

```ts
export declare function make<E, A>(replay?: number): Effect.Effect<Subject<never, E, A>, never, Scope.Scope>
```

Added in v1.20.0

## tagged

**Signature**

```ts
export declare function tagged<E, A>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
}
```

Added in v1.20.0

## unsafeMake

**Signature**

```ts
export declare function unsafeMake<E, A>(replay: number = 0): Subject<never, E, A>
```

Added in v1.20.0
