/**
 * @since 1.0.0
 */

import { ParseResult } from "@effect/schema"
import * as Schema from "@effect/schema/Schema"
import { Tagged } from "@typed/context"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Uuid } from "@typed/id"
import * as IdSchema from "@typed/id/Schema"
import type { Option, Scope } from "effect"

import * as Data from "effect/Data"
import * as Effect from "effect/Effect"
/**
 * @since 1.0.0
 */
export interface Navigation {
  readonly origin: string

  readonly base: string

  readonly currentEntry: RefSubject.Computed<never, never, Destination>

  readonly entries: RefSubject.Computed<never, never, ReadonlyArray<Destination>>

  readonly transition: RefSubject.Computed<never, never, Option.Option<Transition>>

  readonly canGoBack: RefSubject.Computed<never, never, boolean>

  readonly canGoForward: RefSubject.Computed<never, never, boolean>

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
  ) => Effect.Effect<never, NavigationError, Destination>

  readonly reload: (
    options?: { readonly info?: unknown; readonly state?: unknown }
  ) => Effect.Effect<never, NavigationError, Destination>

  readonly beforeNavigation: <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>
  ) => Effect.Effect<R | R2 | Scope.Scope, never, unknown>

  readonly onNavigation: <R = never, R2 = never>(
    handler: NavigationHandler<R, R2>
  ) => Effect.Effect<R | R2 | Scope.Scope, never, unknown>
}

/**
 * @since 1.0.0
 */
export const Navigation: Tagged<Navigation> = Tagged<Navigation, Navigation>("@typed/navigation/Navigation")

const urlSchema_ = Schema.instanceOf(URL).pipe(Schema.equivalence((a, b) => a.href === b.href))

const urlSchema = Schema.string.pipe(
  Schema.transformOrFail(
    urlSchema_,
    (s) =>
      Effect.suspend(() => {
        try {
          return Effect.succeed(new URL(s))
        } catch {
          return Effect.fail(ParseResult.parseError(ParseResult.type(urlSchema_.ast, s, `Expected a URL`)))
        }
      }),
    (url) => Effect.succeed(url.toString())
  )
)

/**
 * @since 1.0.0
 */
export const Destination = Schema.struct({
  id: IdSchema.uuid,
  key: IdSchema.uuid,
  url: urlSchema,
  state: Schema.unknown,
  sameDocument: Schema.boolean
})

/**
 * @since 1.0.0
 */
export type DestinationJson = Schema.Schema.From<typeof Destination>
/**
 * @since 1.0.0
 */
export interface Destination extends Schema.Schema.To<typeof Destination> {}

/**
 * @since 1.0.0
 */
export const ProposedDestination = Destination.pipe(Schema.omit("id", "key"))

/**
 * @since 1.0.0
 */
export type ProposedDestinationJson = Schema.Schema.From<typeof ProposedDestination>
/**
 * @since 1.0.0
 */
export interface ProposedDestination extends Schema.Schema.To<typeof ProposedDestination> {}

/**
 * @since 1.0.0
 */
export const NavigationType = Schema.literal("push", "replace", "reload", "traverse")
/**
 * @since 1.0.0
 */
export type NavigationType = Schema.Schema.To<typeof NavigationType>

/**
 * @since 1.0.0
 */
export const Transition = Schema.struct({
  type: NavigationType,
  from: Destination,
  to: Schema.union(ProposedDestination, Destination)
})

/**
 * @since 1.0.0
 */
export type TransitionJson = Schema.Schema.From<typeof Transition>
/**
 * @since 1.0.0
 */
export interface Transition extends Schema.Schema.To<typeof Transition> {}

/**
 * @since 1.0.0
 */
export const BeforeNavigationEvent = Schema.struct({
  type: NavigationType,
  from: Destination,
  delta: Schema.number,
  to: Schema.union(ProposedDestination, Destination),
  info: Schema.unknown
})

/**
 * @since 1.0.0
 */
export type BeforeNavigationEventJson = Schema.Schema.From<typeof BeforeNavigationEvent>
/**
 * @since 1.0.0
 */
export interface BeforeNavigationEvent extends Schema.Schema.To<typeof BeforeNavigationEvent> {}

/**
 * @since 1.0.0
 */
export const NavigationEvent = Schema.struct({
  type: NavigationType,
  destination: Destination,
  info: Schema.unknown
})

/**
 * @since 1.0.0
 */
export type NavigationEventJson = Schema.Schema.From<typeof NavigationEvent>
/**
 * @since 1.0.0
 */
export interface NavigationEvent extends Schema.Schema.To<typeof NavigationEvent> {}

/**
 * @since 1.0.0
 */
export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent
) => Effect.Effect<
  R,
  RedirectError | CancelNavigation,
  Option.Option<
    Effect.Effect<R2, RedirectError | CancelNavigation, unknown>
  >
>

/**
 * @since 1.0.0
 */
export type NavigationHandler<R, R2> = (
  event: NavigationEvent
) => Effect.Effect<
  R,
  never,
  Option.Option<
    Effect.Effect<R2, never, unknown>
  >
>

/**
 * @since 1.0.0
 */
export class NavigationError extends Data.TaggedError("NavigationError")<{ readonly error: unknown }> {}

/**
 * @since 1.0.0
 */
export class RedirectError extends Data.TaggedError("RedirectError")<
  {
    readonly path: string | URL
    readonly options?: { readonly state?: unknown; readonly info?: unknown } | undefined
  }
> {}

/**
 * @since 1.0.0
 */
export class CancelNavigation extends Data.TaggedError("CancelNavigation")<{}> {}

/**
 * @since 1.0.0
 */
export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
  readonly info?: unknown
}

/**
 * @since 1.0.0
 */
export const cancelNavigation: CancelNavigation = new CancelNavigation()

/**
 * @since 1.0.0
 */
export function redirectToPath(
  path: string | URL,
  options?: { readonly state?: unknown; readonly info?: unknown }
): RedirectError {
  return new RedirectError({ path, options })
}

/**
 * @since 1.0.0
 */
export function isNavigationError(e: unknown): e is NavigationError {
  return e instanceof NavigationError
}

/**
 * @since 1.0.0
 */
export function isRedirectError(e: unknown): e is RedirectError {
  return e instanceof RedirectError
}

/**
 * @since 1.0.0
 */
export function isCancelNavigation(e: unknown): e is CancelNavigation {
  return e instanceof CancelNavigation
}

/**
 * @since 1.0.0
 */
export const navigate = (
  url: string | URL,
  options?: NavigateOptions
): Effect.Effect<Navigation, NavigationError, Destination> => Navigation.withEffect((n) => n.navigate(url, options))

/**
 * @since 1.0.0
 */
export const back: (options?: { readonly info?: unknown }) => Effect.Effect<Navigation, NavigationError, Destination> =
  (opts) => Navigation.withEffect((n) => n.back(opts))

/**
 * @since 1.0.0
 */
export const forward: (
  options?: { readonly info?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (
  opts
) => Navigation.withEffect((n) => n.forward(opts))

/**
 * @since 1.0.0
 */
export const traverseTo: (
  key: Uuid,
  options?: { readonly info?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (key, opts) =>
  Navigation.withEffect((n) => n.traverseTo(key, opts))

/**
 * @since 1.0.0
 */
export const updateCurrentEntry: (
  options: { readonly state: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (opts) =>
  Navigation.withEffect((n) => n.updateCurrentEntry(opts))

/**
 * @since 1.0.0
 */
export const reload: (
  options?: { readonly info?: unknown; readonly state?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (
  opts
) => Navigation.withEffect((n) => n.reload(opts))

/**
 * @since 1.0.0
 */
export const CurrentEntry: RefSubject.Computed<Navigation, never, Destination> = RefSubject.computedFromTag(
  Navigation,
  (nav) => nav.currentEntry
)

/**
 * @since 1.0.0
 */
export function getCurrentPathFromUrl(location: Pick<URL, "pathname" | "search" | "hash">): string {
  return location.pathname + location.search + location.hash
}

/**
 * @since 1.0.0
 */
export const CurrentPath: RefSubject.Computed<Navigation, never, string> = RefSubject.map(
  CurrentEntry,
  (d) => getCurrentPathFromUrl(d.url)
)

/**
 * @since 1.0.0
 */
export const CurrentEntries: RefSubject.Computed<Navigation, never, ReadonlyArray<Destination>> = RefSubject
  .computedFromTag(
    Navigation,
    (n) => n.entries
  )

/**
 * @since 1.0.0
 */
export const CanGoForward: RefSubject.Computed<Navigation, never, boolean> = RefSubject.computedFromTag(
  Navigation,
  (n) => n.canGoForward
)

/**
 * @since 1.0.0
 */
export const CanGoBack: RefSubject.Computed<Navigation, never, boolean> = RefSubject.computedFromTag(
  Navigation,
  (n) => n.canGoBack
)

/**
 * @since 1.0.0
 */
export function handleRedirect(error: RedirectError) {
  return navigate(error.path, {
    history: "replace",
    ...error.options
  })
}
