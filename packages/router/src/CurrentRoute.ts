import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import { Navigation } from "@typed/navigation/Navigation";
import { Parse, type Route } from "./Route.js";

const normalizeBasePath = (base: string): string => {
  try {
    return new URL(base).pathname;
  } catch {
    return base;
  }
};

/**
 * Describes the stable route mount tree visible to a running handler or layout.
 *
 * @remarks
 * ## Why
 * The mounted tree records structural ownership and parentage. It is deliberately not the live URL;
 * read `CurrentPath` or `Navigation.currentEntry` when reacting to location changes.
 *
 * ## Ownership and lifetime
 * Values are immutable and acquire no resources. The selected handler Scope owns the tree supplied
 * through `CurrentRoute`; nested layout and route layers may extend it.
 *
 * @since 1.0.0
 * @category Structural mounts
 */
export interface CurrentRouteTree {
  /**
   * The route mounted at this boundary.
   *
   * @remarks
   * ## Why
   * It lets children derive structural prefixes without treating a later URL update as a remount.
   *
   * ## Ownership and lifetime
   * The value is immutable and lives with the containing mount tree.
   *
   * @since 1.0.0
   * @category Structural mounts
   */
  readonly route: Route<string, any>;
  /**
   * The enclosing mounted boundary, when the route was nested.
   *
   * @remarks
   * ## Why
   * It preserves layout and prefix ancestry without coupling it to browser history.
   *
   * ## Ownership and lifetime
   * The reference is immutable and does not extend the parent's owning Scope.
   *
   * @since 1.0.0
   * @category Structural mounts
   */
  readonly parent?: CurrentRouteTree | undefined;
}

/**
 * The ambient route context for the current routing boundary.
 *
 * @remarks
 * ## Why
 * A stable ambient context prevents same-route parameter updates from replacing structural ownership.
 * Use Navigation for the live URL; use CurrentRoute for the route tree that owns this handler.
 *
 * ## Ownership and lifetime
 * The selected handler or layout Scope owns the provided service. `Default` creates the root from
 * `Navigation.base`; `extend` shadows it for a nested boundary and retains the previous value as parent.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 * import * as Effect from "effect/Effect"
 *
 * const mountedPath = Effect.map(Router.CurrentRoute, ({ route }) => route.path)
 * ```
 *
 * @since 1.0.0
 * @category Structural mounts
 */
export class CurrentRoute extends Context.Service<CurrentRoute, CurrentRouteTree>()(
  "@typed/router/CurrentRoute",
  {
    make: Effect.map(Navigation.base, (base) => ({ route: Parse(normalizeBasePath(base)) })),
  },
) {
  /**
   * Provides the root mount route parsed from `Navigation.base`.
   *
   * @remarks
   * ## Why
   * Every router needs a structural root even before a matcher selects a child route.
   *
   * ## Ownership and lifetime
   * The Layer borrows Navigation and provides CurrentRoute for its surrounding Layer Scope.
   *
   * @since 1.0.0
   * @category Structural mounts
   */
  static readonly Default = Layer.effect(CurrentRoute, CurrentRoute.make);

  /**
   * Provides a nested CurrentRoute whose parent is the ambient mount boundary.
   *
   * @remarks
   * ## Why
   * An independently owned child Matcher declares paths relative to this mount. The supplied
   * Route is the exact child mount, not an automatically joined relative segment; compose deeper
   * prefixes with `Route.Join` before extending. Navigation remains shared with the surrounding app.
   *
   * ## Ownership and lifetime
   * Layer acquisition reads the ambient context once. The returned child tree lives until that Layer Scope closes.
   *
   * @since 1.0.0
   * @category Structural mounts
   */
  static readonly extend = (route: Route.Any) =>
    Layer.unwrap(
      Effect.gen(function* () {
        const services = yield* Effect.context<never>();
        const parent = Context.getOrUndefined(services, CurrentRoute);
        return Layer.succeed(CurrentRoute, {
          route,
          parent,
        });
      }),
    );
}
