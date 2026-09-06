import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { interrupt } from "effect/Exit";
import { identity } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import { makeFormatterDefault } from "effect/SchemaIssue";
import * as Semaphore from "effect/Semaphore";
import * as Scope from "effect/Scope";
import { Fx, RefSubject } from "@typed/fx";
import { exit, mapEffect, provideContext, skipRepeats, succeed, switchMap } from "@typed/fx/Fx";
import type { AnyCatch, AnyLayer, AnyLayout, AnyServiceMap, CompiledEntry } from "./Matcher.js";
import type { Router } from "./Router.js";

/**
 * The path, raw input, candidate list, and ambient Layers for one route update.
 *
 * @remarks
 * ## Why
 * Candidate selection and parameter decoding can be executed independently from path lookup.
 *
 * ## Ownership and lifetime
 * Callers construct this immutable transition value for one `transition` call. The executor reads it
 * during that call; any selected entry, decoded parameters, Layers, layouts, or catch handlers are then
 * retained by their dedicated scoped managers rather than by this record itself.
 *
 * @since 1.0.0
 * @category Candidate execution
 */
export interface RouteTransition {
  /**
   * The current pathname and search string being transitioned.
   *
   * @remarks
   * ## Why
   * Typed errors and candidate selection retain the exact location that produced them.
   *
   * ## Ownership and lifetime
   * The executor reads this string while selecting candidates and reporting failures. It does not retain
   * the string after the transition completes.
   *
   * @since 1.0.0
   * @category Candidate execution
   */
  readonly path: string;
  /**
   * The raw path and query parameter record decoded by each candidate.
   *
   * @remarks
   * ## Why
   * Each candidate applies its own Effect Schema before a handler observes values.
   *
   * ## Ownership and lifetime
   * Candidate schemas inspect this value during the transition. Only the decoded parameters for the
   * selected candidate are placed in the active `RefSubject`; the raw input is not retained.
   *
   * @since 1.0.0
   * @category Candidate execution
   */
  readonly input: unknown;
  /**
   * The ordered executable candidates selected by path lookup.
   *
   * @remarks
   * ## Why
   * These candidates already share the matcher path selected by path lookup. Their schemas and guards
   * fall through in registration order without rerunning path-shape selection.
   *
   * ## Ownership and lifetime
   * The executor borrows this array for the transition. A selected entry identity remains current until
   * another route replaces it, but the executor does not copy or own the candidate array.
   *
   * @since 1.0.0
   * @category Candidate execution
   */
  readonly candidates: ReadonlyArray<CompiledEntry>;
  /**
   * Additional Effect Layers applied to this transition.
   *
   * @remarks
   * ## Why
   * Ambient route dependencies can participate in the same prepare, commit, rollback, and release protocol.
   *
   * ## Ownership and lifetime
   * The Layer manager compares these values by identity. Selected Layer identities and their child Scopes
   * remain active until a later transition removes them or the executor's root Scope closes.
   *
   * @since 1.0.0
   * @category Candidate execution
   */
  readonly layers?: ReadonlyArray<AnyLayer>;
}

/**
 * Transitions between decoded route candidates while retaining compatible mounted work.
 *
 * @remarks
 * ## Why
 * Parameter-only updates can reuse a handler; route changes switch scopes deterministically.
 *
 * ## Ownership and lifetime
 * An executor is acquired by `makeRouteExecutor` in a Scope. That Scope owns its current handler and the
 * Layer, layout, and catch managers reused across calls to `transition`.
 *
 * @since 1.0.0
 * @category Candidate execution
 */
export interface RouteExecutor<A, E = never, R = never> {
  /**
   * Decodes and selects the first accepted candidate for one route transition.
   *
   * @remarks
   * ## Why
   * Candidate schemas and guards run in their supplied order after path lookup has selected a matcher
   * shape. Decode failures, guard `None`, and guard failures fall through; selected identity controls
   * parameter reuse, and route changes switch the owned handler Scope.
   *
   * ## Ownership and lifetime
   * Calls are serialized by the executor's semaphore. Preparing a replacement occurs before commit;
   * rejection rolls back new Layer Scopes, while commit closes replaced handler and manager Scopes.
   *
   * @since 1.0.0
   * @category Candidate execution
   */
  readonly transition: (
    transition: RouteTransition,
  ) => Effect.Effect<
    Fx.Fx<A, E, R | Scope.Scope | Router>,
    E | RouteDecodeError | RouteGuardError,
    R
  >;
}

/**
 * Creates a scoped executor for route candidate decoding and selection.
 *
 * @remarks
 * ## Why
 * One owner coordinates layer rollback, guard order, layout reuse, catch boundaries, and handler finalization.
 *
 * ## Ownership and lifetime
 * The returned Effect must run inside the Scope that will own the executor. Do not let the executor escape
 * that Scope: closing it interrupts the selected handler and finalizes all Layer, layout, and catch children.
 *
 * @example
 * ```ts
 * import * as Router from "@typed/router"
 * import * as Effect from "effect/Effect"
 *
 * const useExecutor = Effect.scoped(
 *   Effect.gen(function* () {
 *     yield* Router.makeRouteExecutor<string>()
 *     yield* Effect.log("route executor is owned by this scope")
 *   })
 * )
 * ```
 *
 * @since 1.0.0
 * @category Candidate execution
 */
export function makeRouteExecutor<A, E = never, R = never>(): Effect.Effect<
  RouteExecutor<A, E, R>,
  never,
  R | Scope.Scope
> {
  return Effect.gen(function* () {
    const fiberId = yield* Effect.fiberId;
    const rootScope = yield* Effect.scope;
    const ambient = yield* Effect.context<R>();
    const memoMap = yield* Layer.makeMemoMap;
    const layerManager = makeLayerManager(memoMap, rootScope, fiberId);
    const layoutManager = makeLayoutManager(rootScope, fiberId);
    const catchManager = makeCatchManager(rootScope, fiberId);
    const lock = Semaphore.makeUnsafe(1).withPermits(1);

    let currentState: {
      readonly entry: CompiledEntry;
      readonly params: RefSubject.RefSubject<any>;
      readonly fx: Fx.Fx<A, E, R | Scope.Scope | Router>;
      readonly scope: Scope.Closeable;
    } | null = null;

    const transition = Effect.fn(function* ({
      path,
      input,
      candidates,
      layers = [],
    }: RouteTransition) {
      const guardCauses: Array<Cause.Cause<any>> = [];
      let firstDecodeError: RouteDecodeError | undefined;
      let decodedCandidate = false;
      let matchedEntry: CompiledEntry | undefined;
      let matchedParams: any;
      let matchedPrepared:
        | {
            readonly services: AnyServiceMap;
            readonly commit: Effect.Effect<void>;
            readonly rollback: Effect.Effect<void>;
          }
        | undefined;
      let matchedServices: Context.Context<any> | undefined;

      for (const entry of candidates) {
        const decoded = yield* entry.decode(input).pipe(
          Effect.map(Option.some),
          Effect.catch((cause) => {
            firstDecodeError ??= new RouteDecodeError({
              path,
              cause: makeFormatterDefault()(cause.issue),
            });
            return Effect.succeedNone;
          }),
        );
        if (Option.isNone(decoded)) continue;

        decodedCandidate = true;
        const params = decoded.value;
        const prepared = yield* layerManager.prepare([...entry.layers, ...layers]);
        const services = Context.merge(ambient, prepared.services);
        const guardExit = yield* entry
          .guard(params)
          .pipe(Effect.provideContext(services), Effect.exit);

        if (Exit.isFailure(guardExit)) {
          guardCauses.push(guardExit.cause);
          yield* prepared.rollback;
          continue;
        }
        if (Option.isNone(guardExit.value)) {
          yield* prepared.rollback;
          continue;
        }

        matchedEntry = entry;
        matchedParams = guardExit.value.value;
        matchedPrepared = prepared;
        matchedServices = services;
        break;
      }

      if (
        matchedEntry === undefined ||
        matchedPrepared === undefined ||
        matchedServices === undefined
      ) {
        if (!decodedCandidate && firstDecodeError !== undefined) {
          return yield* firstDecodeError;
        }
        return yield* new RouteGuardError({ path, causes: guardCauses });
      }

      yield* matchedPrepared.commit;

      if (currentState !== null && currentState.entry === matchedEntry) {
        yield* RefSubject.set(currentState.params, matchedParams);
        yield* layoutManager.updateParams(matchedEntry.layouts, matchedParams);
        return currentState.fx;
      }

      if (currentState !== null) {
        yield* Scope.close(currentState.scope, interrupt(fiberId));
        currentState = null;
      }

      const scope = yield* Scope.fork(rootScope);
      const params = yield* RefSubject.make(matchedParams).pipe(Scope.provide(scope));
      const handlerServices = Context.add(matchedServices, Scope.Scope, scope);
      const handler = matchedEntry.handler(params).pipe(provideContext(handlerServices));
      const withLayouts = yield* layoutManager.apply(
        matchedEntry.layouts,
        matchedParams,
        handler,
        matchedServices,
      );
      const fx = yield* catchManager.apply(matchedEntry.catches, withLayouts, matchedServices);

      currentState = {
        entry: matchedEntry,
        params,
        scope,
        fx: fx as Fx.Fx<A, E, R | Scope.Scope | Router>,
      };
      return currentState.fx;
    });

    return { transition: (input) => lock(transition(input)) } satisfies RouteExecutor<A, E, R>;
  });
}

/**
 * Reports that every decoded candidate's guard failed or returned `None`.
 *
 * @remarks
 * ## Why
 * Guard rejection stays distinct from path absence and schema decoding failure.
 *
 * ## Ownership and lifetime
 * The executor allocates this immutable error only after every decoded guard candidate rejects. Its
 * Cause array remains reachable through the error until consumers release it.
 *
 * @since 1.0.0
 * @category Selection errors
 */
export class RouteGuardError extends Schema.Error<RouteGuardError>("@typed/router/RouteGuardError")(
  {
    _tag: Schema.tag("RouteGuardError"),
    path: Schema.String,
    causes: Schema.Array(Schema.Unknown),
  },
) {}

/**
 * Reports that path lookup produced no registered candidate.
 *
 * @remarks
 * ## Why
 * Redirect boundaries can catch absence without masking decode, guard, or handler failures.
 *
 * ## Ownership and lifetime
 * Path lookup creates this immutable error before decoding or acquiring candidate Layers. Catch and
 * redirect combinators may retain it only for the duration of their recovery Effect.
 *
 * @since 1.0.0
 * @category Selection errors
 */
export class RouteNotFound extends Schema.Error<RouteNotFound>("@typed/router/RouteNotFound")({
  _tag: Schema.tag("RouteNotFound"),
  path: Schema.String,
}) {}

/**
 * Reports route registration or parameter/query decoding failure.
 *
 * @remarks
 * ## Why
 * Invalid regex, schema input, and unsupported matcher paths remain typed and retain the affected path.
 *
 * ## Ownership and lifetime
 * Registration or execution allocates this immutable error with the affected path and formatted
 * cause. It owns no Schema service or route Scope.
 *
 * @since 1.0.0
 * @category Selection errors
 */
export class RouteDecodeError extends Schema.Error<RouteDecodeError>(
  "@typed/router/RouteDecodeError",
)({
  _tag: Schema.tag("RouteDecodeError"),
  path: Schema.String,
  cause: Schema.String,
}) {}

const closeScopes = (scopes: Iterable<Scope.Closeable>, fiberId: number) =>
  Effect.forEach(scopes, (scope) => Scope.close(scope, interrupt(fiberId)), {
    concurrency: "unbounded",
    discard: true,
  });

/**
 * Creates the internal scoped Layer prepare/commit/rollback manager.
 *
 * @remarks
 * ## Why
 * Rejected candidates must release acquisition while selected candidates reuse memoized services.
 *
 * ## Ownership and lifetime
 * `prepare` forks child Scopes only for newly requested Layer identities and returns explicit `commit` and
 * `rollback` Effects. Commit closes removed Layers in reverse order; rollback closes only additions from
 * the rejected preparation. `rootScope` remains their ultimate owner.
 *
 * @since 1.0.0
 * @category Route resource lifetimes
 * @internal
 */
export function makeLayerManager(memoMap: Layer.MemoMap, rootScope: Scope.Scope, fiberId: number) {
  const states = new Map<AnyLayer, { scope: Scope.Closeable; services: AnyServiceMap }>();
  let order: ReadonlyArray<AnyLayer> = [];
  let cachedDesiredSet: Set<AnyLayer> | undefined;
  let cachedOrder: ReadonlyArray<AnyLayer> | undefined;

  const prepare = (desired: ReadonlyArray<AnyLayer>) =>
    Effect.gen(function* () {
      const desiredSet =
        cachedOrder === desired
          ? cachedDesiredSet!
          : ((cachedDesiredSet = new Set(desired)), (cachedOrder = desired), cachedDesiredSet);
      const removed = order.filter((layer) => !desiredSet.has(layer));
      const added: Array<AnyLayer> = [];
      let services = Context.empty();

      for (const layer of desired) {
        const existing = states.get(layer);
        if (existing) {
          services = Context.merge(services, existing.services);
          continue;
        }

        const scope = yield* Scope.fork(rootScope);
        const buildExit = yield* Layer.buildWithMemoMap(layer, memoMap, scope).pipe(
          Effect.provideContext(services),
          Effect.exit,
        );

        if (Exit.isFailure(buildExit)) {
          for (let i = added.length - 1; i >= 0; i--) {
            const addedLayer = added[i];
            const addedState = states.get(addedLayer);
            if (addedState) {
              states.delete(addedLayer);
              yield* Scope.close(addedState.scope, interrupt(fiberId));
            }
          }
          yield* Scope.close(scope, buildExit);
          return yield* Effect.failCause(buildExit.cause);
        }

        const servicesForLayer = buildExit.value;
        services = Context.merge(services, servicesForLayer);
        states.set(layer, { scope, services: servicesForLayer });
        added.push(layer);
      }

      const commit = Effect.gen(function* () {
        for (let i = removed.length - 1; i >= 0; i--) {
          const layer = removed[i];
          const state = states.get(layer);
          if (state) {
            states.delete(layer);
            yield* Scope.close(state.scope, interrupt(fiberId));
          }
        }
        order = desired;
      });

      const rollback = Effect.gen(function* () {
        for (let i = added.length - 1; i >= 0; i--) {
          const layer = added[i];
          const state = states.get(layer);
          if (state) {
            states.delete(layer);
            yield* Scope.close(state.scope, interrupt(fiberId));
          }
        }
      });

      return { services, commit, rollback };
    });

  return { prepare };
}

/**
 * Creates the internal scoped layout reuse manager.
 *
 * @remarks
 * ## Why
 * The manager walks the compiled layout list in reverse: it acquires the innermost layout first,
 * then passes that Fx outward, yielding outer(inner(handler)) nesting. Stable identities update
 * parameters and content without remounting; removed layouts are finalized.
 *
 * ## Ownership and lifetime
 * Each newly seen layout gets a child Scope forked from `rootScope`; that child owns its params and
 * content RefSubjects. The manager reuses the child while the same layout identity remains active
 * and closes it when the layout disappears or `rootScope` is interrupted.
 *
 * @since 1.0.0
 * @category Route resource lifetimes
 * @internal
 */
export function makeLayoutManager(rootScope: Scope.Scope, fiberId: number) {
  const states = new Map<
    AnyLayout,
    {
      params: RefSubject.RefSubject<any>;
      content: RefSubject.RefSubject<Fx.Fx<any, any, any>>;
      fx: Fx.Fx<any, any, any>;
      scope: Scope.Closeable;
    }
  >();
  let active: ReadonlyArray<AnyLayout> = [];

  const removeUnused = (layouts: ReadonlyArray<AnyLayout>) =>
    Effect.gen(function* () {
      const next = new Set(layouts);
      const removed = active.filter((layout) => !next.has(layout));
      const scopes = removed.map((layout) => {
        const state = states.get(layout)!;
        states.delete(layout);
        return state.scope;
      });
      yield* closeScopes(scopes, fiberId);
      active = layouts;
    });

  const apply = (
    layouts: ReadonlyArray<AnyLayout>,
    paramsValue: any,
    inner: Fx.Fx<any, any, any>,
    services: Context.Context<any>,
  ) =>
    Effect.gen(function* () {
      let current = inner;
      for (let i = layouts.length - 1; i >= 0; i--) {
        const layout = layouts[i];
        const state = states.get(layout);
        if (state === undefined) {
          const scope = yield* Scope.fork(rootScope);
          const params = yield* RefSubject.make(paramsValue).pipe(Scope.provide(scope));
          const content = yield* RefSubject.make<Fx.Fx<any, any, any>>(Effect.succeed(current), {
            eq: (left, right) => left === right,
          }).pipe(Scope.provide(scope));
          const fx = layout({ params, content: content.pipe(switchMap(identity)) }).pipe(
            provideContext(Context.merge(services, Context.make(Scope.Scope, scope))),
          );
          states.set(layout, { params, content, fx, scope });
          current = fx;
        } else {
          yield* RefSubject.set(state.params, paramsValue);
          yield* RefSubject.set(state.content, current);
          current = state.fx;
        }
      }
      yield* removeUnused(layouts);
      return current;
    });

  const updateParams = (layouts: ReadonlyArray<AnyLayout>, paramsValue: any) =>
    Effect.forEach(
      layouts,
      (layout) => {
        const state = states.get(layout);
        return state !== undefined ? RefSubject.set(state.params, paramsValue) : Effect.void;
      },
      { discard: true },
    );

  return { apply, updateParams };
}

/**
 * Creates the internal scoped reactive cause-boundary manager.
 *
 * @remarks
 * ## Why
 * Fallback Fx values replace failed content while retaining complete Effect causes and cleanup.
 *
 * ## Ownership and lifetime
 * Each active catch handler owns a child Scope containing its cause and content RefSubjects. Handler
 * identity controls reuse; removed boundaries are closed, and `rootScope` closes every remaining child.
 *
 * @since 1.0.0
 * @category Route resource lifetimes
 * @internal
 */
export function makeCatchManager(rootScope: Scope.Scope, fiberId: number) {
  const states = new Map<
    AnyCatch,
    {
      causes: RefSubject.RefSubject<Cause.Cause<any>>;
      content: RefSubject.RefSubject<Fx.Fx<any, any, any>>;
      fx: Fx.Fx<any, any, any>;
      scope: Scope.Closeable;
    }
  >();
  let active: ReadonlyArray<AnyCatch> = [];

  const removeUnused = (catches: ReadonlyArray<AnyCatch>) =>
    Effect.gen(function* () {
      const next = new Set(catches);
      const removed = active.filter((catcher) => !next.has(catcher));
      const scopes = removed.map((catcher) => {
        const state = states.get(catcher)!;
        states.delete(catcher);
        return state.scope;
      });
      yield* closeScopes(scopes, fiberId);
      active = catches;
    });

  const apply = (
    catches: ReadonlyArray<AnyCatch>,
    inner: Fx.Fx<any, any, any>,
    services: Context.Context<any>,
  ) =>
    Effect.gen(function* () {
      let current = inner;
      for (let i = catches.length - 1; i >= 0; i--) {
        const catcher = catches[i];
        const state = states.get(catcher);
        if (state === undefined) {
          const scope = yield* Scope.fork(rootScope);
          const causes = yield* RefSubject.make<Cause.Cause<any>>(Cause.fail(undefined)).pipe(
            Scope.provide(scope),
          );
          const content = yield* RefSubject.make<Fx.Fx<any, any, any>>(Effect.succeed(current), {
            eq: (left, right) => left === right,
          }).pipe(Scope.provide(scope));
          const fallback = catcher(causes).pipe(
            provideContext(Context.merge(services, Context.make(Scope.Scope, scope))),
          );
          const fx = content.pipe(
            switchMap(identity),
            exit,
            mapEffect(
              Effect.fn(function* (result) {
                if (Exit.isSuccess(result)) return succeed(result.value);
                yield* RefSubject.set(causes, result.cause);
                return fallback;
              }),
            ),
            skipRepeats,
            switchMap(identity),
          );
          states.set(catcher, { causes, content, fx, scope });
          current = fx;
        } else {
          yield* RefSubject.set(state.content, current);
          current = state.fx;
        }
      }
      yield* removeUnused(catches);
      return current;
    });

  return { apply };
}
