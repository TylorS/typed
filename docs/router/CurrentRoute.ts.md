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
  - [browser](#browser)
  - [isActive](#isactive)
  - [layer](#layer)
  - [make](#make)
  - [makeHref](#makehref)
  - [server](#server)
  - [withCurrentRoute](#withcurrentroute)

---

# utils

## CurrentParams

**Signature**

```ts
export declare const CurrentParams: RefSubject.Filtered<
  CurrentRoute<string> | Navigation,
  never,
  Readonly<Record<string, string>>
>
```

Added in v1.0.0

## CurrentRoute

**Signature**

```ts
export declare const CurrentRoute: Context.Tagged<CurrentRoute<string>, CurrentRoute<string>>
```

Added in v1.0.0

## CurrentRoute (interface)

**Signature**

```ts
export interface CurrentRoute<P extends string = string> {
  readonly route: Route.Route<P>
  readonly parent: Option.Option<CurrentRoute>
}
```

Added in v1.0.0

## CurrentSearchParams

**Signature**

```ts
export declare const CurrentSearchParams: RefSubject.Computed<Navigation, never, Readonly<Record<string, string>>>
```

Added in v1.0.0

## CurrentState

**Signature**

```ts
export declare const CurrentState: RefSubject.Computed<Navigation, never, unknown>
```

Added in v1.0.0

## browser

**Signature**

```ts
export declare const browser: Layer.Layer<Document.Document, never, CurrentRoute<string>>
```

Added in v1.0.0

## isActive

**Signature**

```ts
export declare function isActive<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...params: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): RefSubject.Computed<Navigation | CurrentRoute, never, boolean>
```

Added in v1.0.0

## layer

**Signature**

```ts
export declare function layer<const P extends string>(
  route: P | Route.Route<P>,
  parent: Option.Option<CurrentRoute> = Option.none()
): Layer.Layer<never, never, CurrentRoute>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<const P extends string>(
  route: P | Route.Route<P>,
  parent: Option.Option<CurrentRoute> = Option.none()
): CurrentRoute<P>
```

Added in v1.0.0

## makeHref

**Signature**

```ts
export declare function makeHref<const P extends string>(
  pathOrRoute: Route.Route<P> | P,
  ...params: [keyof ParamsOf<P>] extends [never] ? [{}?] : [ParamsOf<P>]
): RefSubject.Filtered<Navigation | CurrentRoute, never, string>
```

Added in v1.0.0

## server

**Signature**

```ts
export declare const server: (base?: string) => Layer.Layer<never, never, CurrentRoute>
```

Added in v1.0.0

## withCurrentRoute

**Signature**

```ts
export declare const withCurrentRoute: {
  <P extends string>(
    route: Route.Route<P>
  ): <R, E, A>(effect: Effect.Effect<R, E, A>) => Effect.Effect<Exclude<R, CurrentRoute<string>>, E, A>
  <R, E, A, P extends string>(
    effect: Effect.Effect<R, E, A>,
    route: Route.Route<P>
  ): Effect.Effect<Exclude<R, CurrentRoute<string>>, E, A>
}
```

Added in v1.0.0
