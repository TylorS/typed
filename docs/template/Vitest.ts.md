---
title: Vitest.ts
nav_order: 24
parent: "@typed/template"
---

## Vitest overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [describe](#describe)
  - [expect](#expect)
  - [it](#it)
  - [test](#test)

---

# utils

## describe

**Signature**

```ts
export declare const describe: any
```

Added in v1.0.0

## expect

**Signature**

```ts
export declare const expect: vitest.ExpectStatic
```

Added in v1.0.0

## it

**Signature**

```ts
export declare function it<E, A>(name: string, test: () => Effect.Effect<Scope, E, A>, options?: vitest.TestOptions)
```

Added in v1.0.0

## test

**Signature**

```ts
export declare function test<E, A>(
  name: string,
  test: (options: { readonly clock: TestClock.TestClock }) => Effect.Effect<Scope | TestServices.TestServices, E, A>,
  options?: vitest.TestOptions
)
```

Added in v1.0.0
