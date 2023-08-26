import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

export interface UsePaginationParams {
  readonly initialPageSize?: number
}

export interface Pagination<R, E, A> {
  // Editable State
  readonly currentPage: Fx.RefSubject<never, number>
  readonly pageSize: Fx.RefSubject<never, number>
  // Computed State
  readonly canGoBack: Fx.Computed<R, E, boolean>
  readonly canGoForward: Fx.Computed<R, E, boolean>
  readonly paginated: Fx.Computed<R, E, ReadonlyArray<A>>
  readonly viewing: Fx.Computed<R, E, Viewing>
  // Actions
  readonly goBack: Effect.Effect<never, never, void>
  readonly goForward: Effect.Effect<R, E, void>
}

export interface Viewing {
  readonly start: number
  readonly end: number
  readonly total: number
}

export function usePagination<R, E, A>(
  values: Fx.Computed<R, E, ReadonlyArray<A>>,
  params?: UsePaginationParams,
): Effect.Effect<Scope.Scope, never, Pagination<R, E, A>> {
  return Effect.gen(function* ($) {
    const pageSize = yield* $(Fx.makeRef(Effect.succeed(params?.initialPageSize ?? 10)))
    const currentPage = yield* $(Fx.makeRef(Effect.succeed(0)))
    const derived = Fx.Computed.tuple(values, pageSize, currentPage).mapEffect(
      ([values, pageSize, page]) =>
        Effect.gen(function* ($) {
          const start = page * pageSize

          // If we are on a page that is out of bounds, go to the first page
          // TODO: Should we go to the last page in bounds instead?
          if (start > values.length) yield* $(currentPage.set(0))

          const end = Math.min(start + pageSize, values.length)
          const paginated = values.slice(start, end)
          const total = values.length

          return {
            paginated,
            viewing: {
              start: start + 1,
              end,
              total,
            },
            canGoBack: start > 0,
            canGoForward: end < total,
          }
        }),
    )
    const goBack = currentPage.update((page) => Math.max(0, page - 1))
    const goForward = currentPage.updateEffect((page) =>
      Effect.gen(function* ($) {
        const { canGoForward } = yield* $(derived.get)

        return canGoForward ? page + 1 : page
      }),
    )

    return {
      pageSize,
      currentPage,
      paginated: derived.map(({ paginated }) => paginated),
      viewing: derived.map(({ viewing }) => viewing),
      canGoBack: derived.map(({ canGoBack }) => canGoBack),
      canGoForward: derived.map(({ canGoForward }) => canGoForward),
      goBack,
      goForward,
    } as const
  })
}
