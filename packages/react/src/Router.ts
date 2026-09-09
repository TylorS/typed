import { createElement, useMemo, type ComponentType, type ReactNode } from "react";
import { Navigation, CurrentPath } from "@typed/navigation/Navigation";
import type { Destination } from "@typed/navigation/model";
import { CurrentRoute, type CurrentRouteTree } from "@typed/router/CurrentRoute";
import { Fx, type RefSubject } from "@typed/fx";
import * as Context from "effect/Context";
import * as Option from "effect/Option";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import type { Router } from "@typed/router/Router";
import type * as Scope from "effect/Scope";
import { useFx, type AsyncState, type ReactiveOptions } from "./Hooks.js";
import { view, type ViewOptions } from "./view.js";
import { Provider, useRuntime, useService } from "./Runtime.js";

/** Shares the exact Typed Navigation service. Execute its commands with useAction or useRuntime. */
export function useNavigation(): Navigation["Service"] {
  return useService(Navigation);
}

/** The stable structural mount tree; useLocation observes the changing destination separately. */
export function useCurrentRoute(): CurrentRouteTree {
  return useService(CurrentRoute);
}

/** Tracks the same currentEntry source used by Typed matchers and links. */
export function useLocation<ER = never>(
  options: ReactiveOptions<Destination, never, Navigation | Scope.Scope, ER> = {},
): AsyncState<Destination, ER> {
  return useFx(Navigation.currentEntry, options);
}

/** Adapts a React component to a Typed matcher handler, preserving reactive params and route-local services. */
export function routeComponent<P extends object>(
  component: ComponentType<P>,
  options: ViewOptions = {},
) {
  return (params: RefSubject.RefSubject<P>) => view(component, params, options);
}

/** Tracks the canonical pathname and query string used by Typed matchers. */
export function useCurrentPath<ER = never>(
  options: ReactiveOptions<string, never, Navigation | Scope.Scope, ER> = {},
): AsyncState<string, ER> {
  return useFx(CurrentPath, options);
}

/** Extends the structural mount tree for React and Typed descendants; pass the complete mount route. */
export function CurrentRouteProvider({
  route,
  children,
}: {
  readonly route: Route.Route.Any;
  readonly children?: ReactNode;
}): ReactNode {
  const runtime = useRuntime<CurrentRoute>();
  const parent = runtime.cachedContext
    ? Context.getOrUndefined(runtime.cachedContext, CurrentRoute)
    : undefined;

  const context = useMemo(() => Context.make(CurrentRoute, { route, parent }), [route, parent]);

  return createElement(Provider<never, never, CurrentRoute>, { context }, children);
}

export interface RouteOptions<Rt extends Route.Route.Any, ER = never> extends ReactiveOptions<
  Option.Option<Route.Route.Type<Rt>>,
  Matcher.RouteNotFound | Matcher.RouteDecodeError | Matcher.RouteGuardError,
  Router | Scope.Scope | Route.Route.DecodingServices<Rt>,
  ER
> {
  /** Replaces the ambient mount. Outside this root, Typed reports RouteNotFound. */
  readonly currentRoute?: CurrentRouteTree;
}

/** Decoded parameters through Typed's matcher. The default None fallback stays live outside the ambient mount. */
export function useRoute<Rt extends Route.Route.Any, ER = never>(
  route: Rt,
  options: RouteOptions<Rt, ER> = {},
) {
  const source = useMemo(
    () =>
      Fx.gen(function* () {
        const matcher = Matcher.match(route, (params) => Fx.map(params, Option.some));

        if (options.currentRoute !== undefined) {
          return matcher
            .match(Route.Wildcard, Option.none<Route.Route.Type<Rt>>())
            .pipe(Fx.provideService(CurrentRoute, options.currentRoute));
        }

        const owner = yield* CurrentRoute;

        return matcher
          .prefix(owner.route)
          .match(Route.Wildcard, Option.none<Route.Route.Type<Rt>>())
          .pipe(Fx.provideService(CurrentRoute, { route: Route.Slash }));
      }),
    [route, options.currentRoute],
  );

  return useFx<
    Option.Option<Route.Route.Type<Rt>>,
    Matcher.RouteNotFound | Matcher.RouteDecodeError | Matcher.RouteGuardError,
    Router | Scope.Scope | Route.Route.DecodingServices<Rt>,
    ER
  >(source, options);
}
