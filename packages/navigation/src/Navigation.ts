import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Context from '@typed/context'
import * as Error from '@typed/error'
import * as Fx from '@typed/fx'

// TODO: Enable Scroll restoration
// TODO: Support storing entries in Storage
// TODO: Support redirects ??
//

export interface Navigation {
  // TODO: Convert this to a list of entries
  readonly entries: Fx.Computed<never, never, string>

  readonly navigate: (
    url: string,
    options?: NavigateOptions,
  ) => Effect.Effect<never, NavigationError, Destination>

  readonly onNavigation: <R>(
    handler: (event: NavigationEvent) => Effect.Effect<R, never, void>,
  ) => Effect.Effect<R | Scope.Scope, never, void>

  readonly canGoBack: Fx.Computed<never, never, boolean>

  readonly back: Effect.Effect<never, NavigationError, Destination>

  readonly canGoForward: Fx.Computed<never, never, boolean>

  readonly forward: Effect.Effect<never, NavigationError, Destination>

  readonly reload: Effect.Effect<never, never, void>
}

export const Navigation = Context.Tag<Navigation>('Navigation')

export const navigate = (url: string, options?: NavigateOptions) =>
  Navigation.with((n) => n.navigate(url, options))

export const onNavigation = <R>(
  handler: (event: NavigationEvent) => Effect.Effect<R, never, void>,
) => Navigation.with((n) => n.onNavigation(handler))

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
  readonly state?: unknown
  readonly history?: 'push' | 'replace'
}

export class NavigationError extends Error.tagged('NavigationError') {
  constructor(readonly destination: Destination) {
    super(`Failed to navigate to ${destination.url}`)
  }
}

export interface NavigationEvent {
  readonly destination: Destination
  readonly hashChange: boolean
  readonly navigationType: NavigationType
}

export interface Destination {
  readonly key: string
  readonly url: string
  readonly state: unknown
}

export enum NavigationType {
  Push = 'push',
  Reload = 'reload',
  Replace = 'replace',
}
