---
title: useClickAway.ts
nav_order: 7
parent: "@typed/ui"
---

## useClickAway overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [onClickAway](#onclickaway)
  - [useClickAway](#useclickaway)

---

# utils

## onClickAway

**Signature**

```ts
export declare function onClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, B, E2, R2>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<B, E2, R2>
): Fx.Fx<B, E2, Document | R2 | Scope.Scope>
```

Added in v1.0.0

## useClickAway

**Signature**

```ts
export declare function useClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, R2>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<unknown, never, R2>
): Effect.Effect<Fiber.RuntimeFiber<void>, never, Document | Scope.Scope | R2>
```

Added in v1.0.0
