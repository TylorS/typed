import { Tagged } from "@typed/context"
import * as Computed from "@typed/fx/Computed"
import { Data } from "effect"
// Needed for portability of NavigationError type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Effect, Equal as _Equal, Option, Scope, Types as _Types } from "effect"

export interface Navigation {
  readonly current: Computed.Computed<never, never, Destination>

  readonly destinations: Computed.Computed<never, never, ReadonlyArray<Destination>>

  readonly canGoBack: Computed.Computed<never, never, boolean>

  readonly canGoForward: Computed.Computed<never, never, boolean>

  readonly navigate: (
    url: string | URL,
    options?: NavigateOptions
  ) => Effect.Effect<never, NavigationError, Destination>

  readonly back: (options?: { readonly info?: unknown }) => Effect.Effect<never, NavigationError, Destination>

  readonly forward: (options?: { readonly info?: unknown }) => Effect.Effect<never, NavigationError, Destination>

  readonly traverseTo: (
    key: Destination["key"],
    options?: { readonly info?: unknown }
  ) => Effect.Effect<never, NavigationError, Destination>

  readonly updateCurrentEntry: (
    options: { readonly state: unknown }
  ) => Effect.Effect<never, never, Destination>

  readonly reload: (
    options?: { readonly info?: unknown; readonly state?: unknown }
  ) => Effect.Effect<never, NavigationError, Destination>

  readonly onNavigation: <R, R2>(
    handler: NavigationHandler<R, R2>
  ) => Effect.Effect<R | R2 | Scope.Scope, never, unknown>
}

export type NavigationHandler<R, R2> = (
  destination: Destination
) => Effect.Effect<R, never, Option.Option<Effect.Effect<R2, RedirectError, void>>>

export const Navigation = Tagged<Navigation, Navigation>("@typed/navigation/Navigation")

export interface Destination {
  readonly id: string
  readonly key: string
  readonly sameDocument: boolean
  readonly url: URL
  readonly state: Effect.Effect<never, never, unknown>
}

export function getCurrentPathFromUrl(location: Pick<URL, "pathname" | "search" | "hash">): string {
  return location.pathname + location.search + location.hash
}

export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
  readonly info?: unknown
}

export const navigate = (url: string | URL, options?: NavigateOptions) =>
  Navigation.withEffect((n) => n.navigate(url, options))

export const back: (options?: { readonly info?: unknown }) => Effect.Effect<Navigation, NavigationError, Destination> =
  (opts) => Navigation.withEffect((n) => n.back(opts))

export const forward: (
  options?: { readonly info?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (
  opts
) => Navigation.withEffect((n) => n.forward(opts))

export const traverseTo: (
  key: string,
  options?: { readonly info?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (key, opts) =>
  Navigation.withEffect((n) => n.traverseTo(key, opts))

export const updateCurrentEntry: (
  options: { readonly state: unknown }
) => Effect.Effect<Navigation, never, Destination> = (opts) => Navigation.withEffect((n) => n.updateCurrentEntry(opts))

export const reload: (
  options?: { readonly info?: unknown; readonly state?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (
  opts
) => Navigation.withEffect((n) => n.reload(opts))

export const CurrentDestination: Computed.Computed<Navigation, never, Destination> = Computed.fromTag(
  Navigation,
  (nav) => nav.current
)

export const CurrentPath: Computed.Computed<Navigation, never, string> = CurrentDestination.map((d) =>
  getCurrentPathFromUrl(d.url)
)

export const Destinations: Computed.Computed<Navigation, never, ReadonlyArray<Destination>> = Computed.fromTag(
  Navigation,
  (n) => n.destinations
)

export const CanGoForward: Computed.Computed<Navigation, never, boolean> = Computed.fromTag(
  Navigation,
  (n) => n.canGoForward
)

export const CanGoBack: Computed.Computed<Navigation, never, boolean> = Computed.fromTag(
  Navigation,
  (n) => n.canGoBack
)

export class NavigationError extends Data.TaggedError("NavigationError")<{ readonly error: unknown }> {}

export class RedirectError extends Data.TaggedError("RedirectError")<{ readonly redirect: Redirect }> {}

export type Redirect = RedirectToPath | RedirectToDestination

export interface RedirectToPath {
  readonly _tag: "RedirectToPath"
  readonly path: string | URL
  readonly options?: NavigateOptions | undefined
}

export interface RedirectToDestination {
  readonly _tag: "RedirectToDestination"
  readonly key: Destination["key"]
  readonly options?: { readonly info?: unknown } | undefined
}

export function redirectToPath(path: string | URL, options?: NavigateOptions) {
  return new RedirectError({ redirect: { _tag: "RedirectToPath", path, options } })
}

export function redirectToDestination(key: Destination["key"], options?: { readonly info?: unknown }) {
  return new RedirectError({ redirect: { _tag: "RedirectToDestination", key, options } })
}

export function isRedirectError(e: unknown): e is RedirectError {
  return e instanceof RedirectError
}
