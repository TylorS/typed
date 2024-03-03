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
  - [RouteGuard (interface)](#routeguard-interface)
  - [RouteMatcher (interface)](#routematcher-interface)
  - [empty](#empty)
  - [{](#)

---

# utils

## RouteGuard (interface)

**Signature**

```ts
export interface RouteGuard<P extends string, A, O, E = never, R = never, E2 = never, R2 = never> {
  readonly route: Route.Route<P>
  readonly guard: Guard.Guard<string, A, E, R>
  readonly match: (ref: RefSubject.RefSubject<A>) => Fx.Fx<O, E2, R2>
}
```

Added in v1.0.0

## RouteMatcher (interface)

**Signature**

```ts
export interface RouteMatcher<out A, out E, out R> {
  readonly guards: ReadonlyArray<RouteGuard<string, any, A, E, R, E, R>>

  readonly match: {
    <const P extends string, B, E2, R2>(
      route: Route.Route<P> | P,
      f: (ref: RefSubject.RefSubject<Path.ParamsOf<P>>) => Fx.Fx<B, E2, R2>
    ): RouteMatcher<A | B, E | E2, R | Exclude<R2, Scope.Scope>>

    <const P extends string, B, E2, R2, C, E3, R3>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, B, E2, R2>,
      f: (ref: RefSubject.RefSubject<B>) => Fx.Fx<C, E3, R3>
    ): RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>>
  }

  readonly to: {
    <const P extends string, B>(
      route: Route.Route<P> | P,
      f: (params: Path.ParamsOf<P>) => B
    ): RouteMatcher<A | B, E, R>

    <const P extends string, B, E2, R2, C, E3, R3>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, B, E2, R2>,
      f: (b: B) => C
    ): RouteMatcher<A | C, E | E2 | E3, R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>>
  }

  readonly notFound: <B, E2, R2>(
    f: (destination: typeof Navigation.CurrentEntry) => Fx.Fx<B, E2, R2>
  ) => Fx.Fx<
    A | B,
    Exclude<E | E2, Navigation.RedirectError>,
    Navigation.Navigation | CurrentEnvironment | R | R2 | Scope.Scope
  >

  readonly redirect: <const P extends string>(
    route: Route.Route<P> | P,
    ...params: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
  ) => Fx.Fx<
    A,
    Exclude<E, Navigation.RedirectError>,
    Navigation.Navigation | CurrentRoute | CurrentEnvironment | R | Scope.Scope
  >
}
```

Added in v1.0.0

## empty

**Signature**

```ts
export declare function empty(): RouteMatcher<never, never, never>
```

Added in v1.0.0

## {

/\*\*

- @since 1.0.0
  \*/
  match,
  /\*\*
- @since 1.0.0
  \*/
  to
  }

**Signature**

```ts
export declare const {
  /**
   * @since 1.0.0
   */
  match,
  /**
   * @since 1.0.0
   */
  to
}: any
```

Added in v1.18.0
