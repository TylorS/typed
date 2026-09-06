import * as Effect from "effect/Effect";
import { identity } from "effect/Function";
import type { Layer } from "effect/Layer";
import { effect } from "effect/Layer";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import type * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import type * as Types from "effect/Types";
import type * as Sink from "../Sink/Sink.js";
import { provideContext } from "./combinators/provide.js";
import { FxTypeId, isFx } from "./TypeId.js";

/**
 * `Fx` is a reactive stream of values that supports concurrency, error handling,
 * and context management, fully integrated with the Effect ecosystem.
 *
 * Conceptually, an `Fx<A, E, R>` is a push-based stream that:
 * - Emits values of type `A`
 * - Can fail with an error of type `E`
 * - Requires a context/environment of type `R`
 *
 * Unlike a standard `Effect` which produces a single value, `Fx` can produce
 * 0, 1, or many values over time. It is similar to RxJS Observables or
 * AsyncIterables, but built on top of Effect's fiber-based concurrency model.
 *
 * @remarks
 * ## Why
 *
 * Browser events, clocks, sockets, and users decide when work exists. `Fx`
 * models that producer-driven direction while retaining Effect's explicit
 * success, error, and service channels. An `Effect`, `Stream`, `Promise`,
 * `ReadableStream`, iterable, or custom source can participate through an
 * explicit constructor; `Fx` extends the Effect ecosystem rather than
 * replacing it.
 *
 * ## Ownership and lifetime
 *
 * Constructing an `Fx` starts no work. Calling `run` returns an `Effect` whose
 * running fiber and `Scope` own subscriptions, child fibers, and finalizers.
 * Interruption propagates through that Effect lifetime. The supplied `Sink`
 * contributes its requirements to `run`; failures are delivered to the Sink,
 * which is why the returned Effect itself cannot fail.
 *
 * ## Composition
 *
 * The type parameters follow Effect's `A`, `E`, `R` vocabulary. Consequently,
 * an `Fx<RenderEvent, E, R>` can describe arbitrary UI without hiding its
 * failures or required services.
 *
 * ## Effect foundations
 *
 * `Fx` execution is an [Effect](https://effect.website/docs/v4/api/effect/Effect),
 * resource ownership uses [Scope](https://effect.website/docs/v4/api/effect/Scope),
 * concurrent runs use [Fiber](https://effect.website/docs/v4/api/effect/Fiber), and
 * failures retain Effect's structured [Cause](https://effect.website/docs/v4/api/effect/Cause).
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const keys: Fx.Fx<KeyboardEvent> = Fx.callback((emit) => {
 *   const onKey = (event: KeyboardEvent) => emit.succeed(event)
 *   document.addEventListener("keydown", onKey)
 *   return Effect.sync(() => document.removeEventListener("keydown", onKey))
 * })
 * ```
 *
 * @since 1.0.0
 * @category Type contracts
 */
export interface Fx<A, E = never, R = never> extends Pipeable {
  /**
   * Identifies this value as an `Fx` and records its success, error, and service variance.
   *
   * @remarks
   * ## Why
   *
   * The marker makes `Fx` distinguishable at runtime without executing it, while its
   * type carries the three channels through structural composition.
   *
   * ## Ownership and lifetime
   *
   * Reading the marker starts no work and acquires no resources.
   *
   * @since 1.0.0
   * @category symbols
   */
  readonly [FxTypeId]: Fx.Variance<A, E, R>;
  /**
   * Connects this producer to a `Sink` and returns the `Effect` that owns the connection.
   *
   * @remarks
   * ## Why
   *
   * Keeping execution behind an `Effect` preserves typed services, structured
   * concurrency, and interruption instead of starting hidden work during construction.
   * Values are offered to the sink in the order chosen by this `Fx`; the producer may
   * emit zero, one, or many values.
   *
   * ## Ownership and lifetime
   *
   * Work starts when the returned `Effect` runs. Its fiber owns the subscription and
   * any child scopes. Interrupting it interrupts the producer and runs its finalizers.
   * Producer failures are delivered to `sink.onFailure`, so they are not repeated in
   * the returned Effect's error channel.
   *
   * @since 1.0.0
   * @category runners
   */
  readonly run: <RSink>(sink: Sink.Sink<A, E, RSink>) => Effect.Effect<unknown, never, R | RSink>;
}

export declare namespace Fx {
  /**
   * Matches any `Fx` regardless of its value, error, or service channels.
   *
   * @remarks
   * ## Why
   *
   * Generic helpers sometimes need to retain an entire unknown `Fx` type before
   * extracting its channels with `Success`, `Error`, and `Services`.
   *
   * ## Ownership and lifetime
   *
   * This type alias performs no acquisition and starts no stream.
   *
   * @since 1.0.0
   * @category models
   */
  export type Any = Fx<any, any, any>;

  /**
   * Describes how an `Fx` varies in its value, error, and service channels.
   *
   * @remarks
   * ## Why
   *
   * The phantom fields preserve `Fx<A, E, R>` relationships through TypeScript's
   * structural type system and power channel extraction without runtime sampling.
   *
   * ## Ownership and lifetime
   *
   * Variance markers are type-level metadata and retain no values or resources.
   *
   * @example
   * ```ts
   * import type { Fx } from "@typed/fx/Fx"
   *
   * type NumberFxVariance = Fx.Variance<number, never, never>
   * ```
   *
   * @since 1.0.0
   * @category models
   */
  export interface Variance<A, E, R> {
    /**
     * Covariant marker for emitted values.
     *
     * @remarks
     * ## Why
     *
     * Preserves the `A` relationship without retaining an emitted value.
     *
     * ## Ownership and lifetime
     *
     * This phantom field starts no work and owns no resource.
     *
     * @since 1.0.0
     * @category models
     */
    readonly _A: Types.Covariant<A>;
    /**
     * Covariant marker for typed failures.
     *
     * @remarks
     * ## Why
     *
     * Preserves the `E` relationship without manufacturing a failure.
     *
     * ## Ownership and lifetime
     *
     * This phantom field starts no work and owns no resource.
     *
     * @since 1.0.0
     * @category models
     */
    readonly _E: Types.Covariant<E>;
    /**
     * Covariant marker for required services.
     *
     * @remarks
     * ## Why
     *
     * Preserves the `R` relationship without reading an Effect context.
     *
     * ## Ownership and lifetime
     *
     * This phantom field starts no work and owns no resource.
     *
     * @since 1.0.0
     * @category models
     */
    readonly _R: Types.Covariant<R>;
  }

  /**
   * Extracts the emitted value type from an `Fx`.
   *
   * @remarks
   * ## Why
   *
   * Higher-order APIs can preserve a producer's value channel without restating all
   * three `Fx` type parameters. `never` remains `never` rather than distributing.
   *
   * ## Ownership and lifetime
   *
   * This conditional type performs no runtime work.
   * @since 1.0.0
   * @category Type contracts
   */
  export type Success<T> = [T] extends [never]
    ? never
    : T extends Fx<infer _A, infer _E, infer _R>
      ? _A
      : never;

  /**
   * Extracts the typed error from an `Fx`.
   *
   * @remarks
   * ## Why
   *
   * Higher-order APIs can combine an unknown producer's failure channel precisely.
   * `never` remains `never` rather than distributing.
   *
   * ## Ownership and lifetime
   *
   * This conditional type performs no runtime work.
   * @since 1.0.0
   * @category Type contracts
   */
  export type Error<T> = [T] extends [never]
    ? never
    : T extends Fx<infer _A, infer _E, infer _R>
      ? _E
      : never;

  /**
   * Extracts the services required to run an `Fx`.
   *
   * @remarks
   * ## Why
   *
   * Combinators and helpers can expose the complete environment of a producer without
   * evaluating it. The tuple wrapper prevents unwanted conditional distribution.
   *
   * ## Ownership and lifetime
   *
   * This conditional type performs no runtime work.
   * @since 1.0.0
   * @category Type contracts
   */
  export type Services<T> = [T] extends [never]
    ? never
    : [T] extends [Fx<infer _A, infer _E, infer _R>]
      ? _R
      : never;

  /**
   * An `Fx` whose implementation is obtained from an Effect service.
   *
   * @remarks
   * ## Why
   *
   * Long-lived producers can be selected and replaced through Effect's service graph
   * while remaining directly usable as `Fx<A, E, Self>`.
   *
   * ## Ownership and lifetime
   *
   * The service declaration owns nothing. A layer made with `make` owns the supplied
   * producer for that layer's scope; each run reads the installed service.
   *
   * @example
   * ```ts
   * import { Fx } from "@typed/fx"
   * import type { Fx as FxModel } from "@typed/fx/Fx"
   *
   * class Ticks extends Fx.Service<Ticks, number>()("app/Ticks") {}
   * const service: FxModel.Service<Ticks, "app/Ticks", number, never> = Ticks
   * ```
   *
   * @since 1.0.0
   * @category Providing services
   */
  export interface Service<Self, Id extends string, A, E> extends Fx<A, E, Self> {
    /**
     * Stable diagnostic identifier used to create the Effect service.
     *
     * @remarks
     * ## Why
     *
     * Keeps the service identity visible to diagnostics and tooling.
     *
     * ## Ownership and lifetime
     *
     * Reading the identifier starts no work and owns no resource.
     *
     * @since 1.0.0
     * @category models
     */
    readonly id: Id;
    /**
     * Effect service tag containing the installed producer.
     *
     * @remarks
     * ## Why
     *
     * Exposes the underlying Effect service for direct context and layer composition.
     *
     * ## Ownership and lifetime
     *
     * The tag is inert; the layer that installs its value owns the producer lifetime.
     *
     * @since 1.0.0
     * @category models
     */
    readonly service: Context.Service<Self, Fx<A, E>>;
    /**
     * Builds a layer from an `Fx`, or from an `Effect` that acquires one.
     *
     * @remarks
     * ## Why
     *
     * Connects producer acquisition directly to Effect's service graph.
     *
     * ## Ownership and lifetime
     *
     * Scope is removed from the layer requirements because layer acquisition supplies
     * it. Other services and typed failures remain visible.
     *
     * @since 1.0.0
     * @category layers
     */
    readonly make: <R = never>(
      fx: Fx<A, E, R> | Effect.Effect<Fx<A, E, R>, E, R>,
    ) => Layer<Self, E, Exclude<R, Scope.Scope>>;
  }

  /**
   * The constructible service class returned by `Fx.Service`.
   *
   * @remarks
   * ## Why
   *
   * A single value can act as the service tag, the service-backed `Fx`, and the owner
   * of its [Layer](https://effect.website/docs/v4/api/effect/Layer) constructor,
   * matching Effect's class-based service ergonomics.
   *
   * ## Ownership and lifetime
   *
   * Constructing the class returns the class value and starts no producer. Installed
   * layer scopes own actual implementations.
   *
   * @example
   * ```ts
   * import { Fx } from "@typed/fx"
   * import type { Fx as FxModel } from "@typed/fx/Fx"
   *
   * class Ticks extends Fx.Service<Ticks, number>()("app/Ticks") {}
   * const definition: FxModel.Class<Ticks, "app/Ticks", number, never> = Ticks
   * ```
   *
   * @since 1.0.0
   * @category models
   */
  export interface Class<Self, Id extends string, A, E> extends Service<Self, Id, A, E> {
    /**
     * Returns the service class as its service-backed `Fx` value.
     *
     * @remarks
     * ## Why
     *
     * Supports Effect's class-as-tag ergonomics without allocating wrapper instances.
     *
     * ## Ownership and lifetime
     *
     * Construction starts no producer. The installed layer owns the implementation.
     *
     * @since 1.0.0
     * @category constructors
     */
    new (): Service<Self, Id, A, E>;
  }
}

/**
 * Alias of `Fx.Success` for extracting an `Fx` value channel.
 *
 * @remarks
 * ## Why
 *
 * The top-level alias supports type-only imports without requiring namespace syntax.
 *
 * ## Ownership and lifetime
 *
 * This type alias performs no runtime work.
 * @since 1.0.0
 * @category Type contracts
 */
export type Success<T> = Fx.Success<T>;

/**
 * Alias of `Fx.Error` for extracting an `Fx` error channel.
 *
 * @remarks
 * ## Why
 *
 * The top-level alias supports type-only imports without requiring namespace syntax.
 *
 * ## Ownership and lifetime
 *
 * This type alias performs no runtime work.
 * @since 1.0.0
 * @category Type contracts
 */
export type Error<T> = Fx.Error<T>;

/**
 * Alias of `Fx.Services` for extracting an `Fx` service channel.
 *
 * @remarks
 * ## Why
 *
 * The top-level alias supports type-only imports without requiring namespace syntax.
 *
 * ## Ownership and lifetime
 *
 * This type alias performs no runtime work.
 * @since 1.0.0
 * @category Type contracts
 */
export type Services<T> = Fx.Services<T>;

const VARIANCE: Fx.Variance<any, any, any> = {
  _A: identity,
  _E: identity,
  _R: identity,
};

/**
 * Defines an Effect service whose value is also a directly runnable `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Applications often need a producer selected by the Effect environment: a clock,
 * event source, transport, or domain feed. `Service` keeps that dependency in `R`
 * and provides the corresponding layer constructor without a parallel wrapper API.
 *
 * ## Ownership and lifetime
 *
 * Defining the class starts no work. `Class.make` acquires the producer when its layer
 * is built, supplies the acquisition context to it, and binds its lifetime to the
 * layer scope. Running the class reads the currently installed implementation.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * class Ticks extends Fx.Service<Ticks, number>()("app/Ticks") {}
 *
 * const TicksLive = Ticks.make(Fx.succeed(1))
 * const values = Fx.collectAll(Ticks).pipe(Effect.provide(TicksLive))
 * const program = Effect.map(values, (items) => items[0])
 * ```
 *
 * @since 1.0.0
 * @category Providing services
 */
export function Service<Self, A, E = never>() {
  return <const Id extends string>(id: Id): Fx.Class<Self, Id, A, E> => {
    const service = Context.Service<Self, Fx<A, E>>(id);

    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    return class FxService {
      static readonly id = id;
      static readonly service = service;

      static readonly make = <R = never>(
        fx: Fx<A, E, R> | Effect.Effect<Fx<A, E, R>, E, R>,
      ): Layer<Self, E, Exclude<R, Scope.Scope>> =>
        effect(
          service,
          Effect.gen(function* () {
            const services = yield* Effect.context<R>();
            const result = isFx(fx) ? fx : yield* fx;
            return provideContext(result, services);
          }),
        );

      static readonly [FxTypeId] = VARIANCE;
      static readonly pipe = function (this: any) {
        return pipeArguments(this, arguments);
      };

      static readonly run = <RSink>(sink: Sink.Sink<A, E, RSink>) =>
        Effect.flatMap(service, (fx) => fx.run(sink));

      constructor() {
        return FxService;
      }
    } as unknown as Fx.Class<Self, Id, A, E>;
  };
}
