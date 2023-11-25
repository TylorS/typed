import { Tagged } from "@typed/context"
import { RefSubject } from "@typed/fx"
import * as Computed from "@typed/fx/Computed"
import type * as Filtered from "@typed/fx/Filtered"
import type { Scope } from "effect"
import { Data, Deferred, Effect, Option } from "effect"

export interface Navigation {
  readonly current: Computed.Computed<never, never, Destination>

  readonly destinations: Computed.Computed<never, never, ReadonlyArray<Destination>>

  readonly isNavigating: Computed.Computed<never, never, boolean>

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

  readonly beforeNavigation: <R, R2>(
    handler: BeforeNavigationHandler<R, R2>
  ) => Effect.Effect<R | R2 | Scope.Scope, never, unknown>

  readonly onNavigation: <R, R2>(
    handler: NavigationHandler<R, R2>
  ) => Effect.Effect<R | R2 | Scope.Scope, never, unknown>
}

export const Navigation = Tagged<Navigation, Navigation>("@typed/navigation/Navigation")

export type NavigationHandler<R, R2> = (
  event: NavigationEvent
) => Effect.Effect<R, never, Option.Option<Effect.Effect<R2, RedirectError | CancelNavigation, void>>>

export interface NavigationEvent {
  readonly type: NavigationType
  readonly destination: Destination
  readonly info: unknown
}

export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent
) => Effect.Effect<R, never, Option.Option<Effect.Effect<R2, RedirectError | CancelNavigation, void>>>

export interface BeforeNavigationEvent {
  readonly type: NavigationType
  readonly from: Destination
  readonly to: Destination
  readonly info: unknown
}

export type NavigationType = "push" | "replace" | "reload" | "traverse"

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

export const navigate = (
  url: string | URL,
  options?: NavigateOptions
): Effect.Effect<Navigation, NavigationError, Destination> => Navigation.withEffect((n) => n.navigate(url, options))

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

export class CancelNavigation extends Data.TaggedError("CancelNavigation")<{}> {}

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

export function redirectToPath(path: string | URL, options?: NavigateOptions): RedirectError {
  return new RedirectError({ redirect: { _tag: "RedirectToPath", path, options } })
}

export function redirectToDestination(key: Destination["key"], options?: { readonly info?: unknown }): RedirectError {
  return new RedirectError({ redirect: { _tag: "RedirectToDestination", key, options } })
}

export function isRedirectError(e: unknown): e is RedirectError {
  return e instanceof RedirectError
}

export function handleRedirect({ redirect }: RedirectError): Effect.Effect<Navigation, NavigationError, Destination> {
  if (redirect._tag === "RedirectToPath") {
    return navigate(redirect.path.toString(), { history: "replace", ...redirect.options })
  } else {
    return traverseTo(redirect.key, redirect.options)
  }
}

type BlockState = Unblocked | Blocked

type Unblocked = {
  readonly _tag: "Unblocked"
}
const Unblocked: Unblocked = { _tag: "Unblocked" }

type Blocked = {
  readonly _tag: "Blocked"
  readonly currentDestination: Destination
  readonly proposedDestination: Destination
  readonly deferred: Deferred.Deferred<RedirectError | CancelNavigation, void>
}

const Blocked = (currentDestination: Destination, proposedDestination: Destination) =>
  Effect.map(
    Deferred.make<RedirectError | CancelNavigation, void>(),
    (deferred): Blocked => ({ _tag: "Blocked", deferred, currentDestination, proposedDestination })
  )

export interface BlockNavigation {
  readonly isBlocking: Computed.Computed<never, never, boolean>
  readonly unblock: Effect.Effect<never, never, boolean>
  readonly from: Filtered.Filtered<never, never, Destination>
  readonly to: Filtered.Filtered<never, never, Destination>
}

export const blockNavigation: Effect.Effect<
  Scope.Scope | Navigation,
  never,
  BlockNavigation
> = Effect.gen(function*(_) {
  const navigation = yield* _(Navigation)
  const BlockState = yield* _(RefSubject.of<BlockState>(Unblocked))

  yield* _(
    navigation.beforeNavigation<never, never>((event) =>
      BlockState.modifyEffect((state) =>
        Effect.gen(function*(_) {
          // Can't block twice
          if (state._tag === "Blocked") return [Option.none(), state] as const
          const updated = yield* _(Blocked(event.from, event.to))

          return [
            Option.some(Deferred.await(updated.deferred)),
            updated
          ] as const
        })
      )
    )
  )

  const isBlocking = BlockState.map((s) => s._tag === "Blocked")

  const unblock = BlockState.modifyEffect((state) => {
    if (state._tag === "Unblocked") return Effect.succeed([false, state] as const)

    return Deferred.succeed(state.deferred, undefined).pipe(Effect.as([true, Unblocked]))
  })

  const from = BlockState.filterMap((s) => s._tag === "Blocked" ? Option.some(s.currentDestination) : Option.none())
  const to = BlockState.filterMap((s) => s._tag === "Blocked" ? Option.some(s.proposedDestination) : Option.none())

  return {
    isBlocking,
    unblock,
    from,
    to
  } as const
})
