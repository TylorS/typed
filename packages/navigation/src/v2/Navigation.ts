import { ParseResult } from "@effect/schema"
import * as Schema from "@effect/schema/Schema"
import { Tagged } from "@typed/context"
import { RefSubject } from "@typed/fx"
import * as Computed from "@typed/fx/Computed"
import type { Uuid } from "@typed/id"
import * as IdSchema from "@typed/id/Schema"
import type { Scope } from "effect"
import { Data, Deferred, Effect, Option } from "effect"

export interface Navigation {
  readonly origin: string

  readonly base: string

  readonly currentEntry: Computed.Computed<never, never, Destination>

  readonly entries: Computed.Computed<never, never, ReadonlyArray<Destination>>

  readonly transition: Computed.Computed<never, never, Option.Option<Transition>>

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
          return Effect.fail(ParseResult.parseError([ParseResult.type(urlSchema_.ast, s, `Expected a URL`)]))
        }
      }),
    (url) => Effect.succeed(url.toString())
  )
)

export const Destination = Schema.struct({
  id: IdSchema.uuid,
  key: IdSchema.uuid,
  url: urlSchema,
  state: Schema.unknown,
  sameDocument: Schema.boolean
})

export type DestinationJson = Schema.Schema.From<typeof Destination>
export interface Destination extends Schema.Schema.To<typeof Destination> {}

export const ProposedDestination = Destination.pipe(Schema.omit("id", "key"))

export type ProposedDestinationJson = Schema.Schema.From<typeof ProposedDestination>
export interface ProposedDestination extends Schema.Schema.To<typeof ProposedDestination> {}

export const NavigationType = Schema.literal("push", "replace", "reload", "traverse")
export type NavigationType = Schema.Schema.To<typeof NavigationType>

export const Transition = Schema.struct({
  type: NavigationType,
  from: Destination,
  to: Schema.union(ProposedDestination, Destination)
})

export type TransitionJson = Schema.Schema.From<typeof Transition>
export interface Transition extends Schema.Schema.To<typeof Transition> {}

export const BeforeNavigationEvent = Schema.struct({
  type: NavigationType,
  from: Destination,
  delta: Schema.number,
  to: Schema.union(ProposedDestination, Destination),
  info: Schema.unknown
})

export type BeforeNavigationEventJson = Schema.Schema.From<typeof BeforeNavigationEvent>
export interface BeforeNavigationEvent extends Schema.Schema.To<typeof BeforeNavigationEvent> {}

export const NavigationEvent = Schema.struct({
  type: NavigationType,
  destination: Destination,
  info: Schema.unknown
})

export type NavigationEventJson = Schema.Schema.From<typeof NavigationEvent>
export interface NavigationEvent extends Schema.Schema.To<typeof NavigationEvent> {}

export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent
) => Effect.Effect<
  R,
  RedirectError | CancelNavigation,
  Option.Option<
    Effect.Effect<R2, RedirectError | CancelNavigation, unknown>
  >
>

export type NavigationHandler<R, R2> = (
  event: NavigationEvent
) => Effect.Effect<
  R,
  never,
  Option.Option<
    Effect.Effect<R2, never, unknown>
  >
>

export class NavigationError extends Data.TaggedError("NavigationError")<{ readonly error: unknown }> {}

export class RedirectError extends Data.TaggedError("RedirectError")<
  {
    readonly path: string | URL
    readonly options?: { readonly state?: unknown; readonly info?: unknown } | undefined
  }
> {}

export class CancelNavigation extends Data.TaggedError("CancelNavigation")<{}> {}

export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
  readonly info?: unknown
}

export const cancelNavigation: CancelNavigation = new CancelNavigation()

export function redirectToPath(
  path: string | URL,
  options?: { readonly state?: unknown; readonly info?: unknown }
): RedirectError {
  return new RedirectError({ path, options })
}

export function isNavigationError(e: unknown): e is NavigationError {
  return e instanceof NavigationError
}

export function isRedirectError(e: unknown): e is RedirectError {
  return e instanceof RedirectError
}

export function isCancelNavigation(e: unknown): e is CancelNavigation {
  return e instanceof CancelNavigation
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
  key: Uuid,
  options?: { readonly info?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (key, opts) =>
  Navigation.withEffect((n) => n.traverseTo(key, opts))

export const updateCurrentEntry: (
  options: { readonly state: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (opts) =>
  Navigation.withEffect((n) => n.updateCurrentEntry(opts))

export const reload: (
  options?: { readonly info?: unknown; readonly state?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination> = (
  opts
) => Navigation.withEffect((n) => n.reload(opts))

export const CurrentEntry: Computed.Computed<Navigation, never, Destination> = Computed.fromTag(
  Navigation,
  (nav) => nav.currentEntry
)

export function getCurrentPathFromUrl(location: Pick<URL, "pathname" | "search" | "hash">): string {
  return location.pathname + location.search + location.hash
}

export const CurrentPath: Computed.Computed<Navigation, never, string> = CurrentEntry.map((d) =>
  getCurrentPathFromUrl(d.url)
)

export const CurrentEntries: Computed.Computed<Navigation, never, ReadonlyArray<Destination>> = Computed.fromTag(
  Navigation,
  (n) => n.entries
)

export const CanGoForward: Computed.Computed<Navigation, never, boolean> = Computed.fromTag(
  Navigation,
  (n) => n.canGoForward
)

export const CanGoBack: Computed.Computed<Navigation, never, boolean> = Computed.fromTag(
  Navigation,
  (n) => n.canGoBack
)

export interface BlockNavigation extends Computed.Computed<never, never, Option.Option<Blocking>> {
  readonly isBlocking: Computed.Computed<never, never, boolean>
}

export interface Blocking extends BeforeNavigationEvent {
  readonly cancel: Effect.Effect<never, never, Destination>
  readonly confirm: Effect.Effect<never, never, Destination>
  readonly redirect: (urlOrPath: string | URL, options?: NavigateOptions) => Effect.Effect<never, never, Destination>
}

type InternalBlockState = Unblocked | Blocked

type Unblocked = {
  readonly _tag: "Unblocked"
}
const Unblocked: Unblocked = { _tag: "Unblocked" }

type Blocked = {
  readonly _tag: "Blocked"
  readonly event: BeforeNavigationEvent
  readonly deferred: Deferred.Deferred<RedirectError | CancelNavigation, void>
}

const Blocked = (event: BeforeNavigationEvent) =>
  Effect.map(
    Deferred.make<RedirectError | CancelNavigation, void>(),
    (deferred): Blocked => ({ _tag: "Blocked", deferred, event })
  )

export interface UseBlockNavigationParams<R = never> {
  readonly shouldBlock?: (event: BeforeNavigationEvent) => Effect.Effect<R, RedirectError | CancelNavigation, boolean>
}

export const useBlockNavigation = <R = never>(
  params: UseBlockNavigationParams<R> = {}
): Effect.Effect<Navigation | R | Scope.Scope, never, BlockNavigation> =>
  Effect.gen(function*(_) {
    const navigation = yield* _(Navigation)
    const blockState = yield* _(RefSubject.of<InternalBlockState>(Unblocked))

    yield* _(
      navigation.beforeNavigation<R, never>((event) =>
        blockState.modifyEffect((state) =>
          Effect.gen(function*(_) {
            // Can't block twice
            if (state._tag === "Blocked") return [Option.none(), state] as const

            if (params.shouldBlock && !(yield* _(params.shouldBlock(event)))) {
              return [Option.none(), state] as const
            }

            const updated = yield* _(Blocked(event))

            return [
              Option.some(Deferred.await(updated.deferred)),
              updated
            ] as const
          })
        )
      )
    )

    const blockNavigation: BlockNavigation = Object.assign(
      blockState.map((s) => s._tag === "Blocked" ? Option.some(blockedToBlocking(navigation, s)) : Option.none()),
      { isBlocking: blockState.map((s) => s._tag === "Blocked") }
    )

    return blockNavigation
  })

function blockedToBlocking(navigation: Navigation, state: Blocked): Blocking {
  return {
    ...state.event,
    cancel: Effect.zipRight(Deferred.fail(state.deferred, cancelNavigation), navigation.currentEntry),
    confirm: Effect.zipRight(Deferred.succeed(state.deferred, undefined), navigation.currentEntry),
    redirect: (url, options) =>
      Effect.zipRight(Deferred.fail(state.deferred, redirectToPath(url, options)), navigation.currentEntry)
  }
}
