---
title: Match.ts
nav_order: 9
parent: "@typed/fx"
---

## Match overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [AsGuard (interface)](#asguard-interface)
  - [Matcher (namespace)](#matcher-namespace)
    - [Variance (interface)](#variance-interface)
  - [MatcherTypeId](#matchertypeid)
  - [MatcherTypeId (type alias)](#matchertypeid-type-alias)
  - [TypeMatcher (interface)](#typematcher-interface)
  - [ValueMatcher (interface)](#valuematcher-interface)
  - [type](#type)
  - [value](#value)

---

# utils

## AsGuard (interface)

**Signature**

```ts
export interface AsGuard<I, R, E, A> {
  readonly asGuard: () => Guard<I, R, E, A>
}
```

Added in v1.18.0

## Matcher (namespace)

Added in v1.18.0

### Variance (interface)

**Signature**

```ts
export interface Variance<R, E, I, O> {
  readonly _R: (_: never) => R
  readonly _E: (_: never) => E
  readonly _I: (_: I) => unknown
  readonly _O: (_: never) => O
}
```

Added in v1.18.0

## MatcherTypeId

**Signature**

```ts
export declare const MatcherTypeId: typeof MatcherTypeId
```

Added in v1.18.0

## MatcherTypeId (type alias)

**Signature**

```ts
export type MatcherTypeId = typeof MatcherTypeId
```

Added in v1.18.0

## TypeMatcher (interface)

**Signature**

```ts
export interface TypeMatcher<out R, out E, in out I, out O> {
  readonly _tag: "TypeMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<R, E, I, O>

  readonly when: <R2 = never, E2 = never, A = never, R3 = never, E3 = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R3, E3, B>
  ) => TypeMatcher<R | R2 | R3, E | E2 | E3, I, O | B>

  readonly to: <R2 = never, E2 = never, A = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: B
  ) => TypeMatcher<R | R2, E | E2, I, O | B>

  readonly run: <R2 = never, E2 = never>(
    input: Fx.Fx<R2, E2, I>
  ) => Fx.Fx<R | R2 | Scope.Scope, E | E2, Option.Option<O>>
}
```

Added in v1.18.0

## ValueMatcher (interface)

**Signature**

```ts
export interface ValueMatcher<out R, out E, in out I, out O> extends Fx.Fx<R | Scope.Scope, E, Option.Option<O>> {
  readonly _tag: "ValueMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<R, E, I, O>

  readonly value: Fx.Fx<R, E, I>

  readonly when: <R2, E2, A, R3 = never, E3 = never, B = never>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: (value: RefSubject.RefSubject<never, never, A>) => Fx.Fx<R3, E3, B>
  ) => ValueMatcher<R | R2 | R3, E | E2 | E3, I, O | B>

  readonly to: <R2, E2, A, B>(
    guard: Guard<I, R2, E2, A> | AsGuard<I, R2, E2, A>,
    onMatch: B
  ) => ValueMatcher<R | R2, E | E2, I, O | B>

  readonly getOrElse: <R2 = never, E2 = never, B = never>(
    f: () => Fx.Fx<R2, E2, B>
  ) => Fx.Fx<R | R2 | Scope.Scope, E | E2, O | B>
}
```

Added in v1.18.0

## type

**Signature**

```ts
export declare const type: <I>() => TypeMatcher<never, never, I, never>
```

Added in v1.18.0

## value

**Signature**

```ts
export declare const value: <R, E, I>(input: Fx.Fx<R, E, I>) => ValueMatcher<R, E, I, never>
```

Added in v1.18.0
