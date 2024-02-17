---
title: Push.ts
nav_order: 11
parent: "@typed/fx"
---

## Push overview

Push is a type of Fx that can be used to push values to a sink.

Added in v1.20.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Push (interface)](#push-interface)
  - [Push (namespace)](#push-namespace)
    - [Any (interface)](#any-interface)
  - [exhaustMap](#exhaustmap)
  - [exhaustMapEffect](#exhaustmapeffect)
  - [exhaustMapLatest](#exhaustmaplatest)
  - [exhaustMapLatestEffect](#exhaustmaplatesteffect)
  - [filter](#filter)
  - [filterEffect](#filtereffect)
  - [filterInput](#filterinput)
  - [filterInputEffect](#filterinputeffect)
  - [filterMap](#filtermap)
  - [filterMapEffect](#filtermapeffect)
  - [filterMapInput](#filtermapinput)
  - [filterMapInputEffect](#filtermapinputeffect)
  - [flatMap](#flatmap)
  - [flatMapEffect](#flatmapeffect)
  - [make](#make)
  - [map](#map)
  - [mapEffect](#mapeffect)
  - [mapInput](#mapinput)
  - [mapInputEffect](#mapinputeffect)
  - [switchMap](#switchmap)
  - [switchMapEffect](#switchmapeffect)

---

# utils

## Push (interface)

Push is an abstract type which represents a Type which is both an Fx and a Sink. The type parameters
are decoupled from one another and allow mapping over the input and output of the Push separately for
more complex use cases.

**Signature**

```ts
export interface Push<out R, in E, in A, out R2, out E2, out B>
  extends Sink.Sink<R, E, A>,
    Fx<R2, E2, B>,
    Pipeable.Pipeable {}
```

Added in v1.20.0

## Push (namespace)

Added in v1.20.0

### Any (interface)

**Signature**

```ts
export interface Any extends Push<any, any, any, any, any, any> {}
```

Added in v1.20.0

## exhaustMap

**Signature**

```ts
export declare const exhaustMap: {
  <B, R3, E3, C>(
    f: (b: B) => Fx<R3, E3, C>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## exhaustMapEffect

**Signature**

```ts
export declare const exhaustMapEffect: {
  <B, R3, E3, C>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## exhaustMapLatest

**Signature**

```ts
export declare const exhaustMapLatest: {
  <B, R3, E3, C>(
    f: (b: B) => Fx<R3, E3, C>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## exhaustMapLatestEffect

**Signature**

```ts
export declare const exhaustMapLatestEffect: {
  <B, R3, E3, C>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## filter

**Signature**

```ts
export declare const filter: {
  <B>(f: (b: B) => boolean): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R2, E2, B>
  <R, E, A, R2, E2, B>(push: Push<R, E, A, R2, E2, B>, f: (b: B) => boolean): Push<R, E, A, R2, E2, B>
}
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <B, R3, E3>(
    f: (b: B) => Effect.Effect<boolean, E3, R3>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R3 | R2, E3 | E2, B>
  <R, E, A, R2, E2, B, R3, E3>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<boolean, E3, R3>
  ): Push<R, E, A, R2 | R3, E2 | E3, B>
}
```

Added in v1.20.0

## filterInput

**Signature**

```ts
export declare const filterInput: {
  <A>(
    f: (a: A) => boolean
  ): <P extends Push.Any>(
    push: P
  ) => Push<Sink.Sink.Context<P>, Sink.Sink.Error<P>, A, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
  <R, E, A, R2, E2, B>(push: Push<R, E, A, R2, E2, B>, f: (a: A) => boolean): Push<R, E, A, R2, E2, B>
}
```

Added in v1.20.0

## filterInputEffect

**Signature**

```ts
export declare const filterInputEffect: {
  <A, R3, E>(
    f: (a: A) => Effect.Effect<boolean, E, R3>
  ): <R, R2, E2, B>(push: Push<R, E, A, R2, E2, B>) => Push<R3 | R, E, A, R2, E2, B>
  <R, E, A, R2, E2, B, R3>(
    push: Push<R, E, A, R2, E2, B>,
    f: (a: A) => Effect.Effect<boolean, E, R3>
  ): Push<R | R3, E, A, R2, E2, B>
}
```

Added in v1.20.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <B, C>(f: (b: B) => Option.Option<C>): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R2, E2, C>
  <R, E, A, R2, E2, B, C>(push: Push<R, E, A, R2, E2, B>, f: (b: B) => Option.Option<C>): Push<R, E, A, R2, E2, C>
}
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <B, R3, E3, C>(
    f: (b: B) => Effect.Effect<Option.Option<C>, E3, R3>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<Option.Option<C>, E3, R3>
  ): Push<R, E, A, R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## filterMapInput

**Signature**

```ts
export declare const filterMapInput: {
  <C, A>(
    f: (c: C) => Option.Option<A>
  ): <P extends Push.Any>(
    push: P
  ) => Push<Sink.Sink.Context<P>, Sink.Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
  <R, E, A, R2, E2, B, C>(push: Push<R, E, A, R2, E2, B>, f: (c: C) => Option.Option<A>): Push<R, E, C, R2, E2, B>
}
```

Added in v1.20.0

## filterMapInputEffect

**Signature**

```ts
export declare const filterMapInputEffect: {
  <C, R3, E, A>(
    f: (c: C) => Effect.Effect<Option.Option<A>, E, R3>
  ): <R, R2, E2, B>(push: Push<R, E, A, R2, E2, B>) => Push<R3 | R, E, C, R2, E2, B>
  <R, E, A, R2, E2, B, R3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (c: C) => Effect.Effect<Option.Option<A>, E, R3>
  ): Push<R | R3, E, C, R2, E2, B>
}
```

Added in v1.20.0

## flatMap

**Signature**

```ts
export declare const flatMap: {
  <B, R3, E3, C>(
    f: (b: B) => Fx<R3, E3, C>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## flatMapEffect

**Signature**

```ts
export declare const flatMapEffect: {
  <B, R3, E3, C>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## make

**Signature**

```ts
export declare const make: {
  <R2, E2, B>(fx: Fx<R2, E2, B>): <R, E, A>(sink: Sink.Sink<R, E, A>) => Push<R, E, A, R2, E2, B>
  <R, E, A, R2, E2, B>(sink: Sink.Sink<R, E, A>, fx: Fx<R2, E2, B>): Push<R, E, A, R2, E2, B>
}
```

Added in v1.20.0

## map

**Signature**

```ts
export declare const map: {
  <B, C>(f: (b: B) => C): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R2, E2, C>
  <R, E, A, R2, E2, B, C>(push: Push<R, E, A, R2, E2, B>, f: (b: B) => C): Push<R, E, A, R2, E2, C>
}
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <B, R3, E3, C>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<R, E, A, R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## mapInput

**Signature**

```ts
export declare const mapInput: {
  <P extends Push.Any, C>(
    f: (c: C) => Sink.Sink.Success<P>
  ): (push: P) => Push<Sink.Sink.Context<P>, Sink.Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
  <P extends Push.Any, C>(
    push: P,
    f: (c: C) => Sink.Sink.Success<P>
  ): Push<Sink.Sink.Context<P>, Sink.Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
}
```

Added in v1.20.0

## mapInputEffect

**Signature**

```ts
export declare const mapInputEffect: {
  <C, R3, E, A>(
    f: (c: C) => Effect.Effect<A, E, R3>
  ): <R, R2, E2, B>(push: Push<R, E, A, R2, E2, B>) => Push<R3 | R, E, C, R2, E2, B>
  <R, E, A, R2, E2, B, R3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (c: C) => Effect.Effect<A, E, R3>
  ): Push<R | R3, E, C, R2, E2, B>
}
```

Added in v1.20.0

## switchMap

**Signature**

```ts
export declare const switchMap: {
  <B, R3, E3, C>(
    f: (b: B) => Fx<R3, E3, C>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Fx<R3, E3, C>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0

## switchMapEffect

**Signature**

```ts
export declare const switchMapEffect: {
  <B, R3, E3, C>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <R, E, A, R2, E2>(push: Push<R, E, A, R2, E2, B>) => Push<R, E, A, Scope.Scope | R3 | R2, E3 | E2, C>
  <R, E, A, R2, E2, B, R3, E3, C>(
    push: Push<R, E, A, R2, E2, B>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<R, E, A, Scope.Scope | R2 | R3, E2 | E3, C>
}
```

Added in v1.20.0
