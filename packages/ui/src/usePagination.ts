/**
 * @since 1.0.0
 */

import * as RefSubject from "@typed/fx/RefSubject"
import type { Scope } from "effect"
import { Effect } from "effect"

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
  readonly page: RefSubject.Computed<never, never, number>
  readonly pageSize: RefSubject.Computed<never, never, number>
  readonly canGoBack: RefSubject.Computed<never, never, boolean>
  readonly canGoForward: RefSubject.Computed<never, E, boolean>
  readonly paginated: RefSubject.Computed<never, E, ReadonlyArray<A>>
  readonly viewing: RefSubject.Computed<never, E, Viewing>

  readonly goBack: Effect.Effect<never, never, number>
  readonly goForward: Effect.Effect<never, E, number>
  readonly goToStart: Effect.Effect<never, never, number>
  readonly goToEnd: Effect.Effect<never, E, number>
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
export function usePagination<R, E, A>(
  items: RefSubject.Computed<R, E, ReadonlyArray<A>>,
  options: PaginationOptions = {}
): Effect.Effect<R | Scope.Scope, never, Pagination<E, A>> {
  return Effect.gen(function*(_) {
    const ctx = yield* _(Effect.context<R>())
    const page: RefSubject.RefSubject<never, never, number> = yield* _(RefSubject.of(options.initialPage ?? 0))
    const pageSize: RefSubject.RefSubject<never, never, number> = yield* _(RefSubject.of(options.initialPageSize ?? 10))
    const canGoBack: RefSubject.Computed<never, never, boolean> = RefSubject.map(page, (x) => x > 0)
    const combined: RefSubject.Computed<never, E, readonly [number, number, ReadonlyArray<A>]> = RefSubject.provide(
      RefSubject.tuple([page, pageSize, items] as const),
      ctx
    )
    const canGoForward: RefSubject.Computed<never, E, boolean> = RefSubject.map(
      combined,
      ([page, pageSize, results]) => page < Math.ceil(results.length / pageSize - 1)
    )

    const getTotalPages: Effect.Effect<never, E, number> = Effect.provide(
      Effect.gen(function*($) {
        const currentPageSize = yield* $(pageSize)
        const results = yield* $(items)

        return Math.ceil(results.length / currentPageSize - 1)
      }),
      ctx
    )
    const goBack: Effect.Effect<never, never, number> = RefSubject.update(page, (x) => Math.max(x - 1, 0))
    const goForward: Effect.Effect<never, E, number> = RefSubject.updateEffect(
      page,
      (currentPage) =>
        Effect.gen(function*($) {
          const totalPages = yield* $(getTotalPages)
          const nextPage = Math.min(currentPage + 1, totalPages)

          return nextPage
        })
    )
    const goToStart: Effect.Effect<never, never, number> = RefSubject.set(page, 0)
    const goToEnd: Effect.Effect<never, E, number> = RefSubject.updateEffect(page, () => getTotalPages)

    const paginated: RefSubject.Computed<never, E, ReadonlyArray<A>> = RefSubject.map(
      combined,
      ([page, pageSize, results]) => {
        const start = page * pageSize
        const end = start + pageSize

        return results.slice(start, end)
      }
    )

    const viewing: RefSubject.Computed<never, E, Viewing> = RefSubject.map(combined, ([page, pageSize, results]) => {
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
