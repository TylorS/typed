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
  - [RouteMatcher (interface)](#routematcher-interface)
  - [empty](#empty)
  - [{](#)

---

# utils

## RouteMatcher (interface)

**Signature**

```ts
export interface RouteMatcher<R, E, A> {
  readonly match: {
    <const P extends string, R2, E2, B>(
      route: Route.Route<P> | P,
      f: (ref: RefSubject.RefSubject<never, never, Path.ParamsOf<P>>) => Fx.Fx<R2, E2, B>
    ): RouteMatcher<R | Exclude<R2, Scope.Scope>, E | E2, A | B>

    <const P extends string, R2, E2, B, R3, E3, C>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
      f: (ref: RefSubject.RefSubject<never, never, B>) => Fx.Fx<R3, E3, C>
    ): RouteMatcher<R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>, E | E2 | E3, A | C>
  }

  readonly to: {
    <const P extends string, B>(
      route: Route.Route<P> | P,
      f: (params: Path.ParamsOf<P>) => B
    ): RouteMatcher<R, E, A | B>

    <const P extends string, R2, E2, B, R3, E3, C>(
      route: Route.Route<P> | P,
      guard: Guard.Guard<Path.ParamsOf<P>, R2, E2, B>,
      f: (b: B) => C
    ): RouteMatcher<R | Exclude<R2, Scope.Scope> | Exclude<R3, Scope.Scope>, E | E2 | E3, A | C>
  }

  readonly notFound: <R2, E2, B>(
    f: (destination: typeof Navigation.CurrentEntry) => Fx.Fx<R2, E2, B>
  ) => Fx.Fx<
    Navigation.Navigation | CurrentEnvironment | R | Exclude<R2, Scope.Scope>,
    Exclude<E | E2, Navigation.RedirectError>,
    A | B
  >

  readonly redirect: <const P extends string>(
    route: Route.Route<P> | P,
    ...[params]: [keyof Path.ParamsOf<P>] extends [never] ? [{}?] : [Path.ParamsOf<P>]
  ) => Fx.Fx<Navigation.Navigation | CurrentRoute | CurrentEnvironment | R, Exclude<E, Navigation.RedirectError>, A>
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
