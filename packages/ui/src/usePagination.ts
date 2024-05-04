/**
 * @since 1.0.0
 */

import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

/**
 * @since 1.0.0
 */
export type PaginationOptions = {
  readonly initialPage?: number // 0
  readonly initialPageSize?: number // 10
}

/**
 * @since 1.0.0
 */
export interface Pagination<E, A> {
  readonly page: RefSubject.Computed<number>
  readonly pageSize: RefSubject.Computed<number>
  readonly canGoBack: RefSubject.Computed<boolean>
  readonly canGoForward: RefSubject.Computed<boolean, E>
  readonly paginated: RefSubject.Computed<ReadonlyArray<A>, E>
  readonly viewing: RefSubject.Computed<Viewing, E>

  readonly goBack: Effect.Effect<number>
  readonly goForward: Effect.Effect<number, E>
  readonly goToStart: Effect.Effect<number>
  readonly goToEnd: Effect.Effect<number, E>
}

/**
 * @since 1.0.0
 */
export interface Viewing {
  readonly from: number
  readonly to: number
  readonly total: number
}

/**
 * @since 1.0.0
 */
export function usePagination<A, E, R>(
  items: RefSubject.Computed<ReadonlyArray<A>, E, R>,
  options: PaginationOptions = {}
): Effect.Effect<Pagination<E, A>, never, R | Scope.Scope> {
  return Effect.gen(function*() {
    const ctx = yield* Effect.context<R>()
    const page: RefSubject.RefSubject<number> = yield* RefSubject.of(options.initialPage ?? 0)
    const pageSize: RefSubject.RefSubject<number> = yield* RefSubject.of(options.initialPageSize ?? 10)
    const canGoBack: RefSubject.Computed<boolean> = RefSubject.map(page, (x) => x > 0)
    const combined: RefSubject.Computed<readonly [number, number, ReadonlyArray<A>], E> = RefSubject.provide(
      RefSubject.tuple([page, pageSize, items] as const),
      ctx
    )
    const canGoForward: RefSubject.Computed<boolean, E> = RefSubject.map(
      combined,
      ([page, pageSize, results]) => page < Math.ceil(results.length / pageSize - 1)
    )

    const getTotalPages: Effect.Effect<number, E> = Effect.provide(
      Effect.gen(function*() {
        const currentPageSize = yield* pageSize
        const results = yield* items

        return Math.ceil(results.length / currentPageSize - 1)
      }),
      ctx
    )
    const goBack: Effect.Effect<number> = RefSubject.update(page, (x) => Math.max(x - 1, 0))
    const goForward: Effect.Effect<number, E> = RefSubject.updateEffect(
      page,
      (currentPage) =>
        Effect.gen(function*() {
          const totalPages = yield* getTotalPages
          const nextPage = Math.min(currentPage + 1, totalPages)

          return nextPage
        })
    )
    const goToStart: Effect.Effect<number> = RefSubject.set(page, 0)
    const goToEnd: Effect.Effect<number, E> = RefSubject.updateEffect(page, () => getTotalPages)

    const paginated: RefSubject.Computed<ReadonlyArray<A>, E> = RefSubject.map(
      combined,
      ([page, pageSize, results]) => {
        const start = page * pageSize
        const end = start + pageSize

        return results.slice(start, end)
      }
    )

    const viewing: RefSubject.Computed<Viewing, E> = RefSubject.map(combined, ([page, pageSize, results]) => {
      const start = page * pageSize
      const end = start + pageSize
      const total = results.length

      return {
        from: start + 1,
        to: Math.min(end, total),
        total
      }
    })

    return {
      page,
      pageSize,
      canGoBack,
      canGoForward,
      goBack,
      goForward,
      goToStart,
      goToEnd,
      paginated,
      viewing
    } as const
  })
}
