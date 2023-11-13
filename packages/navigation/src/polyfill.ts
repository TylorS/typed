/* eslint-disable @typescript-eslint/consistent-type-imports */

import { Window } from "@typed/dom/Window"
import { fromNavigation } from "@typed/navigation/internal/fromNavigation"
import type { Layer } from "effect"
import { Effect } from "effect"
import { Navigation } from "./Navigation"

const getNavigation = (window: Window, options?: import("@virtualstate/navigation").NavigationOptions) =>
  Effect.gen(function*(_) {
    return (window as any).navigation as import("@virtualstate/navigation").Navigation ||
      (yield* _(
        Effect.promise(() =>
          import("@virtualstate/navigation").then(({ Navigation, getCompletePolyfill }) => {
            const navigation = new Navigation(options)

            // Apply the polyfill to window/history
            getCompletePolyfill({
              history: window.history as any,
              interceptEvents: true,
              limit: 50,
              navigation: navigation as any,
              patch: true,
              persist: true,
              persistState: true,
              window: window as any
            }).apply()

            return navigation
          })
        )
      ))
  })

export const polyfill = (
  options?: import("@virtualstate/navigation").NavigationOptions
): Layer.Layer<Window, never, Navigation> =>
  Navigation.scoped(Effect.gen(function*(_) {
    const window = yield* _(Window)
    const navigation = yield* _(getNavigation(window, options))

    return yield* _(fromNavigation(navigation))
  }))
