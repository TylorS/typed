import * as AsyncData from "@typed/async-data";
import * as Fx from "@typed/fx/Fx";
import { Navigation, CurrentPath } from "@typed/navigation/Navigation";
import type { Destination } from "@typed/navigation/model";
import { CurrentRoute, type CurrentRouteTree } from "@typed/router/CurrentRoute";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import type { Router } from "@typed/router/Router";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import { derived, get, type Readable } from "svelte/store";
import { useService, useSource, type SourceOptions } from "./Reactive.js";
import {
  asReadable,
  provideRuntime,
  useRuntime,
  type RuntimeSource,
  type Runtime,
} from "./Runtime.js";

/** Follows committed entries from browser, server memory, or test Navigation. */
export function useLocation<ER = never>(
  options: SourceOptions<Destination, never, Navigation, ER> = {},
) {
  return useSource(Navigation.currentEntry, options);
}

/** Follows the canonical pathname plus query used by Typed's Matcher. */
export function useCurrentPath<ER = never>(
  options: SourceOptions<string, never, Navigation, ER> = {},
) {
  return useSource(CurrentPath, options);
}

/** Reads the structural route owner; navigation does not rewrite this tree. */
export function useCurrentRoute<ER = never>(
  options: SourceOptions<CurrentRouteTree, never, CurrentRoute, ER> = {},
) {
  return useService(CurrentRoute, options);
}

/**
 * Native state plus promise commands using the closest Navigation service.
 * Commands use the latest provider after runtime replacement.
 */
export function useNavigation<ER = never>(
  options: SourceOptions<Destination, never, Navigation, ER> = {},
) {
  const runtime = options.runtime ? asReadable(options.runtime) : useRuntime<Navigation, ER>();

  return {
    location: useLocation({ ...options, runtime }),
    entries: useSource(Navigation.entries, { runtime }),
    transition: useSource(Navigation.transition.asComputed(), {
      runtime,
      initial: AsyncData.success(Option.none()),
    }),
    canGoBack: useSource(Navigation.canGoBack, { runtime, initial: AsyncData.success(false) }),
    canGoForward: useSource(Navigation.canGoForward, {
      runtime,
      initial: AsyncData.success(false),
    }),

    navigate: (...args: Parameters<typeof Navigation.navigate>) =>
      get(runtime).runPromise(Navigation.navigate(...args)),
    back: (...args: Parameters<typeof Navigation.back>) =>
      get(runtime).runPromise(Navigation.back(...args)),
    forward: (...args: Parameters<typeof Navigation.forward>) =>
      get(runtime).runPromise(Navigation.forward(...args)),
  };
}

/** Options for matching one route through Typed's native matcher. */
export interface RouteOptions<Rt extends Route.Route.Any, ER = never> extends SourceOptions<
  Option.Option<Route.Route.Type<Rt>>,
  Matcher.RouteNotFound | Matcher.RouteDecodeError | Matcher.RouteGuardError,
  Router | Scope.Scope | Route.Route.DecodingServices<Rt>,
  ER
> {
  /** Replaces the ambient mount. A store changes the matching root reactively. */
  readonly currentRoute?: CurrentRouteTree | Readable<CurrentRouteTree>;
}

/**
 * Decodes reactive route parameters with Typed's matcher. By default, leaving
 * the ambient mount yields None. An explicit root confines the wildcard to that
 * root, so paths outside it retain the native RouteNotFound failure.
 */
export function useRoute<Rt extends Route.Route.Any, ER = never>(
  route: Rt,
  options: RouteOptions<Rt, ER> = {},
) {
  const matcher = Matcher.match(route, (params) => Fx.map(params, Option.some));

  if (options.currentRoute !== undefined) {
    const matches = derived(asReadable(options.currentRoute), (owner) =>
      matcher
        .match(Route.Wildcard, Option.none<Route.Route.Type<Rt>>())
        .pipe(Fx.provideService(CurrentRoute, owner)),
    );

    return useSource(matches, options);
  }

  const matches = Fx.gen(function* () {
    const owner = yield* CurrentRoute;

    return matcher
      .prefix(owner.route)
      .match(Route.Wildcard, Option.none<Route.Route.Type<Rt>>())
      .pipe(Fx.provideService(CurrentRoute, { route: Route.Slash }));
  });

  return useSource(matches, options);
}

/**
 * Extends the structural CurrentRoute for descendants, including nested Typed
 * content. Pass the full mount route, as with CurrentRoute.extend.
 */
export function provideCurrentRoute<R = never, ER = never>(
  route: Route.Route.Any,
  runtime: RuntimeSource<R, ER> = useRuntime<R, ER>(),
): Readable<Runtime<R | CurrentRoute, ER>> {
  return provideRuntime(
    derived(asReadable(runtime), (parent) => {
      const contextEffect = Effect.map(parent.contextEffect, (services) =>
        Context.add(services, CurrentRoute, {
          route,
          parent: Context.getOrUndefined(services, CurrentRoute),
        }),
      );

      const provide = <A, E>(effect: Effect.Effect<A, E, R | CurrentRoute>) =>
        Effect.flatMap(contextEffect, (services) => Effect.provideContext(effect, services));

      return {
        contextEffect,
        runFork: (effect, options) => parent.runFork(provide(effect), options),
        runPromise: (effect, options) => parent.runPromise(provide(effect), options),
        runPromiseExit: (effect, options) => parent.runPromiseExit(provide(effect), options),
        runSync: (effect) => parent.runSync(provide(effect)),
      } satisfies Runtime<R | CurrentRoute, ER>;
    }),
  );
}
