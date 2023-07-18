import * as Duration from '@effect/data/Duration'
import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { ElementRef } from '@typed/html'
import * as Navigation from '@typed/navigation'

export interface ScrollRestorationParams<A extends HTMLElement> {
  readonly ref: ElementRef<A>
  readonly behavior?: ScrollBehavior
  readonly retries?: number
  readonly retryDelay?: (depth: number) => Duration.Duration
}

export type ScrollRestorationState = {
  readonly scrollRestoration?: {
    readonly scrollLeft: number
    readonly scrollTop: number
  }
}

const defaultDelay = (depth: number) => Duration.millis(10 * depth)

export function ScrollRestoration<A extends HTMLElement>(
  params: ScrollRestorationParams<A>,
): Fx.Fx<Navigation.Navigation | Scope.Scope, never, null> {
  return Fx.gen(function* ($) {
    const { retries = 3, retryDelay = defaultDelay } = params
    const { onNavigation, onNavigationEnd } = yield* $(Navigation.Navigation)

    yield* $(
      onNavigation((ev) =>
        Effect.catchTag(
          Effect.gen(function* ($) {
            const state = (ev.destination.state ?? {}) as ScrollRestorationState

            // If ScrollRestoration is not set, set it
            if (!state.scrollRestoration) {
              const el = yield* $(params.ref.element)
              const scrollLeft = el.scrollLeft
              const scrollTop = el.scrollTop

              return yield* $(
                Navigation.redirect(ev.destination.url.href, {
                  history:
                    ev.navigationType === Navigation.NavigationType.Replace ? 'replace' : 'push',
                  state: {
                    ...state,
                    scrollRestoration: {
                      scrollLeft,
                      scrollTop,
                    },
                  },
                }),
              )
            }
          }),
          // If there is not Element to scroll, ignore the error
          'NoSuchElementException',
          Effect.succeed,
        ),
      ),
    )

    yield* $(
      onNavigationEnd(function restoreScroll(ev, depth = 0): Effect.Effect<never, never, void> {
        return pipe(
          Effect.gen(function* ($) {
            if (depth > retries) {
              return
            }

            const state = (ev.destination.state ?? {}) as ScrollRestorationState

            // Restore scroll position on back/forward navigation
            if (
              ev.navigationType === Navigation.NavigationType.Back ||
              ev.navigationType === Navigation.NavigationType.Forward
            ) {
              const scrollRestoration = state?.scrollRestoration

              if (scrollRestoration) {
                const el = yield* $(params.ref.element)

                el.scroll({
                  left: scrollRestoration.scrollLeft,
                  top: scrollRestoration.scrollTop,
                  behavior: params.behavior || 'smooth',
                })
              }
            }
          }),
          // HACK: This isn't great, we should have some kind of way of letting the
          // navigation know when an external render has finished.
          Effect.catchTag(
            // If there is not Element to scroll, attempt to retry a few times.
            'NoSuchElementException',
            () => {
              const d = depth + 1
              return Effect.delay(restoreScroll(ev, d), retryDelay(d))
            },
          ),
        )
      }),
    )

    return Fx.succeed(null)
  })
}
