import * as Brand from '@effect/data/Brand'
import { Option } from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

export interface Navigation {
  /**
   * Base path for all navigation entries.
   */
  readonly base: string

  /**
   * The list of navigation entries that are currently kept in-memory and
   * saved within Local/Session Storage.
   */
  readonly entries: Fx.Computed<never, never, readonly Destination[]>

  /**
   * The currently focused navigation entry.
   */
  readonly currentEntry: Fx.Computed<never, never, Destination>

  /**
   * Navigate to a new URL. NavigateOptions can be used to control how the
   * navigation is handled via history.pushState or history.replaceState,
   * set/update the state of the navigation entry, or provide a key to use
   * for the navigation entry.
   */
  readonly navigate: (
    url: string,
    options?: NavigateOptions,
  ) => Effect.Effect<never, never, Destination>

  /**
   * Subscribe to navigation events. Any handler can cancel the or redirect
   * the navigation by failing with a CancelNavigation or RedirectNavigation
   * error.
   */
  readonly onNavigation: <R>(
    handler: (event: NavigationEvent) => Effect.Effect<R, NavigationError, void>,
    options?: OnNavigationOptions,
  ) => Effect.Effect<R | Scope.Scope, never, void>

  /**
   * Returns true if there is a previous navigation entry to navigate to.
   */
  readonly canGoBack: Fx.Computed<never, never, boolean>

  /**
   * Navigate to the previous navigation entry. If you're on the first entry
   * then this will do nothing.
   */
  readonly back: Effect.Effect<never, never, Destination>

  /**
   * Returns true if there is a next navigation entry to navigate to after you have gone back.
   */
  readonly canGoForward: Fx.Computed<never, never, boolean>

  /**
   * Navigate to the next navigation entry. If you're on the last entry then
   * this will do nothing.
   */
  readonly forward: Effect.Effect<never, never, Destination>

  /**
   * Reload the current navigation entry.
   */
  readonly reload: Effect.Effect<never, never, Destination>

  /**
   * Navigate to a specific navigation entry by key. If the key does not
   * exist then this will do nothing visible to the user and return Option.none().
   */
  readonly goTo: (key: DestinationKey) => Effect.Effect<never, never, Option<Destination>>
}

export const Navigation = Context.Tag<Navigation>('Navigation')

export const navigate = (url: string, options?: NavigateOptions) =>
  Navigation.withEffect((n) => n.navigate(url, options))

export const onNavigation = <R>(
  handler: (event: NavigationEvent) => Effect.Effect<R, never, void>,
) => Navigation.withEffect((n) => n.onNavigation(handler))

export const canGoBack: Effect.Effect<Navigation, Cause.NoSuchElementException, boolean> &
  Fx.Fx<Navigation, never, boolean> = Object.assign(
  Navigation.withEffect((n) => n.canGoBack),
  Navigation.withFx((n) => n.canGoBack),
)

export const back = Navigation.withEffect((n) => n.back)

export const canGoForward: Effect.Effect<Navigation, Cause.NoSuchElementException, boolean> &
  Fx.Fx<Navigation, never, boolean> = Object.assign(
  Navigation.withEffect((n) => n.canGoForward),
  Navigation.withFx((n) => n.canGoForward),
)

export const forward = Navigation.withEffect((n) => n.forward)

export const reload = Navigation.withEffect((n) => n.reload)

export interface NavigateOptions {
  // State to save to history
  readonly state?: unknown
  // History type
  readonly history?: 'push' | 'replace'
  // Key to use for Navigation entry
  readonly key?: string
}

export interface NavigationEvent {
  readonly destination: Destination
  readonly hashChange: boolean
  readonly navigationType: NavigationType
}

export function NavigationEvent(
  destination: Destination,
  hashChange: boolean,
  navigationType: NavigationType,
): NavigationEvent {
  return { destination, hashChange, navigationType }
}

export interface Destination {
  readonly key: DestinationKey
  readonly url: URL
  readonly state: unknown
}

export type DestinationKey = string & Brand.Brand<'DestinationKey'>
export const DestinationKey = Brand.nominal<DestinationKey>()

export function Destination(key: DestinationKey, url: URL, state?: unknown): Destination {
  return { key, url, state }
}

export enum NavigationType {
  Push = 'push',
  Reload = 'reload',
  Replace = 'replace',
  Back = 'back',
  Forward = 'forward',
}

export type NavigationError = CancelNavigation | RedirectNavigation

export interface CancelNavigation {
  readonly _tag: 'CancelNavigation'
}

export const cancelNavigation = Effect.fail<CancelNavigation>({ _tag: 'CancelNavigation' })

export function isCancelNavigation(error: NavigationError): error is CancelNavigation {
  return error._tag === 'CancelNavigation'
}

export interface RedirectNavigation extends NavigateOptions {
  readonly _tag: 'RedirectNavigation'
  readonly url: string
}

export const redirect = (
  url: string,
  options: NavigateOptions = {},
): Effect.Effect<never, RedirectNavigation, never> =>
  Effect.fail({ _tag: 'RedirectNavigation', url, ...options })

export function isRedirectNavigation(error: NavigationError): error is RedirectNavigation {
  return error._tag === 'RedirectNavigation'
}

export interface OnNavigationOptions {
  readonly passive?: boolean
}

export const getCurrentUrl: Effect.Effect<Navigation, Cause.NoSuchElementException, URL> =
  Navigation.withEffect((n) => n.currentEntry.map((d) => d.url))
