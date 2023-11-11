import { Tagged } from "@typed/context"
import * as Computed from "@typed/fx/Computed"
import type { Effect } from "effect"

// TODO: Represent errors
// TODO: reload, traverseTo
// TODO: onNavigationEvent handlers

export interface Navigation {
  readonly current: Computed.Computed<never, never, Destination>
  readonly destinations: Computed.Computed<never, never, ReadonlyArray<Destination>>

  readonly navigate: (url: string | URL, options?: NavigateOptions) => Effect.Effect<never, never, Destination>

  readonly canGoBack: Computed.Computed<never, never, boolean>
  readonly canGoForward: Computed.Computed<never, never, boolean>

  readonly back: (options?: { readonly info?: unknown }) => Effect.Effect<never, never, Destination>
  readonly forward: (options?: { readonly info?: unknown }) => Effect.Effect<never, never, Destination>
  readonly traverseTo: (key: string, options?: { readonly info?: unknown }) => Effect.Effect<never, never, Destination>

  readonly updateCurrentEntry: (options: { readonly state: unknown }) => Effect.Effect<never, never, Destination>
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

export const CurrentPath: Computed.Computed<Navigation, never, string> = Computed.fromTag(
  Navigation,
  (nav) => nav.current.map((d) => getCurrentPathFromUrl(d.url))
)

export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
  readonly info?: unknown
}

export const navigate = (url: string | URL, options?: NavigateOptions) =>
  Navigation.withEffect((n) => n.navigate(url, options))
