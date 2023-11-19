/* eslint-disable @typescript-eslint/consistent-type-imports */

import { Context } from "@typed/context"
import { scopedRuntime } from "@typed/fx/internal/helpers"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import { Effect, Either, Option, Scope } from "effect"
import {
  type Destination,
  type NavigateOptions,
  type Navigation,
  NavigationError,
  NavigationHandler,
  Redirect
} from "../Navigation"

export function fromNavigation(
  navigation: import("@virtualstate/navigation").Navigation
): Effect.Effect<Scope.Scope, never, Navigation> {
  return Effect.gen(function*(_) {
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
    const handlers = yield* _(
      RefSubject.fromEffect(Effect.sync((): ReadonlyArray<readonly [NavigationHandler<any, any>, Context<any>]> => []))
    )
    const isNavigating = yield* _(RefSubject.of(false))

    const navigate = (url: string | URL, options?: NavigateOptions) =>
      Effect.async<never, NavigationError, Destination>((resume) => {
        const { finished } = navigation.navigate(url.toString(), options)

        finished.then(() => resume(current), (error) => resume(Effect.fail(new NavigationError(error))))
      })

    const back = (options?: { readonly info?: unknown }) =>
      Effect.async<never, NavigationError, Destination>((resume) => {
        navigation.back(options).finished.then(
          () => resume(current),
          (error) => resume(Effect.fail(new NavigationError(error)))
        )
      })

    const forward = (options?: { readonly info?: unknown }) =>
      Effect.async<never, NavigationError, Destination>((resume) => {
        navigation.forward(options).finished.then(
          () => resume(current),
          (error) => resume(Effect.fail(new NavigationError(error)))
        )
      })

    const traverseTo = (key: string, options?: { readonly info?: unknown }) =>
      Effect.async<never, NavigationError, Destination>((resume) => {
        navigation.traverseTo(key, options).finished.then(
          () => resume(current),
          (error) => resume(Effect.fail(new NavigationError(error)))
        )
      })

    const updateCurrentEntry = (options: { readonly state: unknown }) =>
      Effect.suspend(() => {
        navigation.updateCurrentEntry(options)

        return current
      })

    const reload = (options?: { readonly info?: unknown; readonly state?: unknown }) =>
      Effect.async<never, NavigationError, Destination>((resume) => {
        navigation.reload(options).finished.then(
          () => resume(current),
          (error) => resume(Effect.fail(new NavigationError(error)))
        )
      })

    const onNavigation = <R, R2>(handler: NavigationHandler<R, R2>) =>
      Effect.gen(function*(_) {
        const ctx = yield* _(Effect.context<R | R2>())
        const entry = [handler, ctx] as const

        yield* _(RefArray.append(handlers, entry))
        yield* _(Effect.addFinalizer(() => handlers.update((handlers) => handlers.filter((h) => h !== entry))))
      })

    const { run, runPromise } = yield* _(scopedRuntime<never>())

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

    const runHandlers = (destination: Destination, info: unknown) =>
      Effect.gen(function*(_) {
        yield* _(isNavigating.set(true))

        const currentHandlers = yield* _(handlers)

        for (const [handler, ctx] of currentHandlers) {
          const matched = yield* _(handler(destination, info), Effect.provide(ctx))

          if (Option.isSome(matched)) {
            const result = yield* _(matched.value, Effect.provide(ctx), Effect.either)

            if (Either.isLeft(result)) {
              return handleRedirect(navigation, result.left.redirect)
            }

            return
          }
        }
      }).pipe(Effect.ensuring(isNavigating.set(false)))

    navigation.addEventListener("navigate", (ev) => {
      if (shouldNotIntercept(ev)) return

      ev.intercept({
        handler: () => runPromise(runHandlers(navigationDestinationToDestination(ev.destination), ev.info))
      })
    })

    const nav: Navigation = {
      current,
      destinations,
      canGoBack,
      canGoForward,
      isNavigating,
      navigate,
      back,
      forward,
      traverseTo,
      updateCurrentEntry,
      reload,
      onNavigation
    }

    return nav
  })
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

function navigationHistoryEntryToDestination(
  entry: import("@virtualstate/navigation").NavigationHistoryEntry
): Destination {
  return {
    id: entry.id,
    key: entry.key,
    sameDocument: entry.sameDocument,
    url: new URL(entry.url!),
    state: Effect.sync(() => entry.getState())
  }
}

function navigationDestinationToDestination(
  destination: import("@virtualstate/navigation").NavigationDestination
): Destination {
  return {
    id: destination.id!,
    key: destination.key!,
    sameDocument: destination.sameDocument,
    url: new URL(destination.url!),
    state: Effect.sync(() => destination.getState())
  }
}

function handleRedirect(
  navigation: import("@virtualstate/navigation").Navigation,
  redirect: Redirect
) {
  if (redirect._tag === "RedirectToPath") {
    return navigation.navigate(redirect.path.toString(), { history: "replace", ...redirect.options })
  } else {
    return navigation.traverseTo(redirect.key, redirect.options)
  }
}
