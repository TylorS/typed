---
title: Navigation.ts
nav_order: 4
parent: "@typed/navigation"
---

## Navigation overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [BeforeNavigationEvent](#beforenavigationevent)
  - [BeforeNavigationEvent (interface)](#beforenavigationevent-interface)
  - [BeforeNavigationEventJson (type alias)](#beforenavigationeventjson-type-alias)
  - [BeforeNavigationHandler (type alias)](#beforenavigationhandler-type-alias)
  - [CanGoBack](#cangoback)
  - [CanGoForward](#cangoforward)
  - [CancelNavigation (class)](#cancelnavigation-class)
  - [CurrentEntries](#currententries)
  - [CurrentEntry](#currententry)
  - [CurrentPath](#currentpath)
  - [Destination](#destination)
  - [Destination (interface)](#destination-interface)
  - [DestinationJson (type alias)](#destinationjson-type-alias)
  - [NavigateOptions (interface)](#navigateoptions-interface)
  - [Navigation](#navigation)
  - [Navigation (interface)](#navigation-interface)
  - [NavigationError (class)](#navigationerror-class)
  - [NavigationEvent](#navigationevent)
  - [NavigationEvent (interface)](#navigationevent-interface)
  - [NavigationEventJson (type alias)](#navigationeventjson-type-alias)
  - [NavigationHandler (type alias)](#navigationhandler-type-alias)
  - [NavigationType](#navigationtype)
  - [NavigationType (type alias)](#navigationtype-type-alias)
  - [ProposedDestination](#proposeddestination)
  - [ProposedDestination (interface)](#proposeddestination-interface)
  - [ProposedDestinationJson (type alias)](#proposeddestinationjson-type-alias)
  - [RedirectError (class)](#redirecterror-class)
  - [Transition](#transition)
  - [Transition (interface)](#transition-interface)
  - [TransitionJson (type alias)](#transitionjson-type-alias)
  - [back](#back)
  - [cancelNavigation](#cancelnavigation)
  - [forward](#forward)
  - [getCurrentPathFromUrl](#getcurrentpathfromurl)
  - [handleRedirect](#handleredirect)
  - [isCancelNavigation](#iscancelnavigation)
  - [isNavigationError](#isnavigationerror)
  - [isRedirectError](#isredirecterror)
  - [navigate](#navigate)
  - [redirectToPath](#redirecttopath)
  - [reload](#reload)
  - [traverseTo](#traverseto)
  - [updateCurrentEntry](#updatecurrententry)

---

# utils

## BeforeNavigationEvent

**Signature**

```ts
export declare const BeforeNavigationEvent: Schema.Schema<
  {
    readonly type: "push" | "replace" | "reload" | "traverse"
    readonly from: {
      readonly id: string
      readonly key: string
      readonly url: string
      readonly state: unknown
      readonly sameDocument: boolean
    }
    readonly to:
      | {
          readonly id: string
          readonly key: string
          readonly url: string
          readonly state: unknown
          readonly sameDocument: boolean
        }
      | { readonly url: string; readonly state: unknown; readonly sameDocument: boolean }
    readonly delta: number
    readonly info: unknown
  },
  {
    readonly type: "push" | "replace" | "reload" | "traverse"
    readonly from: {
      readonly id: Uuid
      readonly key: Uuid
      readonly url: URL
      readonly state: unknown
      readonly sameDocument: boolean
    }
    readonly to:
      | {
          readonly id: Uuid
          readonly key: Uuid
          readonly url: URL
          readonly state: unknown
          readonly sameDocument: boolean
        }
      | { readonly url: URL; readonly state: unknown; readonly sameDocument: boolean }
    readonly delta: number
    readonly info: unknown
  }
>
```

Added in v1.0.0

## BeforeNavigationEvent (interface)

**Signature**

```ts
export interface BeforeNavigationEvent extends Schema.Schema.To<typeof BeforeNavigationEvent> {}
```

Added in v1.0.0

## BeforeNavigationEventJson (type alias)

**Signature**

```ts
export type BeforeNavigationEventJson = Schema.Schema.From<typeof BeforeNavigationEvent>
```

Added in v1.0.0

## BeforeNavigationHandler (type alias)

**Signature**

```ts
export type BeforeNavigationHandler<R, R2> = (
  event: BeforeNavigationEvent
) => Effect.Effect<
  R,
  RedirectError | CancelNavigation,
  Option.Option<Effect.Effect<R2, RedirectError | CancelNavigation, unknown>>
>
```

Added in v1.0.0

## CanGoBack

**Signature**

```ts
export declare const CanGoBack: Computed.Computed<Navigation, never, boolean>
```

Added in v1.0.0

## CanGoForward

**Signature**

```ts
export declare const CanGoForward: Computed.Computed<Navigation, never, boolean>
```

Added in v1.0.0

## CancelNavigation (class)

**Signature**

```ts
export declare class CancelNavigation
```

Added in v1.0.0

## CurrentEntries

**Signature**

```ts
export declare const CurrentEntries: Computed.Computed<Navigation, never, readonly Destination[]>
```

Added in v1.0.0

## CurrentEntry

**Signature**

```ts
export declare const CurrentEntry: Computed.Computed<Navigation, never, Destination>
```

Added in v1.0.0

## CurrentPath

**Signature**

```ts
export declare const CurrentPath: Computed.Computed<Navigation, never, string>
```

Added in v1.0.0

## Destination

**Signature**

```ts
export declare const Destination: Schema.Schema<
  {
    readonly id: string
    readonly key: string
    readonly url: string
    readonly state: unknown
    readonly sameDocument: boolean
  },
  { readonly id: Uuid; readonly key: Uuid; readonly url: URL; readonly state: unknown; readonly sameDocument: boolean }
>
```

Added in v1.0.0

## Destination (interface)

**Signature**

```ts
export interface Destination extends Schema.Schema.To<typeof Destination> {}
```

Added in v1.0.0

## DestinationJson (type alias)

**Signature**

```ts
export type DestinationJson = Schema.Schema.From<typeof Destination>
```

Added in v1.0.0

## NavigateOptions (interface)

**Signature**

```ts
export interface NavigateOptions {
  readonly history?: "replace" | "push" | "auto"
  readonly state?: unknown
  readonly info?: unknown
}
```

Added in v1.0.0

## Navigation

**Signature**

```ts
export declare const Navigation: Tagged<Navigation, Navigation>
```

Added in v1.0.0

## Navigation (interface)

**Signature**

```ts
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

  readonly updateCurrentEntry: (options: {
    readonly state: unknown
  }) => Effect.Effect<never, NavigationError, Destination>

  readonly reload: (options?: {
    readonly info?: unknown
    readonly state?: unknown
  }) => Effect.Effect<never, NavigationError, Destination>

  readonly beforeNavigation: <R = never, R2 = never>(
    handler: BeforeNavigationHandler<R, R2>
  ) => Effect.Effect<R | R2 | Scope.Scope, never, unknown>

  readonly onNavigation: <R = never, R2 = never>(
    handler: NavigationHandler<R, R2>
  ) => Effect.Effect<R | R2 | Scope.Scope, never, unknown>
}
```

Added in v1.0.0

## NavigationError (class)

**Signature**

```ts
export declare class NavigationError
```

Added in v1.0.0

## NavigationEvent

**Signature**

```ts
export declare const NavigationEvent: Schema.Schema<
  {
    readonly type: "push" | "replace" | "reload" | "traverse"
    readonly info: unknown
    readonly destination: {
      readonly id: string
      readonly key: string
      readonly url: string
      readonly state: unknown
      readonly sameDocument: boolean
    }
  },
  {
    readonly type: "push" | "replace" | "reload" | "traverse"
    readonly info: unknown
    readonly destination: {
      readonly id: Uuid
      readonly key: Uuid
      readonly url: URL
      readonly state: unknown
      readonly sameDocument: boolean
    }
  }
>
```

Added in v1.0.0

## NavigationEvent (interface)

**Signature**

```ts
export interface NavigationEvent extends Schema.Schema.To<typeof NavigationEvent> {}
```

Added in v1.0.0

## NavigationEventJson (type alias)

**Signature**

```ts
export type NavigationEventJson = Schema.Schema.From<typeof NavigationEvent>
```

Added in v1.0.0

## NavigationHandler (type alias)

**Signature**

```ts
export type NavigationHandler<R, R2> = (
  event: NavigationEvent
) => Effect.Effect<R, never, Option.Option<Effect.Effect<R2, never, unknown>>>
```

Added in v1.0.0

## NavigationType

**Signature**

```ts
export declare const NavigationType: Schema.Schema<
  "push" | "replace" | "reload" | "traverse",
  "push" | "replace" | "reload" | "traverse"
>
```

Added in v1.0.0

## NavigationType (type alias)

**Signature**

```ts
export type NavigationType = Schema.Schema.To<typeof NavigationType>
```

Added in v1.0.0

## ProposedDestination

**Signature**

```ts
export declare const ProposedDestination: Schema.Schema<
  { readonly url: string; readonly state: unknown; readonly sameDocument: boolean },
  { readonly url: URL; readonly state: unknown; readonly sameDocument: boolean }
>
```

Added in v1.0.0

## ProposedDestination (interface)

**Signature**

```ts
export interface ProposedDestination extends Schema.Schema.To<typeof ProposedDestination> {}
```

Added in v1.0.0

## ProposedDestinationJson (type alias)

**Signature**

```ts
export type ProposedDestinationJson = Schema.Schema.From<typeof ProposedDestination>
```

Added in v1.0.0

## RedirectError (class)

**Signature**

```ts
export declare class RedirectError
```

Added in v1.0.0

## Transition

**Signature**

```ts
export declare const Transition: Schema.Schema<
  {
    readonly type: "push" | "replace" | "reload" | "traverse"
    readonly from: {
      readonly id: string
      readonly key: string
      readonly url: string
      readonly state: unknown
      readonly sameDocument: boolean
    }
    readonly to:
      | {
          readonly id: string
          readonly key: string
          readonly url: string
          readonly state: unknown
          readonly sameDocument: boolean
        }
      | { readonly url: string; readonly state: unknown; readonly sameDocument: boolean }
  },
  {
    readonly type: "push" | "replace" | "reload" | "traverse"
    readonly from: {
      readonly id: Uuid
      readonly key: Uuid
      readonly url: URL
      readonly state: unknown
      readonly sameDocument: boolean
    }
    readonly to:
      | {
          readonly id: Uuid
          readonly key: Uuid
          readonly url: URL
          readonly state: unknown
          readonly sameDocument: boolean
        }
      | { readonly url: URL; readonly state: unknown; readonly sameDocument: boolean }
  }
>
```

Added in v1.0.0

## Transition (interface)

**Signature**

```ts
export interface Transition extends Schema.Schema.To<typeof Transition> {}
```

Added in v1.0.0

## TransitionJson (type alias)

**Signature**

```ts
export type TransitionJson = Schema.Schema.From<typeof Transition>
```

Added in v1.0.0

## back

**Signature**

```ts
export declare const back: (options?: {
  readonly info?: unknown
}) => Effect.Effect<Navigation, NavigationError, Destination>
```

Added in v1.0.0

## cancelNavigation

**Signature**

```ts
export declare const cancelNavigation: CancelNavigation
```

Added in v1.0.0

## forward

**Signature**

```ts
export declare const forward: (options?: {
  readonly info?: unknown
}) => Effect.Effect<Navigation, NavigationError, Destination>
```

Added in v1.0.0

## getCurrentPathFromUrl

**Signature**

```ts
export declare function getCurrentPathFromUrl(location: Pick<URL, "pathname" | "search" | "hash">): string
```

Added in v1.0.0

## handleRedirect

**Signature**

```ts
export declare function handleRedirect(error: RedirectError)
```

Added in v1.0.0

## isCancelNavigation

**Signature**

```ts
export declare function isCancelNavigation(e: unknown): e is CancelNavigation
```

Added in v1.0.0

## isNavigationError

**Signature**

```ts
export declare function isNavigationError(e: unknown): e is NavigationError
```

Added in v1.0.0

## isRedirectError

**Signature**

```ts
export declare function isRedirectError(e: unknown): e is RedirectError
```

Added in v1.0.0

## navigate

**Signature**

```ts
export declare const navigate: (
  url: string | URL,
  options?: NavigateOptions
) => Effect.Effect<Navigation, NavigationError, Destination>
```

Added in v1.0.0

## redirectToPath

**Signature**

```ts
export declare function redirectToPath(
  path: string | URL,
  options?: { readonly state?: unknown; readonly info?: unknown }
): RedirectError
```

Added in v1.0.0

## reload

**Signature**

```ts
export declare const reload: (options?: {
  readonly info?: unknown
  readonly state?: unknown
}) => Effect.Effect<Navigation, NavigationError, Destination>
```

Added in v1.0.0

## traverseTo

**Signature**

```ts
export declare const traverseTo: (
  key: Uuid,
  options?: { readonly info?: unknown }
) => Effect.Effect<Navigation, NavigationError, Destination>
```

Added in v1.0.0

## updateCurrentEntry

**Signature**

```ts
export declare const updateCurrentEntry: (options: {
  readonly state: unknown
}) => Effect.Effect<Navigation, NavigationError, Destination>
```

Added in v1.0.0
