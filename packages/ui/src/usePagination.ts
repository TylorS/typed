import * as Computed from "@typed/fx/Computed"
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
  items: Computed.Computed<R, E, ReadonlyArray<A>>,
  options: PaginationOptions = {}
): Effect.Effect<R | Scope.Scope, never, Pagination<E, A>> {
  return Effect.gen(function*(_) {
    const ctx = yield* _(Effect.context<R>())
    const page: RefSubject.RefSubject<never, never, number> = yield* _(RefSubject.of(options.initialPage ?? 0))
    const pageSize: RefSubject.RefSubject<never, never, number> = yield* _(RefSubject.of(options.initialPageSize ?? 10))
    const canGoBack: Computed.Computed<never, never, boolean> = page.map((x) => x > 0)
    const combined: Computed.Computed<never, E, readonly [number, number, ReadonlyArray<A>]> = Computed.provide(
      Computed.combine([page, pageSize, items] as const),
      ctx
    )
    const canGoForward: Computed.Computed<never, E, boolean> = combined.map(
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
    const goBack: Effect.Effect<never, never, number> = page.update((x) => Math.max(x - 1, 0))
    const goForward: Effect.Effect<never, E, number> = page.updateEffect((currentPage) =>
      Effect.gen(function*($) {
        const totalPages = yield* $(getTotalPages)
        const nextPage = Math.min(currentPage + 1, totalPages)

        return nextPage
      })
    )
    const goToStart: Effect.Effect<never, never, number> = page.set(0)
    const goToEnd: Effect.Effect<never, E, number> = page.updateEffect(() => getTotalPages)

    const paginated: Computed.Computed<never, E, ReadonlyArray<A>> = combined.map(([page, pageSize, results]) => {
      const start = page * pageSize
      const end = start + pageSize

      return results.slice(start, end)
    })

    const viewing: Computed.Computed<never, E, Viewing> = combined.map(
      ([page, pageSize, results]) => {
        const start = page * pageSize
        const end = start + pageSize
        const total = results.length

        return {
          from: start + 1,
          to: Math.min(end, total),
          total
        }
      }
    )

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
