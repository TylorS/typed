import type { Context } from "@typed/context/Context"
import { RefArray, RefSubject } from "@typed/fx"
import * as Id from "@typed/id"
import { Navigation } from "@typed/navigation/Navigation"
import type {
  Destination,
  NavigateOptions,
  NavigationError,
  NavigationHandler,
  Redirect
} from "@typed/navigation/Navigation"
import type { Layer } from "effect"
import { Effect, Either, Option, ReadonlyArray } from "effect"

export interface MemoryOptions {
  readonly entries: ReadonlyArray<Destination>
  readonly origin?: string
  readonly currentIndex?: number
  readonly maxEntries?: number
  readonly states?: WeakMap<Destination, unknown>
}

type States = WeakMap<Destination, unknown>

const makeUrl = (urlOrPath: string | URL, origin: string): URL => {
  if (typeof urlOrPath === "string") {
    return new URL(urlOrPath, origin)
  } else {
    return urlOrPath
  }
}

const makeNewDestination = (urlOrPath: string | URL, states: States, origin: string) =>
  Effect.gen(function*(_) {
    const id = yield* _(Id.makeUuid)
    const key = yield* _(Id.makeNanoId)
    const url = makeUrl(urlOrPath, origin)

    const destination: Destination = {
      id,
      key,
      url,
      sameDocument: url.origin === origin,
      state: Effect.sync(() => states.get(destination))
    }

    return destination
  })

function makeMemoryNavigation(memoryOptions: MemoryOptions): Effect.Effect<never, never, Navigation> {
  const maxEntries = memoryOptions.maxEntries || 50
  const origin = memoryOptions.origin || "http://localhost"
  const states = memoryOptions.states ?? new WeakMap<Destination, unknown>()

  return Effect.gen(function*(_) {
    const currentDestinations = RefSubject.transform(
      yield* _(RefSubject.of(memoryOptions.entries)),
      (a): ReadonlyArray<Destination> => a.length > maxEntries ? ReadonlyArray.takeRight(a, maxEntries) : a,
      (a): ReadonlyArray<Destination> => a.length > maxEntries ? ReadonlyArray.takeRight(a, maxEntries) : a
    )
    const currentIndex = RefSubject.transform(
      yield* _(RefSubject.of(memoryOptions.currentIndex || memoryOptions.entries.length - 1)),
      (x) => Math.min(x, maxEntries),
      (x) => Math.min(x, maxEntries)
    )
    const current = RefSubject.tuple(currentDestinations, currentIndex).map(([ds, i]) => ds[i])
    const canGoBack = currentIndex.map((i) => i > 0)
    const canGoForward = RefSubject.tuple(currentDestinations, currentIndex).map(([ds, i]) => i < ds.length - 1)
    const isNavigating = yield* _(RefSubject.of(false))
    const handlers = yield* _(
      RefSubject.fromEffect(Effect.sync((): ReadonlyArray<readonly [NavigationHandler<any, any>, Context<any>]> => []))
    )

    const runHandlers = (destination: Destination, info: unknown) =>
      Effect.gen(function*(_) {
        yield* _(isNavigating.set(true))

        const currentHandlers = yield* _(handlers)

        for (const [handler, ctx] of currentHandlers) {
          const matched = yield* _(handler(destination, info), Effect.provide(ctx))

          if (Option.isSome(matched)) {
            const result = yield* _(matched.value, Effect.provide(ctx), Effect.either)

            if (Either.isLeft(result)) {
              return Option.some(result.left.redirect)
            }

            return Option.none()
          }
        }

        return Option.none()
      }).pipe(Effect.ensuring(isNavigating.set(false)))

    const handleRedirect = (redirect: Redirect): Effect.Effect<never, NavigationError, Destination> =>
      Effect.gen(function*(_) {
        if (redirect._tag === "RedirectToPath") {
          return yield* _(navigate(redirect.path, redirect.options))
        } else {
          return yield* _(traverseTo(redirect.key, redirect.options))
        }
      })

    const traverseTo = (
      key: string,
      options?: { readonly info?: unknown }
    ): Effect.Effect<never, NavigationError, Destination> =>
      Effect.gen(function*(_) {
        const destinations = yield* _(currentDestinations)
        const index = destinations.findIndex((d) => d.key === key)

        // Unable to traverse to a particular key
        if (index > -1) {
          yield* _(currentIndex.set(index))
        }

        const destination = yield* _(current)
        const redirect = yield* _(runHandlers(destination, options?.info))

        if (Option.isSome(redirect)) {
          return yield* _(handleRedirect(redirect.value))
        }

        return destination
      })

    const navigate = (
      url: string | URL,
      options?: NavigateOptions
    ): Effect.Effect<never, NavigationError, Destination> =>
      Effect.gen(function*(_) {
        const destination: Destination = yield* _(makeNewDestination(url, states, origin))

        if (options?.state) {
          states.set(destination, options.state)
        }

        const redirect = yield* _(runHandlers(destination, options?.info))

        if (Option.isSome(redirect)) {
          return yield* _(handleRedirect(redirect.value))
        }

        const index = yield* _(currentIndex)

        if (options?.history === "replace") {
          yield* _(RefArray.replaceAt(currentDestinations, index, destination))
        } else {
          const nextIndex = index + 1
          yield* _(RefArray.insertAt(currentDestinations, nextIndex, destination))
          yield* _(currentIndex.set(nextIndex))
        }

        return yield* _(current)
      })

    const onNavigation = <R, R2>(handler: NavigationHandler<R, R2>) =>
      Effect.gen(function*(_) {
        const ctx = yield* _(Effect.context<R | R2>())
        const entry = [handler, ctx] as const

        yield* _(RefArray.append(handlers, entry))
        yield* _(Effect.addFinalizer(() => handlers.update((handlers) => handlers.filter((h) => h !== entry))))
      })

    const back = (options?: { readonly info?: unknown }) =>
      Effect.gen(function*(_) {
        const index = yield* _(currentIndex)

        if (index === 0) return yield* _(current)

        const previousIndex = index - 1
        const destinations = yield* _(currentDestinations)
        const destination = destinations[previousIndex]

        const redirect = yield* _(runHandlers(destination, options?.info))

        if (Option.isSome(redirect)) {
          return yield* _(handleRedirect(redirect.value))
        }

        yield* _(currentIndex.set(previousIndex))

        return yield* _(current)
      })

    const forward = (options?: { readonly info?: unknown }) =>
      Effect.gen(function*(_) {
        const index = yield* _(currentIndex)
        const destinations = yield* _(currentDestinations)
        const lastIndex = destinations.length - 1

        if (index === lastIndex) return yield* _(current)

        const previousIndex = index + 1
        const destination = destinations[previousIndex]

        const redirect = yield* _(runHandlers(destination, options?.info))

        if (Option.isSome(redirect)) {
          return yield* _(handleRedirect(redirect.value))
        }

        yield* _(currentIndex.set(previousIndex))

        return yield* _(current)
      })

    const updateCurrentEntry = (options: { readonly state: unknown }) =>
      Effect.gen(function*(_) {
        const destination = yield* _(current)
        states.set(destination, options.state)
        return destination
      })

    const reload = (options?: { readonly info?: unknown; readonly state?: unknown }) =>
      Effect.gen(function*(_) {
        const destination = yield* _(current)
        if (options && "state" in options) {
          states.set(destination, options.state)
        }

        const redirect = yield* _(runHandlers(destination, options?.info))

        if (Option.isSome(redirect)) {
          return yield* _(handleRedirect(redirect.value))
        }

        return yield* _(current)
      })

    const navigation: Navigation = {
      current,
      destinations: currentDestinations,
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

    return navigation
  })
}

export const memory = (options: MemoryOptions): Layer.Layer<never, never, Navigation> =>
  Navigation.layer(makeMemoryNavigation(options))

export function initialMemory(urlOrPath: string | URL, origin?: string): Layer.Layer<never, never, Navigation> {
  return Navigation.layer(Effect.gen(function*(_) {
    const states = new WeakMap<Destination, unknown>()
    const destination = yield* _(makeNewDestination(urlOrPath, states, origin || "http://localhost"))

    return yield* _(makeMemoryNavigation({
      entries: [destination],
      currentIndex: 0,
      states
    }))
  }))
}
