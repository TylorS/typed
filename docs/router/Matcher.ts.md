---
title: Matcher.ts
nav_order: 3
parent: "@typed/router"
---

## Matcher overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [RedirectRouteMatchError (class)](#redirectroutematcherror-class)
  - [RouteMatcher (interface)](#routematcher-interface)
  - [RouteMatcher (namespace)](#routematcher-namespace)
    - [Any (type alias)](#any-type-alias)
    - [Context (type alias)](#context-type-alias)
  - [RouteMatcherTypeId](#routematchertypeid)
  - [RouteMatcherTypeId (type alias)](#routematchertypeid-type-alias)
  - [catchRedirectError](#catchredirecterror)
  - [effect](#effect)
  - [empty](#empty)
  - [isRouteMatcher](#isroutematcher)
  - [make](#make)
  - [match](#match)
  - [notFound](#notfound)
  - [notFoundWith](#notfoundwith)
  - [redirectTo](#redirectto)
  - [redirectWith](#redirectwith)
  - [switch](#switch)
  - [to](#to)

---

# utils

## RedirectRouteMatchError (class)

**Signature**

```ts
export declare class RedirectRouteMatchError<R> { constructor(readonly route: R, readonly params: Route.Route.Params<R>) }
```

Added in v1.0.0

## RouteMatcher (interface)

**Signature**

```ts
export interface RouteMatcher<Matches extends RouteMatch.RouteMatch.Any> extends Pipeable {
  readonly [RouteMatcherTypeId]: RouteMatcherTypeId

  readonly matches: ReadonlyArray<Matches>

  readonly add: <I extends RouteMatch.RouteMatch.Any>(match: I) => RouteMatcher<Matches | I>

  readonly match: <I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: RefSubject.RefSubject<MatchInput.Success<I>>) => Fx.Fx<A, E, R>
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
        MatchInput.Route<I>,
        MatchInput.Success<I>,
        MatchInput.Error<I>,
        MatchInput.Context<I>,
        A,
        E,
        R
      >
  >

  readonly switch: <I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: MatchInput.Success<I>) => Fx.Fx<A, E, R>
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
        MatchInput.Route<I>,
        MatchInput.Success<I>,
        MatchInput.Error<I>,
        MatchInput.Context<I>,
        A,
        E,
        R | Scope.Scope
      >
  >

  readonly effect: <I extends MatchInput.Any, A, E, R>(
    input: I,
    match: (ref: MatchInput.Success<I>) => Effect.Effect<A, E, R>
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
        MatchInput.Route<I>,
        MatchInput.Success<I>,
        MatchInput.Error<I>,
        MatchInput.Context<I>,
        A,
        E,
        R | Scope.Scope
      >
  >

  readonly to: <I extends MatchInput.Any, B>(
    input: I,
    f: (value: MatchInput.Success<I>) => B
  ) => RouteMatcher<
    | Matches
    | RouteMatch.RouteMatch<
        MatchInput.Route<I>,
        MatchInput.Success<I>,
        MatchInput.Error<I>,
        MatchInput.Context<I>,
        B,
        never,
        Scope.Scope
      >
  >
}
```

Added in v1.0.0

## RouteMatcher (namespace)

Added in v1.0.0

### Any (type alias)

**Signature**

```ts
export type Any = RouteMatcher<RouteMatch.RouteMatch.Any>
```

Added in v1.0.0

### Context (type alias)

**Signature**

```ts
export type Context<T> = T extends RouteMatcher<infer Matches> ? RouteMatch.RouteMatch.Context<Matches> : never
```

Added in v1.0.0

## RouteMatcherTypeId

**Signature**

```ts
export declare const RouteMatcherTypeId: typeof RouteMatcherTypeId
```

Added in v1.0.0

## RouteMatcherTypeId (type alias)

**Signature**

```ts
export type RouteMatcherTypeId = typeof RouteMatcherTypeId
```

Added in v1.0.0

## catchRedirectError

**Signature**

```ts
export declare const catchRedirectError: <A, E, R>(
  fx: Fx.Fx<A, E | RedirectError, R>
) => Fx.Fx<A, Exclude<E, RedirectError>, R | Scope.Scope | Navigation>
```

Added in v1.0.0

## effect

**Signature**

```ts
export declare const effect: <I, A, E, R>(
  input: I,
  match: (ref: MatchInput.Success<I>) => Effect.Effect<A, E, R>
) => RouteMatcher<
  | never
  | RouteMatch.RouteMatch<
      MatchInput.Route<I>,
      MatchInput.Success<I>,
      MatchInput.Error<I>,
      MatchInput.Context<I>,
      A,
      E,
      R | Scope.Scope
    >
>
```

Added in v1.0.0

## empty

**Signature**

```ts
export declare const empty: RouteMatcher<never>
```

Added in v1.0.0

## isRouteMatcher

**Signature**

```ts
export declare function isRouteMatcher<M extends RouteMatch.RouteMatch.Any = RouteMatch.RouteMatch.Any>(
  value: unknown
): value is RouteMatcher<M>
```

Added in v1.0.0

## make

**Signature**

```ts
export declare function make<Matches extends RouteMatch.RouteMatch.Any>(
  matches: ReadonlyArray<Matches>
): RouteMatcher<Matches>
```

Added in v1.0.0

## match

**Signature**

```ts
export declare const match: <I, A, E, R>(
  input: I,
  match: (ref: RefSubject.RefSubject<MatchInput.Success<I>, never, never>) => Fx.Fx<A, E, R>
) => RouteMatcher<
  | never
  | RouteMatch.RouteMatch<
      MatchInput.Route<I>,
      MatchInput.Success<I>,
      MatchInput.Error<I>,
      MatchInput.Context<I>,
      A,
      E,
      R
    >
>
```

Added in v1.0.0

## notFound

**Signature**

```ts
export declare const notFound: {
  <A, E, R>(
    onNotFound: Fx.Fx<A, E, R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(
    router: RouteMatcher<Matches>
  ) => Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | R | RouteMatch.RouteMatch.Context<Matches>
  >
  <Matches extends RouteMatch.RouteMatch.Any, A, E, R>(
    router: RouteMatcher<Matches>,
    onNotFound: Fx.Fx<A, E, R>
  ): Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | R | RouteMatch.RouteMatch.Context<Matches>
  >
}
```

Added in v1.0.0

## notFoundWith

**Signature**

```ts
export declare const notFoundWith: {
  <A, E, R>(
    onNotFound: Effect.Effect<A, E, R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(
    router: RouteMatcher<Matches>
  ) => Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    R | Navigation | RouteMatch.RouteMatch.Context<Matches> | Scope.Scope
  >
  <Matches extends RouteMatch.RouteMatch.Any, A, E, R>(
    router: RouteMatcher<Matches>,
    onNotFound: Effect.Effect<A, E, R>
  ): Fx.Fx<
    A | RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    R | Navigation | RouteMatch.RouteMatch.Context<Matches> | Scope.Scope
  >
}
```

Added in v1.0.0

## redirectTo

**Signature**

```ts
export declare const redirectTo: {
  <R extends Route.Route.Any>(
    route: R,
    ...params: Route.Route.ParamsList<R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(
    router: RouteMatcher<Matches>
  ) => Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    RedirectRouteMatchError<R> | Exclude<RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | CurrentRoute | RouteMatch.RouteMatch.Context<Matches>
  >
  <Matches extends RouteMatch.RouteMatch.Any, R extends Route.Route.Any>(
    router: RouteMatcher<Matches>,
    route: R,
    ...params: Route.Route.ParamsList<R>
  ): Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    RedirectRouteMatchError<R> | Exclude<RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Scope.Scope | Navigation | CurrentRoute | RouteMatch.RouteMatch.Context<Matches>
  >
}
```

Added in v1.0.0

## redirectWith

**Signature**

```ts
export declare const redirectWith: {
  <E, R>(
    effect: Effect.Effect<string, E, R>
  ): <Matches extends RouteMatch.RouteMatch.Any>(
    router: RouteMatcher<Matches>
  ) => Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Navigation | Scope.Scope | R | RouteMatch.RouteMatch.Context<Matches>
  >
  <Matches extends RouteMatch.RouteMatch.Any, E, R>(
    router: RouteMatcher<Matches>,
    effect: Effect.Effect<string, E, R>
  ): Fx.Fx<
    RouteMatch.RouteMatch.Success<Matches>,
    Exclude<E | RouteMatch.RouteMatch.Error<Matches>, RedirectError>,
    Navigation | Scope.Scope | R | RouteMatch.RouteMatch.Context<Matches>
  >
}
```

Added in v1.0.0

## switch

**Signature**

```ts
export declare const switch: <I, A, E, R>(input: I, match: (ref: MatchInput.Success<I>) => Fx.Fx<A, E, R>) => RouteMatcher<never | RouteMatch.RouteMatch<MatchInput.Route<I>, MatchInput.Success<I>, MatchInput.Error<I>, MatchInput.Context<I>, A, E, R | Scope.Scope>>
```

Added in v1.0.0

## to

**Signature**

```ts
export declare const to: <I, B>(
  input: I,
  f: (value: MatchInput.Success<I>) => B
) => RouteMatcher<
  | never
  | RouteMatch.RouteMatch<
      MatchInput.Route<I>,
      MatchInput.Success<I>,
      MatchInput.Error<I>,
      MatchInput.Context<I>,
      B,
      never,
      Scope.Scope
    >
>
```

Added in v1.0.0
