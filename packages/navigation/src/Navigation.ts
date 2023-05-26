import { Option } from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

export interface Navigation {
  readonly entries: Fx.Computed<never, never, readonly Destination[]>

  readonly currentEntry: Fx.Computed<never, never, Destination>

  readonly navigate: (
    url: string,
    options?: NavigateOptions,
  ) => Effect.Effect<never, never, Destination>

  readonly onNavigation: <R>(
    handler: (event: NavigationEvent) => Effect.Effect<R, NavigationError, void>,
  ) => Effect.Effect<R | Scope.Scope, never, void>

  readonly canGoBack: Fx.Computed<never, never, boolean>

  readonly back: Effect.Effect<never, never, Destination>

  readonly canGoForward: Fx.Computed<never, never, boolean>

  readonly forward: Effect.Effect<never, never, Destination>

  readonly reload: Effect.Effect<never, never, Destination>

  readonly goTo: (key: string) => Effect.Effect<never, never, Option<Destination>>
}

export const Navigation = Context.Tag<Navigation>('Navigation')

export const navigate = (url: string, options?: NavigateOptions) =>
  Navigation.with((n) => n.navigate(url, options))

export const onNavigation = <R>(
  handler: (event: NavigationEvent) => Effect.Effect<R, never, void>,
) => Navigation.withEffect((n) => n.onNavigation(handler))

export const canGoBack = Object.assign(
  Navigation.withEffect((n) => n.canGoBack),
  Navigation.withFx((n) => n.canGoBack),
)

export const back = Navigation.withEffect((n) => n.back)

export const canGoForward = Object.assign(
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
  readonly key: string
  readonly url: URL
  readonly state: unknown
}

export function Destination(key: string, url: URL, state?: unknown): Destination {
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
