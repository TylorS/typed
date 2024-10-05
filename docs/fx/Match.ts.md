---
title: Match.ts
nav_order: 8
parent: "@typed/fx"
---

## Match overview

Added in v1.18.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
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

## Matcher (namespace)

Added in v1.18.0

### Variance (interface)

**Signature**

```ts
export interface Variance<I, O, E, R> {
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
export interface TypeMatcher<I, O = never, E = never, R = never> {
  readonly _tag: "TypeMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<I, O, E, R>

  readonly when: <R2 = never, E2 = never, A = never, R3 = never, E3 = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: (value: RefSubject.RefSubject<A>) => Fx.Fx<B, E3, R3>
  ) => TypeMatcher<I, O | B, E | E2 | E3, R | R2 | R3>

  readonly to: <R2 = never, E2 = never, A = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: B
  ) => TypeMatcher<I, O | B, E | E2, R | R2>

  readonly run: <R2 = never, E2 = never>(
    input: Fx.Fx<I, E2, R2>
  ) => Fx.Fx<Option.Option<O>, E | E2, R | R2 | Scope.Scope>
}
```

Added in v1.18.0

## ValueMatcher (interface)

**Signature**

```ts
export interface ValueMatcher<I, O = never, E = never, R = never> extends Fx.Fx<Option.Option<O>, E, R | Scope.Scope> {
  readonly _tag: "ValueMatcher"

  readonly [MatcherTypeId]: Matcher.Variance<I, O, E, R>

  readonly value: Fx.Fx<I, E, R>

  readonly when: <A, E2, R2, R3 = never, E3 = never, B = never>(
    guard: GuardInput<I, A, E2, R2>,
    onMatch: (value: RefSubject.RefSubject<A>) => Fx.Fx<B, E3, R3>
  ) => ValueMatcher<I, O | B, E | E2 | E3, R | R2 | R3>

  readonly to: <A, E2, R2, B>(guard: GuardInput<I, A, E2, R2>, onMatch: B) => ValueMatcher<I, O | B, E | E2, R | R2>

  readonly getOrElse: <R2 = never, E2 = never, B = never>(
    f: () => Fx.Fx<B, E2, R2>
  ) => Fx.Fx<O | B, E | E2, R | R2 | Scope.Scope>
}
```

Added in v1.18.0

## type

**Signature**

```ts
export declare const type: <I>() => TypeMatcher<I>
```

Added in v1.18.0

## value

**Signature**

```ts
export declare const value: <I, E = never, R = never>(input: Fx.Fx<I, E, R>) => ValueMatcher<I, never, E, R>
```

Added in v1.18.0
