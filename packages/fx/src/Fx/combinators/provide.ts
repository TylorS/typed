import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { dual } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Builds a Layer for each subscription and provides it to the entire Fx run.
 *
 * @remarks
 * ## Why
 *
 * Fx preserves Effect service requirements in `R`; providing a Layer closes
 * those requirements while retaining acquisition failures and dependencies in
 * the resulting type.
 *
 * ## Ownership and lifetime
 *
 * Each subscription creates a private Scope and builds the Layer inside it
 * before the source starts. A build failure is sent to the sink and the source
 * never runs. Otherwise the built Context is available to every source Effect,
 * and the Scope closes with the source's success, failure, defect, or
 * interruption. Provided services are removed from `R`; Layer dependencies and
 * errors are added.
 *
 * @example
 * ```ts
 * import { Context, Effect, Layer } from "effect"
 * import { provide } from "@typed/fx/Fx"
 * import { fromEffect } from "@typed/fx/Fx"
 *
 * class Config extends Context.Service<Config, { readonly url: string }>()("Config") {}
 * const request = fromEffect(Effect.map(Config, ({ url }) => url))
 * const runnable = provide(request, Layer.succeed(Config, { url: "/api" }))
 * ```
 *
 * @param layer - The Layer to provide.
 * @returns An `Fx` with the required context provided.
 * @since 1.0.0
 * @category Providing services
 */
export const provide: {
  <R2, E2 = never, R3 = never>(
    layer: Layer.Layer<R2, E2, R3>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, Exclude<R, R2> | R3>;

  <A, E, R, R2, E2 = never, R3 = never>(
    fx: Fx<A, E, R>,
    layer: Layer.Layer<R2, E2, R3>,
  ): Fx<A, E | E2, Exclude<R, R2> | R3>;
} = dual(
  2,
  <A, E, R, R2, E2 = never, R3 = never>(
    fx: Fx<A, E, R>,
    layer: Layer.Layer<R2, E2, R3>,
  ): Fx<A, E | E2, Exclude<R, R2> | R3> =>
    make<A, E | E2, Exclude<R, R2> | R3>(
      Effect.fnUntraced(function* (sink) {
        const scope = yield* Scope.make();
        const servicesExit = yield* layer.pipe(Layer.buildWithScope(scope), Effect.exit);

        if (Exit.isFailure(servicesExit)) {
          yield* Scope.close(scope, servicesExit);
          return yield* sink.onFailure(servicesExit.cause);
        }

        return yield* fx.run(sink).pipe(
          Effect.provideContext(servicesExit.value),
          Effect.onExit((exit) => Scope.close(scope, exit)),
        );
      }),
    ),
);

/**
 * Provides an already-built Effect Context to the entire Fx run.
 *
 * @remarks
 * ## Why
 *
 * Callers that already own service instances should not rebuild them through a
 * resourceful Layer merely to satisfy an Fx's environment.
 *
 * ## Ownership and lifetime
 *
 * The Context is captured when this combinator is created and reused for each
 * subscription. Its services are available to all source Effects and removed
 * from `R`. This function does not acquire or release those service values;
 * their owner must keep them valid for every subscription that uses the result.
 * Source completion, failure, and interruption are unchanged.
 *
 * @example
 * ```ts
 * import { Context, Effect } from "effect"
 * import { provideContext } from "@typed/fx/Fx"
 * import { fromEffect } from "@typed/fx/Fx"
 *
 * class Config extends Context.Service<Config, { readonly url: string }>()("Config") {}
 * const context = Context.make(Config, { url: "/api" })
 * const runnable = provideContext(fromEffect(Effect.map(Config, (x) => x.url)), context)
 * ```
 *
 * @since 1.0.0
 * @category Providing services
 */
export const provideContext: {
  <R2>(services: Context.Context<R2>): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, R2>>;

  <A, E, R, R2>(fx: Fx<A, E, R>, services: Context.Context<R2>): Fx<A, E, Exclude<R, R2>>;
} = dual(
  2,
  <A, E, R, R2>(fx: Fx<A, E, R>, services: Context.Context<R2>): Fx<A, E, Exclude<R, R2>> =>
    provide(fx, Layer.succeedContext(services)),
);

/**
 * Provides one existing service value to the entire Fx run.
 *
 * @remarks
 * ## Why
 *
 * This is the precise single-service form of {@link provideContext}, useful for
 * tests and application edges where the instance is already owned.
 *
 * ## Ownership and lifetime
 *
 * The service value is captured and reused for every subscription. It is not
 * acquired or finalized here; its caller owns its lifetime. The matching
 * service identifier is removed from `R`, while values, errors, ordering, and
 * interruption remain those of the source.
 *
 * @example
 * ```ts
 * import { Context, Effect } from "effect"
 * import { provideService } from "@typed/fx/Fx"
 * import { fromEffect } from "@typed/fx/Fx"
 *
 * class Config extends Context.Service<Config, { readonly url: string }>()("Config") {}
 * const runnable = provideService(
 *   fromEffect(Effect.map(Config, (x) => x.url)),
 *   Config,
 *   { url: "/api" }
 * )
 * ```
 *
 * @param tag - The service tag (identifier).
 * @param service - The service implementation.
 * @returns An `Fx` with the required service provided.
 * @since 1.0.0
 * @category Providing services
 */
export const provideService: {
  <Id, S>(
    tag: Context.Service<Id, S>,
    service: S,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, Exclude<R, Id>>;
  <A, E, R, Id, S>(
    fx: Fx<A, E, R>,
    tag: Context.Service<Id, S>,
    service: S,
  ): Fx<A, E, Exclude<R, Id>>;
} = dual(
  3,
  <A, E, R, Id, S>(
    fx: Fx<A, E, R>,
    tag: Context.Service<Id, S>,
    service: S,
  ): Fx<A, E, Exclude<R, Id>> => provideContext(fx, Context.make(tag, service)),
);

/**
 * Acquires one service with an Effect before running the Fx.
 *
 * @remarks
 * ## Why
 *
 * Some service instances require effectful configuration but do not warrant a
 * separately named Layer. This keeps acquisition failure and dependencies
 * explicit in the returned Fx type.
 *
 * ## Ownership and lifetime
 *
 * The service Effect runs once per subscription while {@link provide} builds
 * its Layer. A failure prevents the source from starting. On success, the
 * service is available for the whole source run and its identifier is removed
 * from `R`; acquisition errors and every requirement in `R2` are added. In
 * particular, an `Effect.acquireRelease` service Effect still leaves
 * `Scope.Scope` in the returned Fx requirements—the private Layer Scope does
 * not erase that public requirement. The caller must provide that Scope.
 *
 * @example
 * ```ts
 * import { Context, Effect } from "effect"
 * import { provideServiceEffect } from "@typed/fx/Fx"
 * import { fromEffect } from "@typed/fx/Fx"
 *
 * class Config extends Context.Service<Config, { readonly url: string }>()("Config") {}
 * const request = fromEffect(Effect.map(Config, (x) => x.url))
 * const runnable = provideServiceEffect(request, Config, Effect.succeed({ url: "/api" }))
 * ```
 *
 * @example Scoped acquisition keeps `Scope` in the returned Fx requirements
 * ```ts
 * import { Context, Effect } from "effect"
 * import { provideServiceEffect } from "@typed/fx/Fx"
 * import { fromEffect } from "@typed/fx/Fx"
 * import { collectAll } from "@typed/fx/Fx"
 *
 * class Config extends Context.Service<Config, { readonly url: string }>()("Config") {}
 * const request = fromEffect(Effect.map(Config, (x) => x.url))
 * const acquired = Effect.acquireRelease(
 *   Effect.succeed({ url: "/api" }),
 *   () => Effect.void
 * )
 * const scopedFx = provideServiceEffect(request, Config, acquired)
 * const program = Effect.scoped(collectAll(scopedFx))
 * ```
 *
 * @param tag - The service tag (identifier).
 * @param serviceEffect - Effect that produces the service (may have its own requirements).
 * @returns An `Fx` with the required service provided.
 * @since 1.0.0
 * @category Providing services
 */
export const provideServiceEffect: {
  <Id, S, E2, R2>(
    tag: Context.Service<Id, S>,
    serviceEffect: Effect.Effect<S, E2, R2>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, Exclude<R, Id> | R2>;
  <A, E, R, Id, S, E2, R2>(
    fx: Fx<A, E, R>,
    tag: Context.Service<Id, S>,
    serviceEffect: Effect.Effect<S, E2, R2>,
  ): Fx<A, E | E2, Exclude<R, Id> | R2>;
} = dual(
  3,
  <A, E, R, Id, S, E2, R2>(
    fx: Fx<A, E, R>,
    tag: Context.Service<Id, S>,
    serviceEffect: Effect.Effect<S, E2, R2>,
  ): Fx<A, E | E2, Exclude<R, Id> | R2> => provide(fx, Layer.effect(tag, serviceEffect)),
);
