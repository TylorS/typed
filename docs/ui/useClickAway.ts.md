---
title: useClickAway.ts
nav_order: 4
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
export declare function onClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, R2, E2, B>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<R2, E2, B>
): Fx.Fx<Document | R2, E2, B>
```

Added in v1.0.0

## useClickAway

**Signature**

```ts
export declare function useClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, R2>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<R2, never, unknown>
): Effect.Effect<Document | Scope.Scope | R2, never, Fiber.RuntimeFiber<never, void>>
```

Added in v1.0.0
