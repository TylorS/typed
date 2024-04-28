---
title: RefSubject.ts
nav_order: 22
parent: "@typed/core"
---

## RefSubject overview

Re-exports from @typed/fx/RefSubject

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [exports](#exports)
  - [From "@typed/fx/RefSubject"](#from-typedfxrefsubject)
- [utils](#utils)
  - [takeOneIfDomEnvironment](#takeoneifdomenvironment)
  - [takeOneIfEnvironment](#takeoneifenvironment)
  - [takeOneIfNotDomEnvironment](#takeoneifnotdomenvironment)
  - [takeOneIfNotEnvironment](#takeoneifnotenvironment)
  - [takeOneIfNotServerEnvironment](#takeoneifnotserverenvironment)
  - [takeOneIfNotStaticEnvironment](#takeoneifnotstaticenvironment)
  - [takeOneIfServerEnvironment](#takeoneifserverenvironment)
  - [takeOneIfStaticEnvironment](#takeoneifstaticenvironment)

---

# exports

## From "@typed/fx/RefSubject"

[RefSubject documentation](https://tylors.github.io/typed/fx/RefSubject.ts.html)

**Signature**

```ts
export * from "@typed/fx/RefSubject"
```

Added in v1.0.0

# utils

## takeOneIfDomEnvironment

**Signature**

```ts
export declare const takeOneIfDomEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R>
```

Added in v1.0.0

## takeOneIfEnvironment

**Signature**

```ts
export declare const takeOneIfEnvironment: {
  (
    environments: ReadonlyArray<Environment>
  ): <A, E, R>(fx: RefSubject.RefSubject<A, E, R>) => RefSubject.RefSubject<A, E, R | CurrentEnvironment>
  <A, E, R>(
    fx: RefSubject.RefSubject<A, E, R>,
    environments: ReadonlyArray<Environment>
  ): RefSubject.RefSubject<A, E, R | CurrentEnvironment>
}
```

Added in v1.0.0

## takeOneIfNotDomEnvironment

**Signature**

```ts
export declare const takeOneIfNotDomEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R>
```

Added in v1.0.0

## takeOneIfNotEnvironment

**Signature**

```ts
export declare const takeOneIfNotEnvironment: {
  (
    environments: ReadonlyArray<Environment>
  ): <A, E, R>(fx: RefSubject.RefSubject<A, E, R>) => RefSubject.RefSubject<A, E, CurrentEnvironment | R>
  <A, E, R>(
    fx: RefSubject.RefSubject<A, E, R>,
    environments: ReadonlyArray<Environment>
  ): RefSubject.RefSubject<A, E, CurrentEnvironment | R>
}
```

Added in v1.0.0

## takeOneIfNotServerEnvironment

**Signature**

```ts
export declare const takeOneIfNotServerEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R>
```

Added in v1.0.0

## takeOneIfNotStaticEnvironment

**Signature**

```ts
export declare const takeOneIfNotStaticEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R>
```

Added in v1.0.0

## takeOneIfServerEnvironment

**Signature**

```ts
export declare const takeOneIfServerEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R>
```

Added in v1.0.0

## takeOneIfStaticEnvironment

**Signature**

```ts
export declare const takeOneIfStaticEnvironment: <A, E, R>(
  fx: RefSubject.RefSubject<A, E, R>
) => RefSubject.RefSubject<A, E, CurrentEnvironment | R>
```

Added in v1.0.0
