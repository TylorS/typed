---
title: usePagination.ts
nav_order: 7
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
  readonly page: RefSubject.Computed<never, never, number>
  readonly pageSize: RefSubject.Computed<never, never, number>
  readonly canGoBack: RefSubject.Computed<never, never, boolean>
  readonly canGoForward: RefSubject.Computed<never, E, boolean>
  readonly paginated: RefSubject.Computed<never, E, ReadonlyArray<A>>
  readonly viewing: RefSubject.Computed<never, E, Viewing>

  readonly goBack: Effect.Effect<number>
  readonly goForward: Effect.Effect<number, E>
  readonly goToStart: Effect.Effect<number>
  readonly goToEnd: Effect.Effect<number, E>
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
  items: RefSubject.Computed<R, E, ReadonlyArray<A>>,
  options: PaginationOptions = {}
): Effect.Effect<Pagination<E, A>, never, R | Scope.Scope>
```

Added in v1.0.0
