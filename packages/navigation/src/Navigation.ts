import { Tagged } from "@typed/context"
import * as Computed from "@typed/fx/Computed"
import { fromFxEffect } from "@typed/fx/Fx"
import * as Versioned from "@typed/fx/Versioned"
import { Effect } from "effect"

// TODO: Represent errors
// TODO: back, forward, navigate, reload, traverseTo
// TODO: onNavigationEvent handlers

export interface Navigation {
  readonly current: Computed.Computed<never, never, Destination>
  readonly destinations: Computed.Computed<never, never, ReadonlyArray<Destination>>

  readonly navigate: (url: string | URL, options?: NavigateOptions) => Effect.Effect<never, never, Destination>

  readonly canGoBack: Computed.Computed<never, never, boolean>
  readonly canGoForward: Computed.Computed<never, never, boolean>
}

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

export const CurrentPath: Computed.Computed<Navigation, never, string> = Computed.Computed(
  Versioned.make({
    fx: fromFxEffect(Navigation.with((nav) => nav.current.map((d) => getCurrentPathFromUrl(d.url)))),
    effect: Navigation.withEffect((nav) => nav.current.map((d) => getCurrentPathFromUrl(d.url))),
    version: Navigation.withEffect((nav) => nav.current.version)
  }),
  Effect.succeed
)

export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
}

export const navigate = (url: string | URL, options?: NavigateOptions) =>
  Navigation.withEffect((n) => n.navigate(url, options))
