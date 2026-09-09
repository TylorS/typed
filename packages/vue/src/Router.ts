import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import {
  Navigation,
  CurrentPath,
  type NavigationNavigateOptions,
  type NavigationInfoOptions,
} from "@typed/navigation/Navigation";
import type { Destination } from "@typed/navigation/model";
import { CurrentRoute, type CurrentRouteTree } from "@typed/router/CurrentRoute";
import { match, type Matcher } from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import type { Router } from "@typed/router/Router";
import type { RouteDecodeError, RouteGuardError, RouteNotFound } from "@typed/router/RouteExecutor";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import {
  computed,
  toValue,
  type Component,
  type VNodeProps,
  type AllowedComponentProps,
  type ComponentCustomProps,
  type MaybeRefOrGetter,
} from "vue";
import { useFx, useService, type ReactiveOptions } from "./Reactive.js";
import { provideServices, useRuntime, type VueRuntime } from "./Runtime.js";
import { view, type ComponentProps, type ViewOptions } from "./view.js";
import { useScopedRunner } from "./internal/scope.js";

/** Live navigation uses the provider's backend, including BrowserRouter/ServerRouter/TestRouter. */
export function useNavigation<ER = never>(
  options: { readonly runtime?: MaybeRefOrGetter<VueRuntime<Navigation, ER>> } = {},
) {
  const runtime = options.runtime ?? useRuntime<Navigation, ER>();

  const source = Fx.struct({
    currentEntry: Navigation.currentEntry,
    entries: Navigation.entries,
    transition: Navigation.transition.asComputed(),
    canGoBack: Navigation.canGoBack,
    canGoForward: Navigation.canGoForward,
  });
  const state = useFx(source, { runtime });
  const run = useScopedRunner<Navigation, ER>(runtime);

  return {
    ...state,
    navigate: (url: string | URL, options?: NavigationNavigateOptions) =>
      run(Navigation.navigate(url, options)),
    back: (options?: NavigationInfoOptions) => run(Navigation.back(options)),
    forward: (options?: NavigationInfoOptions) => run(Navigation.forward(options)),
    updateCurrentEntry: (state: unknown) => run(Navigation.updateCurrentEntry({ state })),
  };
}

export function useLocation<ER = never>(
  options: ReactiveOptions<Destination, never, Navigation, ER> = {},
) {
  return useFx(Navigation.currentEntry, options);
}

export function useCurrentPath<ER = never>(
  options: ReactiveOptions<string, never, Navigation, ER> = {},
) {
  return useFx(CurrentPath, options);
}

/** Stable structural route mount, distinct from live location. */
export function useCurrentRoute<ER = never>(
  options: ReactiveOptions<CurrentRouteTree, never, CurrentRoute, ER> = {},
) {
  return useService(CurrentRoute, options);
}

export function provideCurrentRoute(route: MaybeRefOrGetter<CurrentRouteTree>) {
  return provideServices(() => Context.make(CurrentRoute, toValue(route)));
}

/** Run the actual Typed matcher with Vue scope ownership and typed routing failures. */
export function useMatcher<A, E, R, ER = never>(
  matcher: MaybeRefOrGetter<Matcher<A, E, R>>,
  options: ReactiveOptions<
    A,
    E | RouteNotFound | RouteDecodeError | RouteGuardError,
    R | Router,
    ER
  > = {},
) {
  return useFx(matcher, options);
}

/** Options for decoding a route relative to an explicit or inherited structural mount. */
export interface RouteOptions<Rt extends Route.Any, ER = never> extends ReactiveOptions<
  Option.Option<Route.Type<Rt>>,
  RouteNotFound | RouteDecodeError | RouteGuardError,
  Router | Route.Route.DecodingServices<Rt>,
  ER
> {
  /** Replaces the ambient mount; None is local to this root and outside it is RouteNotFound. */
  readonly currentRoute?: MaybeRefOrGetter<CurrentRouteTree>;
}

/** Decode under the inherited mount, or a reactive explicit root applied exactly once. */
export function useRoute<Rt extends Route.Any, ER = never>(
  route: MaybeRefOrGetter<Rt>,
  options: RouteOptions<Rt, ER> = {},
) {
  const source = computed(() => {
    const current = toValue(route);
    const selected = options.currentRoute === undefined ? undefined : toValue(options.currentRoute);
    const matcher = match(current, (params) => Fx.map(params, Option.some));

    if (selected !== undefined) {
      return matcher
        .match(Route.Wildcard, Option.none<Route.Type<Rt>>())
        .pipe(Fx.provideService(CurrentRoute, selected));
    }

    return Fx.unwrap(
      Effect.map(CurrentRoute, (owner) =>
        matcher
          .prefix(owner.route)
          .match(Route.Wildcard, Option.none<Route.Type<Rt>>())
          .pipe(Fx.provideService(CurrentRoute, { route: Route.Slash })),
      ),
    );
  });

  return useFx(source, options);
}

/**
 * Adapt a Vue component to a Typed route handler. Render the full matcher with Typed's
 * renderer (or the inverse Typed component), keeping route resources alive through SSR.
 */
export function routeComponent<C extends Component>(component: C, options: ViewOptions = {}) {
  return (params: RefSubject.RefSubject<RouteComponentProps<C>>) =>
    view(
      component,
      Fx.map(params, (props) => props as ComponentProps<C>),
      options,
    );
}

/** Declared route props exclude optional Vue infrastructure props such as ref and key. */
export type RouteComponentProps<C> = Omit<
  ComponentProps<C>,
  {
    [K in keyof ComponentProps<C>]-?: K extends
      | keyof VNodeProps
      | keyof AllowedComponentProps
      | keyof ComponentCustomProps
      ? {} extends Pick<ComponentProps<C>, K>
        ? K
        : never
      : never;
  }[keyof ComponentProps<C>]
>;
