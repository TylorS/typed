/* eslint-disable @typescript-eslint/consistent-type-imports */

import { addWindowListener, Window } from "@typed/dom/Window"
import { scopedRuntime } from "@typed/fx/internal/helpers"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Layer } from "effect"
import { Effect } from "effect"
import { Destination, NavigateOptions, Navigation } from "./Navigation"

const getNavigation = (options?: import("@virtualstate/navigation").NavigationOptions) =>
  Effect.gen(function*(_) {
    const hasNative = "navigation" in globalThis

    const navigation = hasNative ?
      (globalThis as any).navigation as import("@virtualstate/navigation").Navigation :
      (yield* _(
        Effect.promise(() => import("@virtualstate/navigation").then((m) => new m.Navigation(options)))
      ))

    return [navigation, hasNative] as const
  })

// TODO: Support saving and restoring navigation entries to localStorage

export const polyfill = (
  options?: import("@virtualstate/navigation").NavigationOptions
): Layer.Layer<Window, never, Navigation> =>
  Navigation.scoped(Effect.gen(function*(_) {
    const window = yield* _(Window)
    // const fiberId = yield* _(Effect.fiberId)
    const [navigation, hasNative] = yield* _(
      getNavigation({
        getState: () => window.history.state,
        setState: (entry) => window.history.pushState(entry.getState(), "", entry.url!),
        ...options
      })
    )
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

    if (!hasNative) {
      // The native implementation automatically allows intercepting link clicks
      yield* _(interceptLinkClicks(window, navigation))
    }

    // navigationPolyfill.addEventListener("navigatesuccess", (ev) => {})

    const nav: Navigation = {
      current,
      destinations,
      canGoBack,
      canGoForward,
      navigate
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

function interceptLinkClicks(window: Window, navigation: import("@virtualstate/navigation").Navigation) {
  return addWindowListener({
    eventName: "click",
    handler: (e) =>
      Effect.sync(() => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.defaultPrevented) return

        let el = findLink(e.target as Node | null)

        // Allows intercepting across shadow-dom boundaries
        if (!el && e.composedPath) {
          el = findLink(e.composedPath()[0] as Node)
        }

        // 1. Not a link
        if (!el) {
          return
        }

        // 2. "download" attribute
        if (el.getAttribute("download") !== null) {
          return
        }

        // 3. rel="external" attribute
        if (el.getAttribute("rel") === "external") {
          return
        }

        // 4. target attribute
        if ((el.target && el.target !== "_self")) {
          return
        }

        const link = el.href

        // ensure this is not a hash for the same path
        if (el.pathname === window.location.pathname && (el.hash || link === "#")) {
          return
        }

        // Check for mailto: in the href
        if (link && link.indexOf("mailto:") > -1) {
          return
        }

        e.preventDefault()

        navigation.navigate(link, { history: "push" })
      })
  })
}

function findLink(el: Node | null) {
  while (el && el.nodeName !== "A") {
    el = el.parentNode
  }
  if (!el || el.nodeName !== "A") {
    return null
  }
  return el as HTMLAnchorElement | null
}
