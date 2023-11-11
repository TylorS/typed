/* eslint-disable @typescript-eslint/consistent-type-imports */

import { Window } from "@typed/dom/Window"
import { scopedRuntime } from "@typed/fx/internal/helpers"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Layer } from "effect"
import { Effect } from "effect"
import { Destination, NavigateOptions, Navigation } from "./Navigation"

const getNavigation = (window: Window, options?: import("@virtualstate/navigation").NavigationOptions) =>
  Effect.gen(function*(_) {
    return (globalThis as any).navigation as import("@virtualstate/navigation").Navigation ||
      (yield* _(
        Effect.promise(() =>
          import("@virtualstate/navigation").then(({ Navigation, getCompletePolyfill }) => {
            const navigation = new Navigation(options)

            // Apply the polyfill to window/history
            const polyfill = getCompletePolyfill({
              history: window.history as any,
              interceptEvents: true,
              limit: 50,
              navigation: navigation as any,
              patch: true,
              persist: true,
              persistState: true,
              window: window as any
            })

            polyfill.apply()

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

    const current = yield* _(
      RefSubject.fromEffect(Effect.sync(() => navigationHistoryEntryToDestination(navigation.currentEntry)))
    )
    const destinations = yield* _(
      RefSubject.fromEffect(Effect.sync(() => navigation.entries().map(navigationHistoryEntryToDestination)))
    )
    const canGoBack = yield* _(
      RefSubject.fromEffect(Effect.sync(() => navigation.canGoBack))
    )
    const canGoForward = yield* _(RefSubject.fromEffect(Effect.sync(() => navigation.canGoForward)))

    const navigate = (url: string | URL, options?: NavigateOptions) =>
      Effect.async<never, never, Destination>((resume) => {
        const { finished } = navigation.navigate(url.toString(), options)

        finished.then(() => resume(current), (error) => resume(Effect.die(error)))
      })

    const back = (options?: { readonly info?: unknown }) =>
      Effect.async<never, never, Destination>((resume) => {
        navigation.back(options).finished.then(
          () => resume(current),
          (error) => resume(Effect.die(error))
        )
      })

    const forward = (options?: { readonly info?: unknown }) =>
      Effect.async<never, never, Destination>((resume) => {
        navigation.forward(options).finished.then(
          () => resume(current),
          (error) => resume(Effect.die(error))
        )
      })

    const traverseTo = (key: string, options?: { readonly info?: unknown }) =>
      Effect.async<never, never, Destination>((resume) => {
        navigation.traverseTo(key, options).finished.then(
          () => resume(current),
          (error) => resume(Effect.die(error))
        )
      })

    const updateCurrentEntry = (options: { readonly state: unknown }) =>
      Effect.suspend(() => {
        navigation.updateCurrentEntry(options)

        return current
      })

    const { run } = yield* _(scopedRuntime<never>())

    const updatedDerivedStates = Effect.gen(function*(_) {
      yield* _(canGoBack.set(navigation.canGoBack))
      yield* _(canGoForward.set(navigation.canGoForward))
    })

    navigation.addEventListener(
      "currententrychange",
      () => {
        run(
          Effect.zipRight(
            current.set(navigationHistoryEntryToDestination(navigation.currentEntry)),
            updatedDerivedStates
          )
        )
      }
    )

    navigation.addEventListener("entrieschange", () => {
      run(
        Effect.zipRight(
          destinations.set(navigation.entries().map(navigationHistoryEntryToDestination)),
          updatedDerivedStates
        )
      )
    })

    navigation.addEventListener("navigate", (ev) => {
      if (shouldNotIntercept(ev)) return

      // TODO: We need to support interception handler
      ev.intercept()
    })

    const nav: Navigation = {
      current,
      destinations,
      canGoBack,
      canGoForward,
      navigate,
      back,
      forward,
      traverseTo,
      updateCurrentEntry
    }

    return nav
  }))

function navigationHistoryEntryToDestination(
  entry: import("@virtualstate/navigation").NavigationHistoryEntry
): Destination {
  return {
    id: entry.id,
    key: entry.key,
    sameDocument: entry.sameDocument,
    url: new URL(entry.url!),
    // TODO: These need to be updated
    state: Effect.sync(() => entry.getState())
  }
}

function shouldNotIntercept(navigationEvent: import("@virtualstate/navigation").NavigateEvent): boolean {
  return (
    !navigationEvent.canIntercept ||
    // If this is just a hashChange,
    // just let the browser handle scrolling to the content.
    navigationEvent.hashChange ||
    // If this is a download,
    // let the browser perform the download.
    !!navigationEvent.downloadRequest ||
    // If this is a form submission,
    // let that go to the server.
    !!navigationEvent.formData
  )
}
