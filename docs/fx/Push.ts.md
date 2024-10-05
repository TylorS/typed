---
title: Push.ts
nav_order: 10
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
export interface Push<in A, in E, out R, out B, out E2, out R2>
  extends Sink.Sink<A, E, R>,
    Fx<B, E2, R2>,
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
  <B, C, E3, R3>(
    f: (b: B) => Fx<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx<C, E3, R3>
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
}
```

Added in v1.20.0

## exhaustMapEffect

**Signature**

```ts
export declare const exhaustMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<A, E, R, Scope.Scope | C, E2 | E3, R2 | R3>
}
```

Added in v1.20.0

## exhaustMapLatest

**Signature**

```ts
export declare const exhaustMapLatest: {
  <B, C, E3, R3>(
    f: (b: B) => Fx<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx<C, E3, R3>
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
}
```

Added in v1.20.0

## exhaustMapLatestEffect

**Signature**

```ts
export declare const exhaustMapLatestEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<A, E, R, Scope.Scope | C, E2 | E3, R2 | R3>
}
```

Added in v1.20.0

## filter

**Signature**

```ts
export declare const filter: {
  <B>(f: (b: B) => boolean): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, B, E2, R2>
  <A, E, R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => boolean): Push<A, E, R, B, E2, R2>
}
```

Added in v1.20.0

## filterEffect

**Signature**

```ts
export declare const filterEffect: {
  <B, R3, E3>(
    f: (b: B) => Effect.Effect<boolean, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, B, E2 | E3, R2 | R3>
  <A, E, R, B, E2, R2, R3, E3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<boolean, E3, R3>
  ): Push<A, E, R, B, E2 | E3, R2 | R3>
}
```

Added in v1.20.0

## filterInput

**Signature**

```ts
export declare const filterInput: {
  <A>(
    f: (a: A) => boolean
  ): <P extends Push.Any>(push: P) => Push<Sink.Context<P>, Sink.Error<P>, A, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
  <A, E, R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>, f: (a: A) => boolean): Push<A, E, R, B, E2, R2>
}
```

Added in v1.20.0

## filterInputEffect

**Signature**

```ts
export declare const filterInputEffect: {
  <A, R3, E>(
    f: (a: A) => Effect.Effect<boolean, E, R3>
  ): <R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R | R3, B, E2, R2>
  <A, E, R, B, E2, R2, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (a: A) => Effect.Effect<boolean, E, R3>
  ): Push<A, E, R | R3, B, E2, R2>
}
```

Added in v1.20.0

## filterMap

**Signature**

```ts
export declare const filterMap: {
  <B, C>(f: (b: B) => Option.Option<C>): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2, R2>
  <A, E, R, B, E2, R2, C>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Option.Option<C>): Push<A, E, R, C, E2, R2>
}
```

Added in v1.20.0

## filterMapEffect

**Signature**

```ts
export declare const filterMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<Option.Option<C>, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<Option.Option<C>, E3, R3>
  ): Push<A, E, R, C, E2 | E3, R2 | R3>
}
```

Added in v1.20.0

## filterMapInput

**Signature**

```ts
export declare const filterMapInput: {
  <C, A>(
    f: (c: C) => Option.Option<A>
  ): <P extends Push.Any>(push: P) => Push<C, Sink.Error<P>, Sink.Context<P>, Fx.Success<P>, Fx.Error<P>, Fx.Context<P>>
  <A, E, R, B, E2, R2, C>(push: Push<A, E, R, B, E2, R2>, f: (c: C) => Option.Option<A>): Push<C, E, R, B, E2, R2>
}
```

Added in v1.20.0

## filterMapInputEffect

**Signature**

```ts
export declare const filterMapInputEffect: {
  <C, R3, E, A>(
    f: (c: C) => Effect.Effect<Option.Option<A>, E, R3>
  ): <R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<C, E, R | R3, B, E2, R2>
  <A, E, R, B, E2, R2, R3, C>(
    push: Push<A, E, R, B, E2, R2>,
    f: (c: C) => Effect.Effect<Option.Option<A>, E, R3>
  ): Push<C, E, R | R3, B, E2, R2>
}
```

Added in v1.20.0

## flatMap

**Signature**

```ts
export declare const flatMap: {
  <B, C, E3, R3>(
    f: (b: B) => Fx<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx<C, E3, R3>
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
}
```

Added in v1.20.0

## flatMapEffect

**Signature**

```ts
export declare const flatMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<A, E, R, Scope.Scope | C, E2 | E3, R2 | R3>
}
```

Added in v1.20.0

## make

**Signature**

```ts
export declare const make: {
  <B, E2, R2>(fx: Fx<B, E2, R2>): <A, E, R>(sink: Sink.Sink<A, E, R>) => Push<A, E, R, B, E2, R2>
  <A, E, R, B, E2, R2>(sink: Sink.Sink<A, E, R>, fx: Fx<B, E2, R2>): Push<A, E, R, B, E2, R2>
}
```

Added in v1.20.0

## map

**Signature**

```ts
export declare const map: {
  <B, C>(f: (b: B) => C): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2, R2>
  <A, E, R, B, E2, R2, C>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => C): Push<A, E, R, C, E2, R2>
}
```

Added in v1.20.0

## mapEffect

**Signature**

```ts
export declare const mapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<A, E, R, C, E2 | E3, R2 | R3>
}
```

Added in v1.20.0

## mapInput

**Signature**

```ts
export declare const mapInput: {
  <P extends Push.Any, C>(
    f: (c: C) => Sink.Success<P>
  ): (push: P) => Push<Sink.Context<P>, Sink.Error<P>, C, Fx.Context<P>, Fx.Error<P>, Fx.Success<P>>
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
  ): <R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<C, E, R | R3, B, E2, R2>
  <A, E, R, B, E2, R2, R3, C>(
    push: Push<A, E, R, B, E2, R2>,
    f: (c: C) => Effect.Effect<A, E, R3>
  ): Push<C, E, R | R3, B, E2, R2>
}
```

Added in v1.20.0

## switchMap

**Signature**

```ts
export declare const switchMap: {
  <B, C, E3, R3>(
    f: (b: B) => Fx<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, Scope.Scope | C, E2 | E3, R2 | R3>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx<C, E3, R3>
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>
}
```

Added in v1.20.0

## switchMapEffect

**Signature**

```ts
export declare const switchMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, Scope.Scope | C, E2 | E3, R2 | R3>
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>
  ): Push<A, E, R, Scope.Scope | C, E2 | E3, R2 | R3>
}
```

Added in v1.20.0
