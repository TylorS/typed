import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { ElementRef } from '@typed/html'
import * as Navigation from '@typed/navigation'

export interface ScrollRestorationParams<A extends HTMLElement> {
  readonly ref: ElementRef<A>
  readonly behavior?: ScrollBehavior
}

export type ScrollRestorationState = {
  readonly scrollRestoration?: {
    readonly scrollLeft: number
    readonly scrollTop: number
  }
}

export function ScrollRestoration<A extends HTMLElement>(
  params: ScrollRestorationParams<A>,
): Fx.Fx<Navigation.Navigation | Scope.Scope, never, null> {
  return Fx.gen(function* ($) {
    const { onNavigation } = yield* $(Navigation.Navigation)

    yield* $(
      onNavigation((ev) =>
        Effect.catchTag(
          Effect.gen(function* ($) {
            const state = (ev.destination.state ?? {}) as ScrollRestorationState

            // Restore scroll position on back/forward navigation
            if (
              ev.navigationType === Navigation.NavigationType.Back ||
              ev.navigationType === Navigation.NavigationType.Forward
            ) {
              const scrollRestoration = state?.scrollRestoration

              if (scrollRestoration) {
                // TODO: This should probably be ensured to happen AFTER a render occurs

                const el = yield* $(params.ref.element)

                el.scroll({
                  left: scrollRestoration.scrollLeft,
                  top: scrollRestoration.scrollTop,
                  behavior: params.behavior || 'smooth',
                })
              }

              return
            }

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

    return Fx.succeed(null)
  })
}
