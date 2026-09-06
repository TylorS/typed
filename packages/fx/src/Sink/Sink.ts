import type * as Cause from "effect/Cause";
import type { Effect } from "effect/Effect";
import { flatMap, map, provide, context } from "effect/Effect";
import type { Layer } from "effect/Layer";
import { effect } from "effect/Layer";
import type { Ref } from "effect/Ref";
import type { Scope } from "effect/Scope";
import * as Context from "effect/Context";

/**
 * Consumes pushed successes and failures through effectful callbacks.
 *
 * @remarks
 * ## Why
 * `Sink` gives an `Fx` producer one uniform destination while retaining Effect's typed service
 * requirements and complete failure `Cause`. Callback Effects have no typed failure channel, but
 * they may still defect or be interrupted. Handling an incoming Cause is the consumer's policy;
 * accepting it successfully does not mean the failed producer operation succeeded.
 *
 * ## Ownership and lifetime
 * A sink is inert until a producer invokes one of its callbacks. The producer's fiber controls
 * ordering, interruption, and callback lifetime; services in `R` must be available when callbacks
 * run. `Sink` itself acquires no resources.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const logger: Sink.Sink<number, string> = Sink.make(
 *   (cause) => Effect.logError(cause),
 *   (value) => Effect.log(`received ${value}`)
 * )
 * ```
 *
 * @since 1.0.0
 * @category Consumer contracts
 */
export interface Sink<A, E = never, R = never> {
  /**
   * Handles one successful value.
   *
   * @remarks
   * ## Why
   * The success callback is the value-side consumer boundary used by Fx producers.
   *
   * ## Ownership and lifetime
   * The invoking producer owns ordering and interruption. The returned Effect acquires and releases
   * any resources according to its own services and Scope.
   *
   * @since 1.0.0
   * @category callbacks
   */
  readonly onSuccess: (value: A) => Effect<unknown, never, R>;
  /**
   * Handles the producer's complete typed failure, defect, or interruption cause.
   *
   * @remarks
   * ## Why
   * Accepting `Cause` retains information that would be lost by an error-only callback.
   *
   * ## Ownership and lifetime
   * The invoking producer owns ordering and interruption. The returned Effect acquires and releases
   * any resources according to its own services and Scope.
   *
   * @since 1.0.0
   * @category callbacks
   */
  readonly onFailure: (cause: Cause.Cause<E>) => Effect<unknown, never, R>;
}

export declare namespace Sink {
  /**
   * Matches any `Sink` when its channels do not need to be preserved.
   *
   * @remarks
   * ## Why
   * Generic utilities sometimes need to constrain a value to the Sink model before recovering its
   * channels with `Success`, `Error`, or `Services`.
   *
   * ## Ownership and lifetime
   * This type alias acquires no resources and does not change the matched sink's lifetime.
   * @since 1.0.0
   * @category Type contracts
   */
  export type Any = Sink<any, any, any>;

  /**
   * Extracts the successful input type consumed by a `Sink`.
   *
   * @remarks
   * ## Why
   * Library code can derive a consumer's input without repeating its generic arguments.
   *
   * ## Ownership and lifetime
   * This conditional type is compile-time only and acquires no resources.
   * @since 1.0.0
   * @category Type contracts
   */
  export type Success<T> = T extends Sink<infer _A, infer _E, infer _R> ? _A : never;

  /**
   * Extracts the typed error carried by causes consumed by a `Sink`.
   *
   * @remarks
   * ## Why
   * It preserves the error-channel relationship when adapting or composing sinks.
   *
   * ## Ownership and lifetime
   * This conditional type is compile-time only and acquires no resources.
   * @since 1.0.0
   * @category Type contracts
   */
  export type Error<T> = T extends Sink<infer _A, infer _E, infer _R> ? _E : never;

  /**
   * Extracts the Effect services required by a `Sink`'s callbacks.
   *
   * @remarks
   * ## Why
   * It exposes callback dependencies for higher-order utilities without executing the sink.
   *
   * ## Ownership and lifetime
   * This conditional type is compile-time only and acquires no resources.
   * @since 1.0.0
   * @category Type contracts
   */
  export type Services<T> = T extends Sink<infer _A, infer _E, infer _R> ? _R : never;

  /**
   * Describes a Sink available through an Effect Context service.
   *
   * @remarks
   * ## Why
   * Producers can depend on a named consumer without receiving a concrete sink through every call.
   *
   * ## Ownership and lifetime
   * The installed Layer owns the concrete callback closures. Calls resolve `Self` from the current
   * Effect context; Layer scope owns any services captured while constructing them.
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import * as Sink from "@typed/fx/Sink"
   *
   * class Events extends Sink.Service<Events, string>()("Events") {}
   * const EventsLive = Events.make(Effect.logError, Effect.log)
   * ```
   *
   * @since 1.0.0
   * @category Sink services
   */
  export interface Service<Self, Id extends string, A, E> extends Sink<A, E, Self> {
    /**
     * Stable Context service identifier.
     *
     * @remarks
     * ## Why
     * The literal ID names diagnostics and distinguishes the service tag.
     *
     * ## Ownership and lifetime
     * This immutable string acquires no resources and lives with the service class.
     *
     * @since 1.0.0
     * @category services
     */
    readonly id: Id;
    /**
     * Effect Context reference used to install or retrieve the concrete sink.
     *
     * @remarks
     * ## Why
     * The tag connects the class-shaped API to Effect's Context and Layer ecosystem.
     *
     * ## Ownership and lifetime
     * The tag is static and resource-free; the currently provided Layer owns the concrete value.
     *
     * @since 1.0.0
     * @category services
     */
    readonly service: Context.Service<Self, Sink<A, E>>;
    /**
     * Builds a Layer whose sink callbacks capture their construction services.
     *
     * @remarks
     * ## Why
     * Callback dependencies are resolved once when the Layer is built rather than on every value.
     *
     * ## Ownership and lifetime
     * Layer scope owns captured services. Callback requirements exclude `Scope` because that scope is
     * consumed during Layer construction.
     *
     * @since 1.0.0
     * @category layers
     */
    readonly make: <R = never>(
      onFailure: (cause: Cause.Cause<E>) => Effect<unknown, never, R>,
      onSuccess: (value: A) => Effect<unknown, never, R>,
    ) => Layer<Self, never, Exclude<R, Scope>>;
  }

  /**
   * Constructor-shaped Context service returned by `Sink.Service`.
   *
   * @remarks
   * ## Why
   * A class-shaped tag supports standard Effect service declaration syntax while exposing the Sink
   * callbacks directly as static operations.
   *
   * ## Ownership and lifetime
   * Constructing the class returns its service tag; the providing Layer owns the concrete sink.
   *
   * @example
   * ```ts
   * import * as Sink from "@typed/fx/Sink"
   * class Numbers extends Sink.Service<Numbers, number>()("Numbers") {}
   * ```
   *
   * @since 1.0.0
   * @category Sink services
   */
  export interface Class<Self, Id extends string, A, E> extends Service<Self, Id, A, E> {
    /**
     * Returns the service tag rather than allocating a separate sink instance.
     *
     * @remarks
     * ## Why
     * This supports Effect's class declaration syntax while keeping one service identity.
     *
     * ## Ownership and lifetime
     * Construction allocates no consumer resources; the provided Layer owns the concrete sink.
     *
     * @since 1.0.0
     * @category constructors
     */
    new (): Service<Self, Id, A, E>;
  }
}

/**
 * Alias of `Sink.Success` for direct imports.
 *
 * @remarks
 * ## Why
 * Consumers can extract a sink's success type without qualifying the merged namespace.
 *
 * ## Ownership and lifetime
 * This conditional type is compile-time only and acquires no resources.
 *
 * @since 1.0.0
 * @category Type contracts
 */
export type Success<T> = Sink.Success<T>;
/**
 * Alias of `Sink.Error` for direct imports.
 *
 * @remarks
 * ## Why
 * Consumers can extract a sink's typed failure without qualifying the merged namespace.
 *
 * ## Ownership and lifetime
 * This conditional type is compile-time only and acquires no resources.
 *
 * @since 1.0.0
 * @category Type contracts
 */
export type Error<T> = Sink.Error<T>;
/**
 * Alias of `Sink.Services` for direct imports.
 *
 * @remarks
 * ## Why
 * Consumers can extract callback service requirements without qualifying the merged namespace.
 *
 * ## Ownership and lifetime
 * This conditional type is compile-time only and acquires no resources.
 *
 * @since 1.0.0
 * @category Type contracts
 */
export type Services<T> = Sink.Services<T>;

/**
 * Creates a Sink from success and failure callbacks.
 *
 * @remarks
 * ## Why
 * `make` is the smallest adapter from ordinary Effect programs to an `Fx` consumer.
 *
 * ## Ownership and lifetime
 * Construction is pure and acquires nothing. Callback ordering and concurrency belong to the
 * invoking producer; this adapter adds no queue. Callbacks are interrupted with their delivery
 * owners. Requirements from both callbacks are combined in the returned
 * sink; callback defects remain defects, while typed producer failures arrive through `onFailure`.
 *
 * @param onFailure - Callback for handling failures.
 * @param onSuccess - Callback for handling successful values.
 * @returns A `Sink`.
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const sink = Sink.make(Effect.logError, (value: number) => Effect.log(value))
 * ```
 * @since 1.0.0
 * @category Sink construction
 */
export function make<A, E = never, R = never, R2 = R>(
  onFailure: (cause: Cause.Cause<E>) => Effect<unknown, never, R>,
  onSuccess: (value: A) => Effect<unknown, never, R2>,
): Sink<A, E, R | R2> {
  return {
    onSuccess,
    onFailure,
  };
}

export declare namespace Sink {
  /**
   * A sink that can ask its producer callback to stop early.
   *
   * @remarks
   * ## Why
   * Bounded consumers such as `slice` and `dropAfter` need to end production without encoding
   * termination as a typed failure.
   *
   * ## Ownership and lifetime
   * `earlyExit` completes the surrounding consumer effect. Further callback deliveries are ignored;
   * interruption and cleanup remain owned by the surrounding producer effect.
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import type * as Sink from "@typed/fx/Sink"
   * const stop = (sink: Sink.Sink.WithEarlyExit<unknown, never, never>) => sink.earlyExit
   * ```
   * @since 1.0.0
   * @category Stopping delivery
   */
  export interface WithEarlyExit<A, E, R> extends Sink<A, E, R> {
    /**
     * Completes the surrounding early-exit consumer and suppresses later deliveries.
     *
     * @remarks
     * ## Why
     * Normal bounded completion remains distinct from typed producer failure.
     *
     * ## Ownership and lifetime
     * The surrounding `withEarlyExit` execution owns this Effect; running it aborts its callback fiber.
     *
     * @since 1.0.0
     * @category lifecycle
     */
    readonly earlyExit: Effect<void>;
  }

  /**
   * An early-exit sink with a mutable Effect `Ref` for consumer-local state.
   *
   * @remarks
   * ## Why
   * Stateful consumers can accumulate values without moving that state into the producer.
   *
   * ## Ownership and lifetime
   * The surrounding `withState` invocation creates and owns the Ref. It remains reachable only for
   * that invocation; callback ordering determines the order of state updates.
   *
   * @example
   * ```ts
   * import { Ref } from "effect"
   * import type * as Sink from "@typed/fx/Sink"
   * const increment = (sink: Sink.Sink.WithState<number, never, never, number>) =>
   *   Ref.update(sink.state, (n) => n + 1)
   * ```
   * @since 1.0.0
   * @category Stateful delivery
   */
  export interface WithState<A, E, R, B> extends WithEarlyExit<A, E, R> {
    /**
     * Mutable state created for the current consumer invocation.
     *
     * @remarks
     * ## Why
     * Stateful callback logic can use Effect's atomic Ref operations directly.
     *
     * ## Ownership and lifetime
     * `withState` creates this Ref for one execution; it is not shared with later executions.
     *
     * @since 1.0.0
     * @category state
     */
    readonly state: Ref<B>;
  }

  /**
   * An early-exit sink with serialized effectful access to consumer-local state.
   *
   * @remarks
   * ## Why
   * Effectful reducers may overlap; semaphore-guarded operations prevent lost updates while keeping
   * their typed errors and service requirements visible.
   *
   * ## Ownership and lifetime
   * `withStateSemaphore` owns the mutable cell and semaphore for one invocation. Each modify/update
   * holds one permit until its effect completes or is interrupted, then releases it automatically.
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import type * as Sink from "@typed/fx/Sink"
   * const increment = (sink: Sink.Sink.WithStateSemaphore<number, never, never, number>) =>
   *   sink.updateEffect((n) => Effect.succeed(n + 1))
   * ```
   * @since 1.0.0
   * @category Stateful delivery
   */
  export interface WithStateSemaphore<A, E, R, B> extends WithEarlyExit<A, E, R> {
    /**
     * Atomically derives a result and replacement state under the sink's semaphore.
     *
     * @remarks
     * ## Why
     * Returning a separate result avoids a second unlocked read after an update.
     *
     * ## Ownership and lifetime
     * One semaphore permit is held for the entire Effect and released on completion or interruption.
     * The state changes only when the Effect succeeds.
     *
     * @since 1.0.0
     * @category state
     */
    readonly modifyEffect: <C, E2, R2>(
      f: (state: B) => Effect<readonly [C, B], E2, R2>,
    ) => Effect<C, E | E2, R | R2>;

    /**
     * Atomically replaces state and returns the replacement value.
     *
     * @remarks
     * ## Why
     * It is the direct serialized form of an effectful state transition.
     *
     * ## Ownership and lifetime
     * One semaphore permit is held until the transition completes or is interrupted. Failure leaves
     * the state unchanged.
     *
     * @since 1.0.0
     * @category state
     */
    readonly updateEffect: <E2, R2>(
      f: (state: B) => Effect<B, E2, R2>,
    ) => Effect<B, E | E2, R | R2>;

    /**
     * Reads the current state under the same semaphore as updates.
     *
     * @remarks
     * ## Why
     * Locked reads cannot observe an in-progress effectful transition.
     *
     * ## Ownership and lifetime
     * The read holds one permit briefly and acquires no resource beyond the invocation-owned semaphore.
     *
     * @since 1.0.0
     * @category state
     */
    readonly get: Effect<B, E, R>;
  }
}

/**
 * Defines a class-shaped Effect Context service for a Sink.
 *
 * @remarks
 * ## Why
 * A service sink lets producers emit toward an application capability while Layers choose the
 * concrete destination, such as logging, persistence, or UI output.
 *
 * ## Ownership and lifetime
 * Definition is pure. `Class.make` captures its construction context into the sink callbacks and
 * returns a Layer; providing that Layer controls availability and cleanup of captured scoped
 * services. Each static callback lookup uses the current Effect context.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Sink from "@typed/fx/Sink"
 *
 * class Output extends Sink.Service<Output, string>()("Output") {}
 * const OutputLive = Output.make(Effect.logError, Effect.log)
 * const program = Output.onSuccess("ready").pipe(Effect.provide(OutputLive))
 * ```
 *
 * @since 1.0.0
 * @category Sink services
 */
export function Service<Self, A, E = never>() {
  return <const Id extends string>(id: Id): Sink.Class<Self, Id, A, E> => {
    const service = Context.Service<Self, Sink<A, E>>(id);

    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    return class SinkService {
      static readonly id = id;
      static readonly service = service;

      static {
        // @effect-diagnostics-next-line floatingEffect:off
        Object.assign(this, service);
        Object.assign(this.prototype, Object.getPrototypeOf(service));
      }

      static readonly make = <R = never, R2 = never>(
        onFailure: (cause: Cause.Cause<E>) => Effect<unknown, never, R>,
        onSuccess: (value: A) => Effect<unknown, never, R2>,
      ): Layer<Self, never, Exclude<R | R2, Scope>> =>
        effect(
          service,
          map(context<R | R2>(), (context) =>
            make(
              (cause) => provide(onFailure(cause), context),
              (value) => provide(onSuccess(value), context),
            ),
          ),
        );

      static readonly onSuccess = (value: A) => flatMap(service, (sink) => sink.onSuccess(value));

      static readonly onFailure = (cause: Cause.Cause<E>) =>
        flatMap(service, (sink) => sink.onFailure(cause));

      constructor() {
        return SinkService;
      }
    } as unknown as Sink.Class<Self, Id, A, E>;
  };
}
