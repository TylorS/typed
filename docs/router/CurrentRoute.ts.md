---
title: CurrentRoute.ts
nav_order: 1
parent: "@typed/router"
---

## CurrentRoute overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CurrentParams](#currentparams)
  - [CurrentRoute](#currentroute)
  - [CurrentRoute (interface)](#currentroute-interface)
  - [CurrentSearchParams](#currentsearchparams)
  - [CurrentState](#currentstate)
  - [NavigateOptions (type alias)](#navigateoptions-type-alias)
  - [browser](#browser)
  - [decode](#decode)
  - [isActive](#isactive)
  - [layer](#layer)
  - [makeCurrentRoute](#makecurrentroute)
  - [makeHref](#makehref)
  - [navigate](#navigate)
  - [server](#server)
  - [withCurrentRoute](#withcurrentroute)

---

# utils

## CurrentParams

**Signature**

```ts
export declare const CurrentParams: Fx.RefSubject.Filtered<
  Readonly<Record<string, string | readonly string[]>>,
  never,
  Navigation.Navigation | CurrentRoute
>
```

Added in v1.0.0

## CurrentRoute

**Signature**

```ts
export declare const CurrentRoute: Context.Tagged<CurrentRoute, CurrentRoute>
```

Added in v1.0.0

## CurrentRoute (interface)

**Signature**

```ts
export interface CurrentRoute {
  readonly route: Route.Route.Any
  readonly parent: Option.Option<CurrentRoute>
}
```

Added in v1.0.0

## CurrentSearchParams

**Signature**

```ts
export declare const CurrentSearchParams: Fx.RefSubject.Computed<URLSearchParams, never, Navigation.Navigation>
```

Added in v1.0.0

## CurrentState

**Signature**

```ts
export declare const CurrentState: Fx.RefSubject.Computed<unknown, never, Navigation.Navigation>
```

Added in v1.0.0

## NavigateOptions (type alias)

**Signature**

```ts
export type NavigateOptions<R extends Route.Route.Any> =
  Route.Route.ParamsAreOptional<R> extends true
    ? [
        options?: Navigation.NavigateOptions & {
          readonly params?: Route.Route.Params<R> | undefined
        } & {
          readonly relative?: boolean
        }
      ]
    : [
        options: Navigation.NavigateOptions & {
          readonly params: Route.Route.Params<R>
        } & {
          readonly relative?: boolean
        }
      ]
```

Added in v1.0.0

## browser

**Signature**

```ts
export declare const browser: Layer.Layer<CurrentRoute, never, Document.Document>
```

Added in v1.0.0

## decode

**Signature**

```ts
export declare function decode<R extends Route.Route.Any>(
  route: R
): Fx.RefSubject.Filtered<
  Route.Route.Type<R>,
  Route.RouteDecodeError<R>,
  Navigation.Navigation | CurrentRoute | Route.Route.Context<R>
>
```

Added in v1.0.0

## isActive

**Signature**

```ts
export declare function isActive<R extends Route.Route.Any>(
  route: R,
  ...[params]: Route.Route.ParamsList<R>
): RefSubject.Computed<boolean, never, Navigation.Navigation | CurrentRoute>
export declare function isActive<R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>
): RefSubject.Computed<boolean, never, Navigation.Navigation | CurrentRoute>
```

Added in v1.0.0

## layer

**Signature**

```ts
export declare function layer<R extends Route.Route.Any>(
  route: R,
  parent: Option.Option<CurrentRoute> = Option.none()
): Layer.Layer<CurrentRoute>
```

Added in v1.0.0

## makeCurrentRoute

**Signature**

```ts
export declare function makeCurrentRoute<R extends Route.Route.Any>(
  route: R,
  parent: Option.Option<CurrentRoute> = Option.none()
): CurrentRoute
```

Added in v1.0.0

## makeHref

**Signature**

```ts
export declare function makeHref<const R extends Route.Route.Any>(
  route: R,
  ...[params]: Route.Route.ParamsList<R>
): RefSubject.Filtered<string, never, Navigation.Navigation | CurrentRoute>
export declare function makeHref<const R extends Route.Route.Any>(
  route: R,
  params: Route.Route.Params<R>
): RefSubject.Filtered<string, never, Navigation.Navigation | CurrentRoute>
```

Added in v1.0.0

## navigate

**Signature**

```ts
export declare const navigate: <R extends Route.Route.Any>(
  route: R,
  ...[options]: NavigateOptions<R>
) => Effect.Effect<
  Navigation.Destination,
  Navigation.NavigationError | Cause.NoSuchElementException,
  Navigation.Navigation | CurrentRoute
>
```

Added in v1.0.0

## server

**Signature**

```ts
export declare const server: (base?: string) => Layer.Layer<CurrentRoute>
```

Added in v1.0.0

## withCurrentRoute

**Signature**

```ts
export declare const withCurrentRoute: {
  <R extends Route.Route.Any>(
    route: R
  ): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, CurrentRoute>>
  <A, E, R, R_ extends Route.Route.Any>(
    effect: Effect.Effect<A, E, R>,
    route: R_
  ): Effect.Effect<A, E, Exclude<R, CurrentRoute>>
}
```

Added in v1.0.0
