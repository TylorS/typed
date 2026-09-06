import type * as Arr from "effect/Array";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual, identity } from "effect/Function";
import * as Result from "effect/Result";
import * as Layer from "effect/Layer";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import * as Schema from "effect/Schema";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import * as Stream from "effect/Stream";
import type { ExcludeTag, ExtractTag, NoInfer, Tags } from "effect/Types";
import {
  fromEffect,
  fromStream,
  FxTypeId,
  isFx,
  make as makeFx,
  mapEffect,
  skipRepeats,
  succeed,
  switchMap,
  unwrap,
} from "@typed/fx/Fx";
import type * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { getGuard } from "@typed/guard/getGuard";
import type { AsGuard, Guard as GuardType, GuardInput } from "@typed/guard";
import { CurrentPath, Navigation } from "@typed/navigation/Navigation";
import type { MatchAst, RouteAst } from "./AST.js";
import * as AST from "./AST.js";
import { CurrentRoute } from "./CurrentRoute.js";
import * as Path from "./Path.js";
import { Join, make as makeRoute, type Route } from "./Route.js";
import {
  makeCatchManager,
  makeLayerManager,
  makeLayoutManager,
  makeRouteExecutor,
  RouteDecodeError,
  RouteGuardError,
  RouteNotFound,
} from "./RouteExecutor.js";
import type { Router } from "./Router.js";
import { Sink } from "@typed/fx";
import { makePathRouter } from "./internal/PathRouter.js";

/**
 * A function that wraps matched content using reactive params.
 *
 * @remarks
 * ## Why
 * Layout output, errors, and services compose in the surrounding Matcher type.
 *
 * ## Ownership and lifetime
 * The executor invokes a layout only after its route is selected. Its child Scope owns the parameter/content RefSubjects and every subscription made by the returned Fx.
 *
 * @since 1.0.0
 * @category Route layouts
 */
export type Layout<Params, A, E, R, B, E2, R2> = (
  params: LayoutParams<Params, A, E, R>,
) => Fx.Fx<B, E2, R2>;

/**
 * The reactive parameters and nested content supplied to a layout.
 *
 * @remarks
 * ## Why
 * Parameter-only route updates can reach a retained layout without remounting its content.
 *
 * ## Ownership and lifetime
 * The executor owns both RefSubjects for the active layout child Scope. Reading them does not transfer ownership; retaining them beyond that Scope observes finalized state.
 *
 * @since 1.0.0
 * @category Route layouts
 */
export type LayoutParams<Params, A, E, R> = {
  /**
   * Reactive decoded parameters for the currently selected route.
   *
   * @remarks
   * ## Why
   * Parameter-only navigation updates a retained layout without reconstructing it.
   *
   * ## Ownership and lifetime
   * The layout manager owns this RefSubject in the layout's child Scope and updates it before the
   * retained layout renders the next value.
   *
   * @since 1.0.0
   * @category Route layouts
   */
  readonly params: RefSubject.RefSubject<Params>;
  /**
   * Reactive output nested immediately inside this layout.
   *
   * @remarks
   * ## Why
   * A retained outer layout can observe replacement of an inner layout or route handler.
   *
   * ## Ownership and lifetime
   * The layout manager owns the backing content RefSubject in the same child Scope. Inner layouts
   * are acquired first, so this Fx represents the already-wrapped inner subtree.
   *
   * @since 1.0.0
   * @category Route layouts
   */
  readonly content: Fx.Fx<A, E, R>;
};

/**
 * A reactive complete-cause handler that produces fallback Fx output.
 *
 * @remarks
 * ## Why
 * Error boundaries can respond to failure, defect, or interruption without erasing cause structure.
 *
 * ## Ownership and lifetime
 * The catch manager invokes the handler inside a child Scope. That Scope owns the cause RefSubject and returned fallback Fx until recovery is replaced or routing stops.
 *
 * @since 1.0.0
 * @category Route recovery
 */
export type CatchHandler<E, A, E2, R2> = (
  cause: RefSubject.RefSubject<Cause.Cause<E>>,
) => Fx.Fx<A, E2, R2>;

/**
 * A widened Effect Layer accepted as a route dependency.
 *
 * @remarks
 * ## Why
 * Matcher internals can store heterogeneous Layers while public overloads retain precise types.
 *
 * ## Ownership and lifetime
 * This alias is compile-time only. A concrete Layer is acquired only for candidate evaluation; the layer manager commits it for the selected route or rolls it back on rejection.
 *
 * @since 1.0.0
 * @category Route services
 */
export type AnyLayer =
  | Layer.Layer<any, any, any>
  | Layer.Layer<never, any, any>
  | Layer.Layer<any, never, any>
  | Layer.Layer<any, any, never>
  | Layer.Layer<never, never, never>
  | Layer.Layer<any, never, never>
  | Layer.Layer<never, any, never>
  | Layer.Layer<never, never, any>;

/**
 * A widened Effect Context accepted as an already-built dependency.
 *
 * @remarks
 * ## Why
 * Callers can provide existing services without forcing them through Layer acquisition.
 *
 * ## Ownership and lifetime
 * This alias is compile-time only. A supplied Context is borrowed as already-built services; Matcher does not acquire or finalize those service values.
 *
 * @since 1.0.0
 * @category Route services
 */
export type AnyServiceMap = Context.Context<any> | Context.Context<never>;
/**
 * A route dependency supplied as an Effect Layer or Context.
 *
 * @remarks
 * ## Why
 * Registration accepts both acquired and already-built service sources.
 *
 * ## Ownership and lifetime
 * This union is compile-time only. Layer branches are scoped by candidate selection, while Context branches are borrowed without acquisition.
 *
 * @since 1.0.0
 * @category Route services
 */
export type AnyDependency = AnyLayer | AnyServiceMap;
/**
 * A widened layout function accepted in Match AST storage.
 *
 * @remarks
 * ## Why
 * Matcher internals can retain heterogeneous layouts while public overloads preserve exact channels.
 *
 * ## Ownership and lifetime
 * Internal type erasure only; runtime ownership remains with the concrete layout child Scope.
 *
 * @since 1.0.0
 * @category Route layouts
 * @internal
 */
export type AnyLayout = Layout<any, any, any, any, any, any, any>;
/**
 * A widened catch handler accepted in Match AST storage.
 *
 * @remarks
 * ## Why
 * Matcher internals can retain heterogeneous boundaries while public overloads preserve exact channels.
 *
 * ## Ownership and lifetime
 * Internal type erasure only; runtime ownership remains with the concrete catch child Scope.
 *
 * @since 1.0.0
 * @category Route recovery
 * @internal
 */
export type AnyCatch = CatchHandler<any, any, any, any>;
type AnyGuard = GuardType<any, any, any, any>;
type AnyMatchHandler = (params: RefSubject.RefSubject<any>) => Fx.Fx<any, any, any>;

/**
 * Extracts the services supplied by a matcher dependency.
 *
 * @remarks
 * ## Why
 * Providing a dependency removes those services from the returned Matcher's requirements.
 *
 * ## Ownership and lifetime
 * Computed only by TypeScript; the actual services are owned by the Layer or borrowed Context represented by `D`.
 *
 * @since 1.0.0
 * @category Route services
 */
export type DependencyProvided<D> =
  D extends Layer.Layer<infer Provided, any, any>
    ? Provided
    : D extends Context.Context<infer Provided>
      ? Provided
      : never;
/**
 * Extracts the acquisition error of a matcher Layer dependency.
 *
 * @remarks
 * ## Why
 * Layer failures remain visible in the Matcher's error channel.
 *
 * ## Ownership and lifetime
 * Computed only by TypeScript; any runtime failure occurs while the represented Layer is being prepared.
 *
 * @since 1.0.0
 * @category Route services
 */
export type DependencyError<D> = D extends Layer.Layer<any, infer E, any> ? E : never;
/**
 * Extracts the services needed to acquire a matcher Layer dependency.
 *
 * @remarks
 * ## Why
 * Local providers do not hide their own upstream requirements.
 *
 * ## Ownership and lifetime
 * Computed only by TypeScript; runtime service lifetimes remain those of the environment used to acquire the represented Layer.
 *
 * @since 1.0.0
 * @category Route services
 */
export type DependencyRequirements<D> = D extends Layer.Layer<any, any, infer R> ? R : never;

type LayerSuccess<L> = L extends Layer.Layer<infer Provided, any, any> ? Provided : never;
type LayerError<L> = L extends Layer.Layer<any, infer E, any> ? E : never;
type LayerServices<L> = L extends Layer.Layer<any, any, infer R> ? R : never;

export type { AsGuard, GuardInput, GuardType };

/**
 * Extracts the successful narrowed value produced by a Guard.
 *
 * @remarks
 * ## Why
 * Guarded handlers receive the proven output rather than the original route parameter type.
 *
 * ## Ownership and lifetime
 * Computed only by TypeScript. The accepted value itself is produced by one guard invocation and retained by the selected route parameter RefSubject.
 *
 * @since 1.0.0
 * @category Candidate guards
 */
export type GuardOutput<G> = GuardType.Output<G>;
/**
 * Extracts a Guard's typed failure channel.
 *
 * @remarks
 * ## Why
 * Guard failures remain visible when every candidate is rejected.
 *
 * ## Ownership and lifetime
 * Computed only by TypeScript. Runtime failures belong to the guard Effect and are collected only while evaluating that transition.
 *
 * @since 1.0.0
 * @category Candidate guards
 */
export type GuardError<G> = GuardType.Error<G>;
/**
 * Extracts the Effect services required by a Guard.
 *
 * @remarks
 * ## Why
 * Matcher requirements include the environment needed for candidate validation.
 *
 * ## Ownership and lifetime
 * Computed only by TypeScript. The services are borrowed from the candidate's merged Effect Context during guard evaluation.
 *
 * @since 1.0.0
 * @category Candidate guards
 */
export type GuardServices<G> = GuardType.Services<G>;

type MatchOptions<Rt extends Route.Any, B, E2, R2, D, LB, LE2, LR2, C> = {
  readonly route: Rt;
  readonly handler:
    | MatchHandlerReturnValue<B, E2, R2>
    | ((params: RefSubject.RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E2, R2>);
  readonly dependencies?: D;
  readonly layout?: Layout<Route.Type<Rt>, B, E2, R2, LB, LE2, LR2>;
  readonly catch?: C;
};

/**
 * The value, Effect, Stream, or Fx accepted as route output.
 *
 * @remarks
 * ## Why
 * All supported producers normalize to Fx while preserving their errors and service requirements.
 *
 * ## Ownership and lifetime
 * This union adds no lifetime. Plain values are immediate; Effect, Stream, and Fx resources begin only when the selected handler is run in its route Scope.
 *
 * @since 1.0.0
 * @category Route handlers
 */
export type MatchHandlerReturnValue<A, E, R> =
  | Fx.Fx<A, E, R>
  | Stream.Stream<A, E, R>
  | Effect.Effect<A, E, R>
  | A;

type MatchHandlerOptions<Params, B, E2, R2, D, LB, LE2, LR2, C> = {
  readonly handler:
    | MatchHandlerReturnValue<B, E2, R2>
    | ((params: RefSubject.RefSubject<Params>) => MatchHandlerReturnValue<B, E2, R2>);
  readonly dependencies?: D;
  readonly layout?: Layout<Params, B, E2, R2, LB, LE2, LR2>;
  readonly catch?: C;
};

type ApplyDependencies<E, R, D> =
  D extends ReadonlyArray<infer Dep>
    ? {
        readonly e: E | DependencyError<Dep>;
        readonly r: Exclude<R, DependencyProvided<Dep>> | DependencyRequirements<Dep>;
      }
    : { readonly e: E; readonly r: R };

type ApplyCatch<A, E, R, C> =
  C extends CatchHandler<any, infer CA, infer CE, infer CR>
    ? { readonly a: A | CA; readonly e: CE; readonly r: R | CR }
    : { readonly a: A; readonly e: E; readonly r: R };

type ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GE, GR> = ApplyCatch<
  LB,
  ApplyDependencies<E2 | GE | LE2, R2 | GR | LR2, D>["e"],
  ApplyDependencies<E2 | GE | LE2, R2 | GR | LR2, D>["r"],
  C
>;

/**
 * Composes ordered route cases into an Fx that follows the current Navigation path.
 *
 * @remarks
 * ## Why
 * A Matcher is both a declarative route table and `Fx<A, E, R>`. Route, guard, dependency, layout,
 * and catch composition therefore stays in Effect's typed success, error, and service channels.
 *
 * ## Ownership and lifetime
 * Building a Matcher is pure. Running it requires Router and Scope: it subscribes to CurrentPath,
 * switches selected handlers when the route changes, reuses the same handler for parameter-only
 * updates, and finalizes route/layout/layer scopes when selection changes or the consumer interrupts.
 * Matching is case-insensitive and ignores trailing slashes. Distinct registered matcher paths use
 * structural precedence (literal, constrained parameter, parameter, then wildcard), not a global
 * first-declared rule. Registration order matters among compiled entries that
 * share the same matcher path: their schemas and guards fall through in that order.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 *
 * const app = Router.match(Router.Parse("/"), "home")
 *   .match(Router.Parse("/users/:id"), (params) => params)
 * ```
 *
 * Matcher dependency and lifetime behavior follows Effect v4 Layer and Scope semantics:
 * https://effect.website/docs/requirements-management/layers/ and
 * https://effect.website/docs/resource-management/scope/.
 *
 * @since 1.0.0
 * @category Matcher contracts
 */
export interface Matcher<A, E = never, R = never>
  extends
    Fx.Fx<A, E | RouteNotFound | RouteDecodeError | RouteGuardError, R | Router | Scope.Scope>,
    Pipeable {
  /**
   * The immutable ordered Match AST compiled when this Matcher is run.
   *
   * @remarks
   * ## Why
   * Keeping cases visible preserves registration order for entries that compile to the same matcher
   * path. Distinct matcher paths are still selected by structural path-shape precedence.
   *
   * ## Ownership and lifetime
   * The array is retained by the Matcher value and acquires no runtime resources.
   *
   * @since 1.0.0
   * @category Route compilation
   */
  readonly cases: ReadonlyArray<MatchAst>;

  // Overload 1: match(route, handler) - function handler (must be first for inference)
  /**
   * Appends one route case with an optional guard, dependencies, layout, and local error boundary.
   *
   * @remarks
   * ## Why
   * Nine overload families accept direct values, Effect, Stream, Fx, parameter functions, guarded
   * variants, and options without erasing their errors or service requirements. After path lookup,
   * candidates registered under the same matcher path are decoded and guarded in declaration order:
   * the first decoded guard `Some` wins; decode failure, guard `None`, or guard failure falls through.
   * Distinct path shapes are prioritized structurally, not solely by this call's position.
   *
   * ## Ownership and lifetime
   * Registration is pure and returns a new Matcher. When run, candidate layers are prepared before
   * the guard; rejected candidates roll them back. The selected handler, layout, and dependencies
   * are owned by its route Scope and are interrupted on replacement.
   *
   * @example
   * ```ts
   * import * as Router from "@typed/router"
   * import * as Effect from "effect/Effect"
   *
   * const users = Router.match(Router.Parse("/users/:id"), (params) =>
   *   Effect.map(params, ({ id }) => `user:${id}`)
   * )
   * ```
   *
   * @example Guarded candidate
   * ```ts
   * import * as Router from "@typed/router"
   * import type { Guard } from "@typed/guard"
   * import * as Effect from "effect/Effect"
   *
   * type Params = { readonly id: string }
   * const accepted: Guard<Params, Params> = (params) => Effect.succeedSome(params)
   * const users = Router.match(Router.Parse("/users/:id"), accepted, (params) => params)
   * ```
   *
   * @since 1.0.0
   * @category Route handlers
   */
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: (params: RefSubject.RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;

  // Overload 2: match(route, effectLike) - Fx/Effect/Stream handler
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;

  // Overload 3: match(route, options) - route with options object
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    options: MatchHandlerOptions<Route.Type<Rt>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;

  // Overload 4: match(route, value) - direct value handler (last for 2-arg form)
  match<Rt extends Route.Any, const B>(route: Rt, handler: B): Matcher<A | B, E, R | Scope.Scope>;

  // Overload 5: match(route, guard, handler) - guard with function handler (must be before value)
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
  >(
    route: Rt,
    guard: G,
    handler: (params: RefSubject.RefSubject<GuardOutput<G>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;

  // Overload 6: match(route, guard, effectLike) - guard with Fx/Effect/Stream handler
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
  >(
    route: Rt,
    guard: G,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;

  // Overload 7: match(route, guard, options) - route with guard and options object
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    guard: G,
    options: MatchHandlerOptions<GuardOutput<G>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["e"],
    | R
    | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["r"]
    | Scope.Scope
  >;

  // Overload 8: match(route, guard, value) - guard with value handler (last for 3-arg form)
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B>(
    route: Rt,
    guard: G,
    handler: B,
  ): Matcher<A | B, E | GuardError<G>, R | GuardServices<G> | Scope.Scope>;

  // Overload 9: match(fullOptions) - full options object including route
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    options: MatchOptions<Rt, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;

  /**
   * Prefixes every case in this Matcher with another Route.
   *
   * @remarks
   * ## Why
   * Nested applications can reuse a route table beneath a structural mount path.
   *
   * ## Ownership and lifetime
   * Composition is pure. Prefix services and schemas participate when the returned Matcher runs.
   *
   * @since 1.0.0
   * @category Matcher composition
   */
  readonly prefix: <Rt extends Route.Any>(route: Rt) => Matcher<A, E, R>;

  /**
   * Provides one or more Effect Layers to this Matcher's cases.
   *
   * @remarks
   * ## Why
   * Route-local services remain explicit in the Matcher type instead of leaking into the whole app.
   *
   * ## Ownership and lifetime
   * Layers are acquired only for candidate evaluation, committed for the selected route, shared via
   * Effect's memo map where possible, and finalized when no selected case retains them.
   *
   * @since 1.0.0
   * @category Route services
   */
  readonly provide: <Layers extends readonly [AnyLayer, ...AnyLayer[]]>(
    ...layers: Layers
  ) => Matcher<
    A,
    E | LayerError<Layers[number]>,
    Exclude<R, LayerSuccess<Layers[number]>> | LayerServices<Layers[number]>
  >;

  /**
   * Provides one concrete Effect service to this Matcher's cases.
   *
   * @remarks
   * ## Why
   * It is the concise constant-service form of `provideContext`.
   *
   * ## Ownership and lifetime
   * The supplied service is retained by the Matcher value; no acquisition or finalizer is added.
   *
   * @since 1.0.0
   * @category Route services
   */
  readonly provideService: <Id, S>(
    tag: Context.Service<Id, S>,
    service: S,
  ) => Matcher<A, E, Exclude<R, Id>>;

  /**
   * Provides an existing Effect Context to this Matcher's cases.
   *
   * @remarks
   * ## Why
   * Multiple already-constructed services can satisfy route requirements without rebuilding Layers.
   *
   * ## Ownership and lifetime
   * The Context is retained by the Matcher; resource lifetime remains owned by whoever constructed it.
   *
   * @since 1.0.0
   * @category Route services
   */
  readonly provideContext: <R2>(services: Context.Context<R2>) => Matcher<A, E, Exclude<R, R2>>;

  /**
   * Handles complete Effect causes from this Matcher with a reactive Cause RefSubject.
   *
   * @remarks
   * ## Why
   * Defects, interruption, and typed failures remain distinguishable instead of collapsing to one error value.
   *
   * ## Ownership and lifetime
   * The catch Fx is mounted in the same selected route Scope and is interrupted when the route changes.
   *
   * @since 1.0.0
   * @category Route recovery
   */
  readonly catchCause: <B, E2, R2>(f: CatchHandler<E, B, E2, R2>) => Matcher<A | B, E2, R | R2>;

  /**
   * Handles the first typed failure in this Matcher's cause.
   *
   * @remarks
   * ## Why
   * It provides an ergonomic typed-error boundary while retaining non-failure causes unchanged.
   *
   * ## Ownership and lifetime
   * The replacement Fx is owned by the selected route Scope; defects and interruption are rethrown.
   *
   * @since 1.0.0
   * @category Route recovery
   */
  readonly catch: <B, E2, R2>(f: (e: E) => Fx.Fx<B, E2, R2>) => Matcher<A | B, E2, R | R2>;

  /**
   * Handles selected tagged failures while retaining unmatched failures in the error channel.
   *
   * @remarks
   * ## Why
   * Tagged recovery narrows only the handled variants instead of erasing the entire error union.
   *
   * ## Ownership and lifetime
   * The replacement Fx shares the selected route Scope. Unmatched tags rethrow the original cause.
   *
   * @since 1.0.0
   * @category Route recovery
   */
  readonly catchTag: <const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, B, E2, R2>(
    tag: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx.Fx<B, E2, R2>,
  ) => Matcher<
    A | B,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  >;

  /**
   * Finishes route configuration with one redirect-and-retry on `RouteNotFound`.
   *
   * Use this terminal method after adding routes, providers, layouts, and recovery. It returns
   * an Fx rather than another Matcher because the redirect wraps the running route selection.
   * Matched-handler, decoding, and guard failures retain their error channels and do not redirect.
   * Construction starts no navigation; the consuming Scope owns execution and the single retry.
   *
   * @example
   * ```ts
   * import * as Router from "@typed/router"
   *
   * const application = Router.match(Router.Slash, "Queue")
   *   .match(Router.Parse("/issues/:issueId"), "Issue")
   *   .redirectTo("/")
   * ```
   *
   * @since 1.0.0
   * @category Route recovery
   */
  readonly redirectTo: (path: string) => Fx.Fx<
    A,
    Exclude<E, RouteNotFound> | RouteDecodeError | RouteGuardError,
    R | Router | Scope.Scope
  >;

  /**
   * Wraps the Matcher's selected content in a parameter-aware layout Fx.
   *
   * @remarks
   * ## Why
   * Layouts can compose output around nested content while observing the same reactive parameters.
   *
   * ## Ownership and lifetime
   * Layouts are acquired inner-to-outer so each newly acquired outer layout receives the already-
   * wrapped inner Fx as its content. The rendered nesting is therefore outer(inner(handler)). Stable
   * layout identities receive parameter/content updates without remounting and finalize with the
   * selected route Scope.
   *
   * @since 1.0.0
   * @category Route layouts
   */
  readonly layout: <B, E2, R2>(
    layout: Layout<any, A, E, R, B, E2, R2>,
  ) => Matcher<B, E | E2, R | R2>;

  /**
   * Merge this matcher with one or more others. Combined matcher matches all routes; each matcher's layouts/provide apply only to its own routes.
   *
   * @remarks
   * ## Why
   * Independent route tables can be assembled without moving their local providers or layouts to a global boundary.
   *
   * ## Ownership and lifetime
   * Merge is pure and concatenates cases: this Matcher's cases precede each supplied Matcher's cases.
   * That order governs decode/guard fallthrough only when entries share a matcher path; the path
   * router chooses between distinct shapes according to its own specificity rules.
   *
   * @since 1.0.0
   * @category Matcher composition
   */
  readonly merge: <const Others extends ReadonlyArray<Matcher.Any>>(
    ...others: Others
  ) => Matcher<
    A | Matcher.MergeSuccess<Others>,
    E | Matcher.MergeError<Others>,
    R | Matcher.MergeServices<Others>
  >;
}

export declare namespace Matcher {
  /**
   * A Matcher with intentionally widened success, error, and service channels.
   *
   * @remarks
   * ## Why
   * Heterogeneous Matcher collections can be stored while public combinators recover precise unions.
   *
   * ## Ownership and lifetime
   * Compile-time widening only; the concrete Matcher value remains immutable and acquires resources only when its Fx is run.
   *
   * @since 1.0.0
   * @category Matcher contracts
   */
  export type Any =
    | Matcher<any, any, any>
    | Matcher<any, never, any>
    | Matcher<any, any, never>
    | Matcher<any, never, never>;
  /**
   * Extracts a Matcher's success output type.
   *
   * @remarks
   * ## Why
   * Higher-level router builders can preserve output unions through composition.
   *
   * ## Ownership and lifetime
   * Computed only by TypeScript; it does not retain a Matcher or any emitted value.
   *
   * @since 1.0.0
   * @category Matcher type inference
   */
  export type Success<T> = [T] extends [Matcher<infer A, infer _E, infer _R>] ? A : never;
  /**
   * Extracts a Matcher's declared error type.
   *
   * @remarks
   * ## Why
   * Router builders can transform errors without widening away individual variants.
   *
   * ## Ownership and lifetime
   * Computed only by TypeScript; it does not retain a Matcher or any failure value.
   *
   * @since 1.0.0
   * @category Matcher type inference
   */
  export type Error<T> = [T] extends [Matcher<infer _A, infer E, infer _R>] ? E : never;
  /**
   * Extracts a Matcher's required Effect services.
   *
   * @remarks
   * ## Why
   * Composition can prove which requirements remain after local providers.
   *
   * ## Ownership and lifetime
   * Computed only by TypeScript; service ownership remains with the environment that runs the Matcher.
   *
   * @since 1.0.0
   * @category Matcher type inference
   */
  export type Services<T> = [T] extends [Matcher<infer _A, infer _E, infer R>] ? R : never;

  /**
   * Unions the success outputs of a Matcher tuple.
   *
   * @remarks
   * ## Why
   * Merged route tables preserve every possible selected output.
   *
   * ## Ownership and lifetime
   * Computed only by TypeScript from the tuple; it allocates no merged runtime value.
   *
   * @since 1.0.0
   * @category Matcher type inference
   */
  export type MergeSuccess<Matchers extends ReadonlyArray<Matcher.Any>> = Success<Matchers[number]>;
  /**
   * Unions the errors of a Matcher tuple.
   *
   * @remarks
   * ## Why
   * Merged route tables preserve all typed failures.
   *
   * ## Ownership and lifetime
   * Computed only by TypeScript from the tuple; it allocates no merged runtime value.
   *
   * @since 1.0.0
   * @category Matcher type inference
   */
  export type MergeError<Matchers extends ReadonlyArray<Matcher.Any>> = Error<Matchers[number]>;
  /**
   * Unions the required services of a Matcher tuple.
   *
   * @remarks
   * ## Why
   * Merged route tables retain the requirements of every case family.
   *
   * ## Ownership and lifetime
   * Computed only by TypeScript from the tuple; the runtime environments remain those supplied when the merged Matcher runs.
   *
   * @since 1.0.0
   * @category Matcher type inference
   */
  export type MergeServices<Matchers extends ReadonlyArray<Matcher.Any>> = Services<
    Matchers[number]
  >;
}

/**
 * A route output or parameter-dependent output function.
 *
 * @remarks
 * ## Why
 * Handlers can observe renderer-independent parameter RefSubjects and return any supported producer.
 *
 * ## Ownership and lifetime
 * The type itself owns nothing. When selected, the executor invokes the function once for that handler identity and runs its normalized Fx in the route Scope.
 *
 * @since 1.0.0
 * @category Route handlers
 */
export type MatchHandler<Params, A, E, R> =
  | Fx.Fx<A, E, R>
  | Stream.Stream<A, E, R>
  | Effect.Effect<A, E, R>
  | A
  | ((
      params: RefSubject.RefSubject<Params>,
    ) => Fx.Fx<A, E, R> | Stream.Stream<A, E, R> | Effect.Effect<A, E, R> | A);

type MatchHandlerFn<Params, A, E, R> = (
  params: RefSubject.RefSubject<Params>,
) => Fx.Fx<A, E, R> | Stream.Stream<A, E, R> | Effect.Effect<A, E, R> | A;

function isMatchHandlerFn<Params, A, E, R>(
  handler: MatchHandler<Params, A, E, R>,
): handler is MatchHandlerFn<Params, A, E, R> {
  return typeof handler === "function";
}

function isHandlerOptions(value: unknown): value is { readonly handler: unknown } {
  return typeof value === "object" && value !== null && "handler" in value;
}

// Monomorphic shape - all properties always present for V8 optimization
type ParsedMatch = {
  readonly route: Route.Any;
  readonly handler: unknown;
  readonly guard: AnyGuard | undefined;
  readonly layout: AnyLayout | undefined;
  readonly catchFn: AnyCatch | undefined;
  readonly dependencies: ReadonlyArray<AnyDependency> | undefined;
};

function parseMatchArgs(args: [unknown, ...Array<unknown>]): ParsedMatch {
  const [first, second, third] = args;

  // Single arg: full options object (Overload 9)
  if (second === undefined) {
    const opts = first as MatchOptions<Route.Any, any, any, any, any, any, any, any, any>;
    return {
      route: opts.route,
      handler: opts.handler,
      guard: undefined,
      layout: opts.layout as AnyLayout | undefined,
      catchFn: opts.catch as AnyCatch | undefined,
      dependencies: opts.dependencies as ReadonlyArray<AnyDependency> | undefined,
    };
  }

  // Two args
  if (third === undefined) {
    if (isHandlerOptions(second)) {
      // Overload 3: match(route, options)
      const opts = second as MatchHandlerOptions<any, any, any, any, any, any, any, any, any>;
      return {
        route: first as Route.Any,
        handler: opts.handler,
        guard: undefined,
        layout: opts.layout as AnyLayout | undefined,
        catchFn: opts.catch as AnyCatch | undefined,
        dependencies: opts.dependencies as ReadonlyArray<AnyDependency> | undefined,
      };
    }
    // Overloads 1, 2, 4: match(route, handler)
    return {
      route: first as Route.Any,
      handler: second,
      guard: undefined,
      layout: undefined,
      catchFn: undefined,
      dependencies: undefined,
    };
  }

  // Three args
  if (isHandlerOptions(third)) {
    // Overload 7: match(route, guard, options)
    const opts = third as MatchHandlerOptions<any, any, any, any, any, any, any, any, any>;
    return {
      route: first as Route.Any,
      handler: opts.handler,
      guard: second as AnyGuard,
      layout: opts.layout as AnyLayout | undefined,
      catchFn: opts.catch as AnyCatch | undefined,
      dependencies: opts.dependencies as ReadonlyArray<AnyDependency> | undefined,
    };
  }

  // Overloads 5, 6, 8: match(route, guard, handler)
  return {
    route: first as Route.Any,
    handler: third,
    guard: second as AnyGuard,
    layout: undefined,
    catchFn: undefined,
    dependencies: undefined,
  };
}

class MatcherImpl<A, E, R> implements Matcher<A, E, R> {
  readonly [FxTypeId]: Fx.Fx.Variance<
    A,
    E | RouteNotFound | RouteDecodeError | RouteGuardError,
    R | Scope.Scope | Router
  > = {
    _A: identity,
    _E: identity,
    _R: identity,
  };
  readonly cases: ReadonlyArray<MatchAst>;
  constructor(cases: ReadonlyArray<MatchAst>) {
    this.cases = cases;
    this.match = this.match.bind(this);
    this.catch = this.catch.bind(this);
    this.catchTag = this.catchTag.bind(this);
    this.redirectTo = this.redirectTo.bind(this);
    this.layout = this.layout.bind(this);
    this.provide = this.provide.bind(this);
    this.provideService = this.provideService.bind(this);
  }

  // Implementation overloads for type inference - use simplified return types
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: (params: RefSubject.RefSubject<Route.Type<Rt>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;
  match<Rt extends Route.Any, B, E2 = never, R2 = never>(
    route: Rt,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2, R | R2 | Scope.Scope>;
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    options: MatchHandlerOptions<Route.Type<Rt>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;
  match<Rt extends Route.Any, B>(route: Rt, handler: B): Matcher<A | B, E, R | Scope.Scope>;
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B, E2, R2>(
    route: Rt,
    guard: G,
    handler: (params: RefSubject.RefSubject<GuardOutput<G>>) => MatchHandlerReturnValue<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B, E2, R2>(
    route: Rt,
    guard: G,
    handler: Fx.Fx<B, E2, R2> | Effect.Effect<B, E2, R2> | Stream.Stream<B, E2, R2>,
  ): Matcher<A | B, E | E2 | GuardError<G>, R | R2 | GuardServices<G> | Scope.Scope>;
  match<
    Rt extends Route.Any,
    G extends GuardInput<Route.Type<Rt>, any, any, any>,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    route: Rt,
    guard: G,
    options: MatchHandlerOptions<GuardOutput<G>, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["e"],
    | R
    | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, GuardError<G>, GuardServices<G>>["r"]
    | Scope.Scope
  >;
  match<Rt extends Route.Any, G extends GuardInput<Route.Type<Rt>, any, any, any>, B>(
    route: Rt,
    guard: G,
    handler: B,
  ): Matcher<A | B, E | GuardError<G>, R | GuardServices<G> | Scope.Scope>;
  match<
    Rt extends Route.Any,
    B,
    E2 = never,
    R2 = never,
    D extends ReadonlyArray<AnyDependency> | undefined = undefined,
    LB = B,
    LE2 = never,
    LR2 = never,
    C extends CatchHandler<any, any, any, any> | undefined = undefined,
  >(
    options: MatchOptions<Rt, B, E2, R2, D, LB, LE2, LR2, C>,
  ): Matcher<
    A | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["a"],
    E | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["e"],
    R | ComputeMatchResult<E2, R2, D, LB, LE2, LR2, C, never, never>["r"] | Scope.Scope
  >;
  match(...args: [unknown, ...Array<unknown>]): Matcher<any, any, any> {
    const parsed = parseMatchArgs(args);
    const normalizedGuard =
      parsed.guard !== undefined
        ? getGuard(parsed.guard as GuardInput<any, any, any, any>)
        : defaultGuard();

    const routeAst = AST.route(
      parsed.route.ast,
      parsed.handler as MatchHandler<any, any, any, any>,
      normalizedGuard,
    );

    let matches: ReadonlyArray<MatchAst> = [routeAst];
    if (parsed.layout !== undefined) {
      matches = [AST.layout(matches, parsed.layout)];
    }
    if (parsed.catchFn !== undefined) {
      matches = [AST.catchCause(matches, parsed.catchFn)];
    }
    if (parsed.dependencies !== undefined && parsed.dependencies.length > 0) {
      matches = [AST.layer(matches, normalizeDependencies(parsed.dependencies))];
    }

    return new MatcherImpl([...this.cases, ...matches]);
  }

  prefix<Rt extends Route.Any>(route: Rt): Matcher<A, E, R> {
    return new MatcherImpl<A, E, R>([AST.prefixed(this.cases, route.ast)]);
  }

  provide<Layers extends readonly [AnyLayer, ...AnyLayer[]]>(
    ...layers: Layers
  ): Matcher<
    A,
    E | LayerError<Layers[number]>,
    Exclude<R, LayerSuccess<Layers[number]>> | LayerServices<Layers[number]>
  > {
    return new MatcherImpl([AST.layer(this.cases, layers)]) as Matcher<
      A,
      E | LayerError<Layers[number]>,
      Exclude<R, LayerSuccess<Layers[number]>> | LayerServices<Layers[number]>
    >;
  }

  provideService<Id, S>(tag: Context.Service<Id, S>, service: S): Matcher<A, E, Exclude<R, Id>> {
    return this.provideContext(Context.make(tag, service));
  }

  provideContext<R2>(services: Context.Context<R2>): Matcher<A, E, Exclude<R, R2>> {
    return this.provide(Layer.succeedContext(services));
  }

  catchCause<B, E2, R2>(f: CatchHandler<E, B, E2, R2>): Matcher<A | B, E2, R | R2> {
    return new MatcherImpl<A | B, E2, R | R2>([AST.catchCause(this.cases, f as AnyCatch)]);
  }

  catch<B, E2, R2>(f: (e: E) => Fx.Fx<B, E2, R2>): Matcher<A | B, E2, R | R2> {
    return this.catchCause((causeRef) =>
      unwrap(
        Effect.gen(function* () {
          const cause = yield* causeRef;
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return fromEffect(Effect.failCause(result.failure));
          }
          return f(result.success.error);
        }),
      ),
    );
  }

  catchTag<const K extends Tags<E> | Arr.NonEmptyReadonlyArray<Tags<E>>, B, E2, R2>(
    tag: K,
    f: (
      e: ExtractTag<NoInfer<E>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx.Fx<B, E2, R2>,
  ): Matcher<
    A | B,
    E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    R | R2
  > {
    const rethrow = (cause: Cause.Cause<E>) =>
      fromEffect(Effect.failCause(cause)) as Fx.Fx<
        B,
        E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
        R2
      >;

    return new MatcherImpl<
      A | B,
      E2 | ExcludeTag<E, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
      R | R2
    >([
      AST.catchCause(this.cases, (causeRef) =>
        unwrap(
          Effect.gen(function* () {
            const cause = yield* causeRef;
            const result = Cause.findFail(cause);
            if (Result.isFailure(result)) {
              return rethrow(cause);
            }
            if (matchesTag(tag, result.success.error)) {
              return f(result.success.error);
            }
            return rethrow(cause);
          }),
        ),
      ),
    ]);
  }

  redirectTo(path: string): Fx.Fx<
    A,
    Exclude<E, RouteNotFound> | RouteDecodeError | RouteGuardError,
    R | Router | Scope.Scope
  > {
    // The standalone helper extracts channels through conditional types; this facade already
    // has their concrete A/E/R correspondence through the Matcher contract.
    return redirectTo(path)<Matcher<A, E, R>>(this) as ReturnType<Matcher<A, E, R>["redirectTo"]>;
  }

  layout<B, E2, R2>(layout: Layout<any, A, E, R, B, E2, R2>): Matcher<B, E | E2, R | R2> {
    return new MatcherImpl<B, E | E2, R | R2>([
      AST.layout(this.cases, layout as AnyLayout),
    ]) as Matcher<B, E | E2, R | R2>;
  }

  merge<const Others extends ReadonlyArray<Matcher.Any>>(
    ...others: Others
  ): Matcher<
    A | Matcher.MergeSuccess<Others>,
    E | Matcher.MergeError<Others>,
    R | Matcher.MergeServices<Others>
  > {
    const allCases = [...this.cases, ...others.flatMap((m) => m.cases)];
    return new MatcherImpl(allCases) as Matcher<
      A | Matcher.MergeSuccess<Others>,
      E | Matcher.MergeError<Others>,
      R | Matcher.MergeServices<Others>
    >;
  }

  pipe() {
    return pipeArguments(this, arguments);
  }

  run<RSink>(sink: Sink.Sink<A, E | RouteNotFound | RouteDecodeError | RouteGuardError, RSink>) {
    return Effect.gen({ self: this }, function* () {
      const current = yield* CurrentRoute;
      const prefixed = this.prefix(current.route);
      const entries = yield* Effect.try({
        try: () => compile(prefixed.cases),
        catch: (error) =>
          new RouteDecodeError({
            path: current.route.path,
            cause: error instanceof Error ? error.message : String(error),
          }),
      });
      const executor = yield* makeRouteExecutor<A, E, R>();
      const router = makePathRouter<ReadonlyArray<CompiledEntry>>();
      const handlersByPath = new Map<string, Array<CompiledEntry>>();
      for (const entry of entries) {
        for (const path of getMatcherPaths(entry.route.ast)) {
          const existing = handlersByPath.get(path.key);
          if (existing !== undefined) {
            existing.push(entry);
          } else {
            const list: Array<CompiledEntry> = [entry];
            handlersByPath.set(path.key, list);
            yield* Effect.try({
              try: () => router.on(path.parts, list),
              catch: (error) =>
                new RouteDecodeError({
                  path: path.key,
                  cause: error instanceof Error ? error.message : String(error),
                }),
            });
          }
        }
      }

      const stream = CurrentPath.pipe(
        mapEffect(
          Effect.fn(function* (path) {
            const result = router.find(path);
            if (result === undefined) return yield* new RouteNotFound({ path });
            return yield* executor.transition({
              path,
              input: { ...result.searchParams, ...result.params },
              candidates: result.handler,
            });
          }),
        ),
        skipRepeats,
        switchMap(identity),
      );

      return yield* stream.run(sink);
    }).pipe(Effect.catchCause((cause) => sink.onFailure(cause)));
  }
}

function normalizeHandler<Params, B, E2 = never, R2 = never>(
  handler: MatchHandler<Params, B, E2, R2>,
): (params: RefSubject.RefSubject<Params>) => Fx.Fx<B, E2, R2> {
  if (isMatchHandlerFn(handler)) return (params) => toFx(handler(params));
  return () => toFx(handler);
}

function toFx<A, E, R>(
  value: Fx.Fx<A, E, R> | Stream.Stream<A, E, R> | Effect.Effect<A, E, R> | A,
): Fx.Fx<A, E, R> {
  if (isFx(value)) return value;
  if (Stream.isStream(value)) return fromStream(value);
  if (Effect.isEffect(value)) return fromEffect(value);
  return succeed(value);
}

/**
 * An immutable Matcher with no registered cases.
 *
 * @remarks
 * ## Why
 * It is the neutral starting value for fluent route registration.
 *
 * ## Ownership and lifetime
 * This singleton stores an empty immutable case array and owns no Scope. Match calls return new Matcher values without mutating it.
 *
 * @since 1.0.0
 * @category Route handlers
 */
export const empty: Matcher<never> = new MatcherImpl([]);
/**
 * The standalone route-registration function bound to `empty`.
 *
 * @remarks
 * ## Why
 * Functional composition gets the same overloads and ordering semantics as `Matcher.match`.
 *
 * ## Ownership and lifetime
 * Calling the bound function only allocates a Matcher case value. Handler, guard, Layer, and layout resources remain dormant until that Matcher runs.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 *
 * const home = Router.match(Router.Parse("/"), "home")
 * ```
 *
 * @since 1.0.0
 * @category Route handlers
 */
export const match: Matcher<never>["match"] = empty.match.bind(empty);

/**
 * Combines matcher case arrays in argument order.
 *
 * @remarks
 * ## Why
 * Independent route tables retain their local layouts and providers while sharing one execution stream.
 *
 * ## Ownership and lifetime
 * The function allocates a Matcher containing concatenated immutable case arrays. It does not acquire any Layer or subscribe to Navigation.
 *
 * @since 1.0.0
 * @category Matcher composition
 */
export function merge<const Matchers extends ReadonlyArray<Matcher.Any>>(
  ...matchers: Matchers
): Matcher<
  Matcher.MergeSuccess<Matchers>,
  Matcher.MergeError<Matchers>,
  Matcher.MergeServices<Matchers>
> {
  if (matchers.length === 0) {
    return empty as unknown as Matcher<
      Matcher.MergeSuccess<Matchers>,
      Matcher.MergeError<Matchers>,
      Matcher.MergeServices<Matchers>
    >;
  }
  if (matchers.length === 1) {
    return matchers[0] as unknown as Matcher<
      Matcher.MergeSuccess<Matchers>,
      Matcher.MergeError<Matchers>,
      Matcher.MergeServices<Matchers>
    >;
  }
  const first = matchers[0] as MatcherImpl<
    Matcher.MergeSuccess<Matchers>,
    Matcher.MergeError<Matchers>,
    Matcher.MergeServices<Matchers>
  >;
  const rest = matchers.slice(1) as ReadonlyArray<
    Matcher<
      Matcher.MergeSuccess<Matchers>,
      Matcher.MergeError<Matchers>,
      Matcher.MergeServices<Matchers>
    >
  >;
  return first.merge(...rest) as unknown as Matcher<
    Matcher.MergeSuccess<Matchers>,
    Matcher.MergeError<Matchers>,
    Matcher.MergeServices<Matchers>
  >;
}

export { RouteDecodeError, RouteGuardError, RouteNotFound } from "./RouteExecutor.js";

/**
 * A normalized executable route candidate produced from Match AST.
 *
 * @remarks
 * ## Why
 * The executor can evaluate decoding, dependencies, guards, layouts, and catches in a fixed order.
 *
 * ## Ownership and lifetime
 * Internal compiled data only. The executor borrows an entry during transitions; selected child scopes own the resources described by its layers, layouts, and handler.
 *
 * @since 1.0.0
 * @category Route compilation
 * @internal
 */
export type CompiledEntry = {
  /**
   * Route whose path shape selected this internal candidate list.
   *
   * @remarks
   * ## Why
   * The executor needs the Route identity and schemas after path lookup.
   *
   * ## Ownership and lifetime
   * Internal compiled data retains the immutable Route by reference; the selected route Scope owns
   * execution, not this property.
   *
   * @since 1.0.0
   * @category Route compilation
   */
  readonly route: Route.Any;
  /**
   * Guard evaluated after decoding and dependency preparation.
   *
   * @remarks
   * ## Why
   * `None` and failure can fall through to the next candidate sharing the matcher path.
   *
   * ## Ownership and lifetime
   * The compiled entry retains the function. Services acquired for one attempt are committed only
   * if this guard selects the candidate.
   *
   * @since 1.0.0
   * @category Candidate guards
   */
  readonly guard: AnyGuard;
  /**
   * Output producer mounted when this candidate wins.
   *
   * @remarks
   * ## Why
   * Values, Effect, Stream, and Fx handlers normalize to one execution contract.
   *
   * ## Ownership and lifetime
   * The entry retains the handler function; the executor's selected route Scope owns its returned Fx
   * and interrupts it when another entry replaces it.
   *
   * @since 1.0.0
   * @category Route compilation
   */
  readonly handler: AnyMatchHandler;
  /**
   * Ordered Effect Layers prepared for this candidate.
   *
   * @remarks
   * ## Why
   * Dependencies can be acquired before the guard and rolled back if it rejects.
   *
   * ## Ownership and lifetime
   * The array and Layer identities are retained by reference. The Layer manager owns child Scopes,
   * reuses stable identities, and closes rejected or removed Layers.
   *
   * @since 1.0.0
   * @category Route services
   */
  readonly layers: ReadonlyArray<AnyLayer>;
  /**
   * Layout functions ordered from outermost to innermost.
   *
   * @remarks
   * ## Why
   * The layout manager can acquire in reverse order to produce `outer(inner(handler))` nesting.
   *
   * ## Ownership and lifetime
   * Stable function identity controls child-Scope reuse; removed layouts are finalized after the
   * replacement subtree has been prepared.
   *
   * @since 1.0.0
   * @category Route compilation
   */
  readonly layouts: ReadonlyArray<AnyLayout>;
  /**
   * Reactive cause handlers ordered from outermost to innermost.
   *
   * @remarks
   * ## Why
   * Complete causes can cross nested boundaries without collapsing typed failures or defects.
   *
   * ## Ownership and lifetime
   * Stable handler identity controls catch child-Scope reuse; removed boundaries and their
   * RefSubjects are finalized by the catch manager.
   *
   * @since 1.0.0
   * @category Route compilation
   */
  readonly catches: ReadonlyArray<AnyCatch>;
  /**
   * Decodes raw matcher parameters with this route's combined Effect Schema.
   *
   * @remarks
   * ## Why
   * Decode failure can fall through while preserving the first failure for `RouteDecodeError`.
   *
   * ## Ownership and lifetime
   * Each call runs the Schema Effect with the candidate's prepared services. Only a selected decoded
   * value is retained in the active params RefSubject.
   *
   * @since 1.0.0
   * @category Route compilation
   */
  readonly decode: (input: unknown) => Effect.Effect<any, Schema.SchemaError, any>;
};

type InputSucces<T> = [Matcher.Success<T> | Fx.Fx.Success<T>] extends [infer A] ? A : never;
type InputError<T> = [Matcher.Error<T> | Fx.Fx.Error<T>] extends [infer E] ? E : never;
type InputServices<T> = [Matcher.Services<T> | Fx.Fx.Services<T>] extends [infer R] ? R : never;

/**
 * Handles complete causes from an Fx or Matcher with a reactive Cause RefSubject.
 *
 * @remarks
 * ## Why
 * Defects and interruption stay distinguishable from typed failures.
 *
 * ## Ownership and lifetime
 * Calling the combinator constructs an Fx. Running it creates a catch manager in the consumer Scope; that Scope owns the cause RefSubject and fallback subscriptions.
 *
 * @since 1.0.0
 * @category Route recovery
 */
export const catchCause: {
  /**
   * Creates a data-first or data-last complete-cause recovery Fx.
   *
   * @remarks
   * ## Why
   * Both call forms preserve the input's success and service types while exposing failure, defect,
   * and interruption through one reactive Cause RefSubject.
   *
   * ## Ownership and lifetime
   * Calling this signature only constructs an Fx. Its consumer Scope owns the catch manager, cause
   * RefSubject, input subscription, and fallback subscription.
   *
   * @since 1.0.0
   * @category Matcher type inference
   */
  <I extends Fx.Fx.Any | Matcher.Any, B, E2 = never, R2 = never>(
    f: (
      cause: RefSubject.RefSubject<
        Cause.Cause<InputError<I> | RouteNotFound | RouteDecodeError | RouteGuardError>
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): (input: I) => Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;

  <I extends Fx.Fx.Any | Matcher.Any, B, E2 = never, R2 = never>(
    input: I,
    f: (
      cause: RefSubject.RefSubject<
        Cause.Cause<InputError<I> | RouteNotFound | RouteDecodeError | RouteGuardError>
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(
    input: Fx.Fx<A, E, R> | Matcher<A, E, R>,
    f: (
      cause: RefSubject.RefSubject<
        Cause.Cause<E | RouteNotFound | RouteDecodeError | RouteGuardError>
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<A | B, E2, R | R2 | Router | Scope.Scope> => {
    const eff = Effect.gen(function* () {
      const fiberId = yield* Effect.fiberId;
      const rootScope = yield* Effect.scope;
      const manager = makeCatchManager(rootScope, fiberId);
      const result = yield* manager.apply([f], input, Context.empty() as Context.Context<any>);
      return result as Fx.Fx<A | B, E2, R | R2 | Router | Scope.Scope>;
    });
    return unwrap(eff);
  },
);

/**
 * Handles the first typed failure from an Fx or Matcher.
 *
 * @remarks
 * ## Why
 * Convenient recovery does not swallow defect or interruption causes.
 *
 * ## Ownership and lifetime
 * Calling the combinator constructs an Fx. Typed recovery runs inside the consumer Scope; defects and interruption are re-emitted without a replacement lifetime.
 *
 * @since 1.0.0
 * @category Route recovery
 */
export const catch_: {
  /**
   * Creates a data-first or data-last typed-failure recovery Fx.
   *
   * @remarks
   * ## Why
   * The first typed failure is recoverable without converting defects or interruption into ordinary
   * application errors.
   *
   * ## Ownership and lifetime
   * Calling this signature only constructs an Fx. Recovery runs in the consumer Scope; unmatched
   * complete causes are forwarded without starting a fallback subscription.
   *
   * @since 1.0.0
   * @category Route recovery
   */
  <I extends Fx.Fx.Any | Matcher.Any, B, E2, R2>(
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): (input: I) => Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;

  <I extends Fx.Fx.Any | Matcher.Any, B, E2, R2>(
    input: I,
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope>;
} = dual(
  2,
  <I extends Fx.Fx.Any | Matcher.Any, B, E2, R2>(
    input: I,
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<InputSucces<I> | B, E2, InputServices<I> | R2 | Router | Scope.Scope> =>
    catchCause(input, (causeRef) =>
      unwrap(
        Effect.gen(function* () {
          const cause = yield* causeRef;
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return fromEffect(Effect.failCause(result.failure));
          }
          return f(result.success.error as InputError<I>);
        }),
      ),
    ),
);

export { catch_ as catch };

/**
 * Handles selected tagged failures and preserves unmatched variants.
 *
 * @remarks
 * ## Why
 * Recovery narrows the error union instead of erasing it.
 *
 * ## Ownership and lifetime
 * Calling the combinator constructs an Fx. A matching fallback runs in the consumer Scope; unmatched causes are forwarded unchanged.
 *
 * @since 1.0.0
 * @category Route recovery
 */
export const catchTag: {
  /**
   * Creates a data-first or data-last recovery Fx for selected error tags.
   *
   * @remarks
   * ## Why
   * Matching tags are removed from the resulting error union while unmatched tags and complete
   * non-failure causes remain visible.
   *
   * ## Ownership and lifetime
   * Calling this signature only constructs an Fx. A matching fallback is subscribed in the consumer
   * Scope; unmatched causes reuse the original cause without acquiring fallback work.
   *
   * @since 1.0.0
   * @category Route recovery
   */
  <
    I extends Fx.Fx.Any | Matcher.Any,
    const K extends Tags<InputError<I>> | Arr.NonEmptyReadonlyArray<Tags<InputError<I>>>,
    B,
    E2,
    R2,
  >(
    k: K,
    f: (
      e: ExtractTag<
        NoInfer<InputError<I>>,
        K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
      >,
    ) => Fx.Fx<B, E2, R2>,
  ): (
    input: I,
  ) => Fx.Fx<
    InputSucces<I> | B,
    E2 | ExcludeTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    InputServices<I> | R2 | Router | Scope.Scope
  >;

  <
    I extends Fx.Fx.Any | Matcher.Any,
    const K extends Tags<InputError<I>> | Arr.NonEmptyReadonlyArray<Tags<InputError<I>>>,
    B,
    E2,
    R2,
  >(
    input: I,
    k: K,
    f: (
      e: ExtractTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    ) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<
    InputSucces<I> | B,
    E2 | ExcludeTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    InputServices<I> | R2 | Router | Scope.Scope
  >;
} = dual(
  3,
  <
    I extends Fx.Fx.Any | Matcher.Any,
    const K extends Tags<InputError<I>> | Arr.NonEmptyReadonlyArray<Tags<InputError<I>>>,
    B,
    E2,
    R2,
  >(
    input: I,
    k: K,
    f: (e: InputError<I>) => Fx.Fx<B, E2, R2>,
  ): Fx.Fx<
    InputSucces<I> | B,
    E2 | ExcludeTag<InputError<I>, K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K>,
    InputServices<I> | R2 | Router | Scope.Scope
  > => {
    type RemainingError = ExcludeTag<
      InputError<I>,
      K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
    >;
    const rethrow = (
      cause: Cause.Cause<InputError<I> | RouteNotFound | RouteDecodeError | RouteGuardError>,
    ) =>
      fromEffect(Effect.failCause(cause as Cause.Cause<RemainingError>)) as Fx.Fx<
        B,
        E2 | RemainingError,
        R2
      >;

    return catchCause(input, (causeRef) =>
      unwrap(
        Effect.gen(function* () {
          const cause = yield* causeRef;
          const result = Cause.findFail(cause);
          if (Result.isFailure(result)) {
            return fromEffect(Effect.failCause(result.failure));
          }
          if (matchesTag(k, result.success.error)) {
            return f(
              result.success.error as ExtractTag<
                InputError<I>,
                K extends Arr.NonEmptyReadonlyArray<string> ? K[number] : K
              >,
            );
          }
          return rethrow(cause);
        }),
      ),
    );
  },
);

/**
 * Retries a Matcher or Fx once after navigating on `RouteNotFound`.
 *
 * Prefer the fluent `matcher.redirectTo(path)` method when configuring a Matcher. This standalone
 * form remains useful for inputs already expressed as Fx and for existing data-last pipelines.
 *
 * @remarks
 * ## Why
 * A fallback route can redirect without masking matched-handler failures or redirecting forever.
 *
 * ## Ownership and lifetime
 * Calling `redirectTo` constructs an Fx and retains only the target string and input. Its single retry and Navigation operation run in the consumer Scope.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 *
 * const app = Router.match(Router.Parse("/"), "home")
 * const withFallback = Router.redirectTo("/not-found")(app)
 * ```
 *
 * @since 1.0.0
 * @category Route recovery
 */
export const redirectTo =
  (path: string) =>
  <I extends Fx.Fx.Any | Matcher.Any>(
    input: I,
  ): Fx.Fx<
    InputSucces<I>,
    Exclude<InputError<I>, RouteNotFound>,
    Router | Scope.Scope | InputServices<I>
  > =>
    makeFx<
      InputSucces<I>,
      Exclude<InputError<I>, RouteNotFound>,
      Router | Scope.Scope | InputServices<I>
    >((sink) =>
      Effect.gen(function* () {
        let redirected = false;
        const runOnce = (target: typeof sink) =>
          input.run(
            Sink.make(
              (cause) =>
                Effect.gen(function* () {
                  if (redirected) return yield* target.onFailure(cause as Cause.Cause<any>);
                  const failure = Cause.findFail(cause);
                  if (Result.isFailure(failure) || failure.success.error._tag !== "RouteNotFound") {
                    return yield* target.onFailure(cause as Cause.Cause<any>);
                  }
                  redirected = true;
                  yield* Navigation.navigate(path).pipe(
                    Effect.catchCause((navCause) => target.onFailure(navCause as Cause.Cause<any>)),
                  );
                  return yield* input.run(target as any);
                }) as Effect.Effect<unknown, never, any>,
              (value) => target.onSuccess(value),
            ),
          );
        return yield* runOnce(sink);
      }),
    );

const hasTag = (u: unknown): u is { readonly _tag: string } =>
  typeof u === "object" &&
  u !== null &&
  "_tag" in u &&
  typeof (u as Record<string, unknown>)["_tag"] === "string";

const matchesTag = <E, K extends string>(
  tag: K | Arr.NonEmptyReadonlyArray<K>,
  error: E,
): error is ExtractTag<E, K> => {
  if (!hasTag(error)) return false;
  if (typeof tag === "string") return error._tag === tag;
  return tag.some((t) => t === error._tag);
};

function isServiceMap(dep: AnyDependency): dep is AnyServiceMap {
  return !Layer.isLayer(dep);
}

function toSingleLayer(dep: AnyDependency): AnyLayer {
  if (isServiceMap(dep)) return Layer.succeedContext(dep);
  return dep;
}

function normalizeDependencies(
  dependencies: ReadonlyArray<AnyDependency>,
): ReadonlyArray<AnyLayer> {
  return dependencies.map(toSingleLayer);
}

type NormalizeLayer<T extends AnyDependency> =
  T extends Layer.Layer<infer A, infer E, infer R>
    ? Layer.Layer<A, E, R>
    : T extends Context.Context<infer R>
      ? Layer.Layer<R>
      : never;

type NormalizeLayers<T extends ReadonlyArray<AnyDependency>> = {
  [K in keyof T]: NormalizeLayer<T[K]>;
};

type ToLayer<T> =
  T extends ReadonlyArray<AnyLayer>
    ? Layer.Layer<Layer.Success<T[number]>, Layer.Error<T[number]>, Layer.Services<T[number]>>
    : never;

type NormalizeDeps<T extends AnyDependency | ReadonlyArray<AnyDependency>> = T extends AnyDependency
  ? NormalizeLayer<T>
  : T extends ReadonlyArray<AnyDependency>
    ? ToLayer<NormalizeLayers<T>>
    : never;

/**
 * Normalizes one dependency or a dependency array to a single Effect Layer.
 *
 * @remarks
 * ## Why
 * Advanced builders can use the same Context-to-Layer conversion and merge policy as Matcher.
 *
 * ## Ownership and lifetime
 * The function performs synchronous normalization and acquires no services. Returned Layers acquire only when a Matcher is run inside a Scope.
 *
 * @since 1.0.0
 * @category Route services
 */
export function normalizeDependencyInput<Deps extends AnyDependency | ReadonlyArray<AnyDependency>>(
  input: Deps,
): NormalizeDeps<Deps> {
  const arr = Array.isArray(input) ? input : [input];
  const layers = normalizeDependencies(arr as AnyDependency[]);
  return mergeLayers(layers) as NormalizeDeps<Deps>;
}

function defaultGuard<A>(): GuardType<A, A> {
  return Effect.succeedSome;
}

function mergeLayers(layers: ReadonlyArray<AnyLayer>): AnyLayer {
  if (layers.length === 0) return Layer.empty;
  if (layers.length === 1) return layers[0];
  let current = layers[0];
  for (let i = 1; i < layers.length; i++) {
    current = Layer.merge(current, layers[i]);
  }
  return current;
}

/**
 * Compiles Match AST cases into ordered executable route candidates.
 *
 * @remarks
 * ## Why
 * Registration syntax errors surface before reactive navigation begins, and case order remains explicit.
 *
 * ## Ownership and lifetime
 * The function performs synchronous normalization and acquires no services. Returned Layers acquire only when a Matcher is run inside a Scope.
 *
 * @since 1.0.0
 * @category Route compilation
 * @internal
 */
export function compile(cases: ReadonlyArray<MatchAst>): ReadonlyArray<CompiledEntry> {
  const entries: Array<CompiledEntry> = [];

  const visit = (
    matches: ReadonlyArray<MatchAst>,
    context: {
      readonly layers: ReadonlyArray<AnyLayer>;
      readonly layouts: ReadonlyArray<AnyLayout>;
      readonly catches: ReadonlyArray<AnyCatch>;
      readonly prefixes: ReadonlyArray<RouteAst>;
    },
  ): void => {
    for (const match of matches) {
      switch (match.type) {
        case "route": {
          const baseRoute = makeRoute(match.route);
          const prefixedRoute = applyPrefixes(baseRoute, context.prefixes);
          const guard = getGuard(match.guard as GuardInput<any, any, any, any>);
          const handler = normalizeHandler(match.handler);
          const decode = makeRouteDecoder(prefixedRoute);
          entries.push({
            route: prefixedRoute,
            guard,
            handler,
            layers: context.layers,
            layouts: context.layouts,
            catches: context.catches,
            decode,
          });
          break;
        }
        case "layer": {
          const merged = mergeLayers(match.deps);
          visit(match.matches, {
            ...context,
            layers: [...context.layers, merged],
          });
          break;
        }
        case "layout": {
          visit(match.matches, {
            ...context,
            layouts: [...context.layouts, match.layout as AnyLayout],
          });
          break;
        }
        case "prefixed": {
          visit(match.matches, {
            ...context,
            prefixes: [...context.prefixes, match.prefix],
          });
          break;
        }
        case "catch": {
          visit(match.matches, {
            ...context,
            catches: [...context.catches, match.f as AnyCatch],
          });
          break;
        }
      }
    }
  };

  visit(cases, { layers: [], layouts: [], catches: [], prefixes: [] });
  return entries;
}

function getMatcherPaths(
  ast: RouteAst,
): ReadonlyArray<{ readonly key: string; readonly parts: ReadonlyArray<AST.PathAst> }> {
  let variants: Array<Array<AST.PathAst>> = [[]];
  for (const part of Path.flattenRouteAst(ast)) {
    if (part.type === "query-params") continue;
    if (part.type === "parameter" && part.optional) {
      const required = AST.parameter(part.name, undefined, part.regex);
      variants = variants.flatMap((variant) => [[...variant, required], variant]);
    } else {
      variants = variants.map((variant) => [...variant, part]);
    }
  }

  const paths = new Map<string, ReadonlyArray<AST.PathAst>>();
  for (const variant of variants) {
    const parts = normalizeMatcherPath(variant);
    paths.set(Path.join(parts), parts);
  }
  return Array.from(paths, ([key, parts]) => ({ key, parts }));
}

function normalizeMatcherPath(parts: ReadonlyArray<AST.PathAst>): ReadonlyArray<AST.PathAst> {
  const normalized: Array<AST.PathAst> = [];
  for (const part of parts) {
    if (part.type === "slash" && normalized.at(-1)?.type === "slash") continue;
    normalized.push(part);
  }
  if (normalized.at(-1)?.type === "slash") normalized.pop();
  return normalized;
}

function makeRouteDecoder(route: Route.Any): CompiledEntry["decode"] {
  const query = Path.getQueryInputParameters(route.ast);
  const decodeParams = Schema.decodeUnknownEffect(route.paramsSchema);
  const decodeQuery = Schema.decodeUnknownEffect(Path.getQueryInputSchema(route.ast));

  return (input) => {
    const normalized =
      typeof input === "object" && input !== null
        ? { ...(input as Record<PropertyKey, unknown>) }
        : {};

    if (query.length === 0) return decodeParams(normalized);

    return decodeQuery(input).pipe(
      Effect.flatMap((decoded) => {
        const queryInput = decoded as Record<PropertyKey, unknown>;
        for (const parameter of query) {
          if (parameter.outputName !== undefined && parameter.inputName in queryInput) {
            normalized[parameter.outputName] = queryInput[parameter.inputName];
          }
        }
        return decodeParams(normalized);
      }),
    );
  };
}

function applyPrefixes(route: Route.Any, prefixes: ReadonlyArray<RouteAst>): Route.Any {
  if (prefixes.length === 0) return route;
  const prefixRoutes = prefixes
    .map((prefix) => makeRoute(prefix))
    .filter((prefix) => prefix.path !== "/");
  if (prefixRoutes.length === 0) return route;
  return Join(...prefixRoutes, route);
}

export { makeCatchManager, makeLayerManager, makeLayoutManager };
