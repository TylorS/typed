---
title: usePagination.ts
nav_order: 5
parent: "@typed/ui"
---

## usePagination overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [Pagination (interface)](#pagination-interface)
  - [PaginationOptions (type alias)](#paginationoptions-type-alias)
  - [Viewing (interface)](#viewing-interface)
  - [usePagination](#usepagination)

---

# utils

## Pagination (interface)

**Signature**

```ts
export interface Pagination<E, A> {
  readonly page: Computed.Computed<never, never, number>
  readonly pageSize: Computed.Computed<never, never, number>
  readonly canGoBack: Computed.Computed<never, never, boolean>
  readonly canGoForward: Computed.Computed<never, E, boolean>
  readonly paginated: Computed.Computed<never, E, ReadonlyArray<A>>
  readonly viewing: Computed.Computed<never, E, Viewing>

  readonly goBack: Effect.Effect<never, never, number>
  readonly goForward: Effect.Effect<never, E, number>
  readonly goToStart: Effect.Effect<never, never, number>
  readonly goToEnd: Effect.Effect<never, E, number>
}
```

Added in v1.0.0

## PaginationOptions (type alias)

**Signature**

```ts
export type PaginationOptions = {
  readonly initialPage?: number // 0
  readonly initialPageSize?: number // 10
}
```

Added in v1.0.0

## Viewing (interface)

**Signature**

```ts
export interface Viewing {
  readonly from: number
  readonly to: number
  readonly total: number
}
```

Added in v1.0.0

## usePagination

**Signature**

```ts
export declare function usePagination<R, E, A>(
  items: Computed.Computed<R, E, ReadonlyArray<A>>,
  options: PaginationOptions = {}
): Effect.Effect<R | Scope.Scope, never, Pagination<E, A>>
```

Added in v1.0.0
