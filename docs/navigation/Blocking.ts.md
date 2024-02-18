---
title: Blocking.ts
nav_order: 1
parent: "@typed/navigation"
---

## Blocking overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [BlockNavigation (interface)](#blocknavigation-interface)
  - [Blocking (interface)](#blocking-interface)
  - [UseBlockNavigationParams (interface)](#useblocknavigationparams-interface)
  - [useBlockNavigation](#useblocknavigation)

---

# utils

## BlockNavigation (interface)

**Signature**

```ts
export interface BlockNavigation extends RefSubject.Computed<Option.Option<Blocking>> {
  readonly isBlocking: RefSubject.Computed<boolean>
}
```

Added in v1.0.0

## Blocking (interface)

**Signature**

```ts
export interface Blocking extends BeforeNavigationEvent {
  readonly cancel: Effect.Effect<Destination>
  readonly confirm: Effect.Effect<Destination>
  readonly redirect: (urlOrPath: string | URL, options?: NavigateOptions) => Effect.Effect<Destination>
}
```

Added in v1.0.0

## UseBlockNavigationParams (interface)

**Signature**

```ts
export interface UseBlockNavigationParams<R = never> {
  readonly shouldBlock?: (event: BeforeNavigationEvent) => Effect.Effect<boolean, RedirectError | CancelNavigation, R>
}
```

Added in v1.0.0

## useBlockNavigation

**Signature**

```ts
export declare const useBlockNavigation: <R = never>(
  params?: UseBlockNavigationParams<R>
) => Effect.Effect<BlockNavigation, never, Navigation | R | Scope.Scope>
```

Added in v1.0.0
