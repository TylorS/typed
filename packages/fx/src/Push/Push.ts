/** @effect-diagnostics missingEffectError:skip-file */
/** @effect-diagnostics missingEffectContext:skip-file */

/**
 * Couples an effectful input consumer with an independent push-based output stream.
 *
 * `Push` is useful at bidirectional boundaries: callers send commands through its
 * `Sink` side while observers receive events through its `Fx` side. The two type
 * channels stay independent, so adapting input never changes output behavior and
 * adapting output never changes accepted input. Effects, typed failures, Context
 * services, fibers, Layers, and Scopes retain their [Effect v4](https://effect.website/)
 * semantics throughout.
 *
 * @since 1.0.0
 * @category modules
 * @packageDocumentation
 */
import type * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual, identity } from "effect/Function";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { pipeArguments } from "effect/Pipeable";
import type * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import * as Fx from "../Fx/index.js";
import { FxTypeId } from "../Fx/TypeId.js";
import * as Sink from "../Sink.js";

/**
 * A bidirectional value that is both a `Sink<A, E, R>` and an `Fx<B, E2, R2>`.
 *
 * Calling `onSuccess` or `onFailure` sends exactly one input notification to the
 * wrapped Sink. The returned `Effect` is the acknowledgment: a producer that runs
 * and awaits it waits for the consumer callback to finish. `Push` adds no queue,
 * buffering, replay, or demand protocol of its own.
 *
 * Running the Fx side preserves that Fx's cardinality and ordering. Input values
 * are not automatically forwarded to the output; any relationship between the
 * two sides belongs to the supplied Sink and Fx (for example, a shared `Subject`).
 *
 * @remarks
 * ## Why
 *
 * Interactive systems often need one value for sending work and another for
 * observing results. Keeping both directions in one Effect-native value makes the
 * boundary composable without pretending that commands and events are the same
 * stream.
 *
 * ## Ownership and lifetime
 *
 * Constructing a `Push` starts no work and allocates no fiber or Scope. Each input
 * callback runs in the caller's fiber with the Sink's `R` requirements. Running
 * the output side follows the wrapped Fx's Scope, interruption, finalizers, `E2`
 * failures, and `R2` services; `Push` does not change them.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Push from "@typed/fx/Push"
 * import { Fx } from "@typed/fx"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const program = Effect.gen(function* () {
 *   // Create a Push that accepts numbers and emits strings
 *   const push = Push.make(
 *     Sink.make(
 *       (cause) => Effect.sync(() => console.log("Error:", cause)),
 *       (value) => Effect.sync(() => console.log("Received:", value))
 *     ),
 *     Fx.succeed("Hello")
 *   )
 *
 *   // Push a value to the sink
 *   yield* push.onSuccess(42)
 *   // Output: "Received: 42"
 *
 *   // Observe the Fx output
 *   yield* Fx.observe(push, (value) =>
 *     Effect.sync(() => console.log("Emitted:", value))
 *   )
 *   // Output: "Emitted: Hello"
 * })
 * ```
 *
 * @since 1.0.0
 * @category Bidirectional contracts
 */
export interface Push<in A, in E, out R, out B, out E2, out R2>
  extends Sink.Sink<A, E, R>, Fx.Fx<B, E2, R2> {}

export namespace Push {
  /**
   * Matches any `Push` when its six channel types are intentionally unknown.
   *
   * @remarks
   * ## Why
   *
   * Generic utilities sometimes need to inspect a Push before recovering its
   * input, output, error, and service channels with conditional types.
   *
   * ## Ownership and lifetime
   *
   * This type alias creates no value or resource and changes no runtime lifetime.
   *
   * @since 1.0.0
   * @category Type contracts
   */
  export type Any = Push<any, any, any, any, any, any>;

  /**
   * The static and Effect service surface returned by `Push.Service`.
   *
   * Service lookup supplies the same bidirectional value to `run`, `onSuccess`,
   * and `onFailure`. The `Self` service appears in both required-service channels;
   * the installed Push itself has those requirements captured by its Layer.
   *
   * @remarks
   * ## Why
   *
   * A named service lets application code send inputs and observe outputs without
   * threading a concrete Push through every function.
   *
   * ## Ownership and lifetime
   *
   * The Layer built by `make` owns service installation. It captures the Sink and
   * Fx construction contexts, excluding `Scope.Scope`; Scope-dependent resources
   * must therefore be acquired by the surrounding scoped program.
   *
   * @example
   * ```ts
   * import * as Push from "@typed/fx/Push"
   *
   * class Events extends Push.Service<Events, string, never, string>()("Events") {}
   * const id: "Events" = Events.id
   * ```
   *
   * @since 1.0.0
   * @category Push services
   */
  export interface Service<Self, Id extends string, A, E, B, E2> extends Push<
    A,
    E,
    Self,
    B,
    E2,
    Self
  > {
    /**
     * The literal Context service identifier supplied to `Push.Service`.
     *
     * @remarks
     * ## Why
     *
     * A stable literal id makes the capability identifiable in Effect Context and
     * diagnostics without inspecting its implementation.
     *
     * ## Ownership and lifetime
     *
     * The id is immutable metadata and owns no resource.
     *
     * @example
     * ```ts
     * import * as Push from "@typed/fx/Push"
     * class Events extends Push.Service<Events, string, never, string>()("Events") {}
     * const id: "Events" = Events.id
     * ```
     *
     * @since 1.0.0
     * @category services
     */
    readonly id: Id;
    /**
     * The Effect Context service used by the static Push operations.
     *
     * @remarks
     * ## Why
     *
     * Exposing the Context service permits ordinary Effect service composition in
     * addition to the convenience statics.
     *
     * ## Ownership and lifetime
     *
     * This is an immutable service reference. The Layer providing `Self`, not the
     * reference, owns installation and release.
     *
     * @example
     * ```ts
     * import * as Push from "@typed/fx/Push"
     * class Events extends Push.Service<Events, string, never, string>()("Events") {}
     * const service = Events.service
     * ```
     *
     * @since 1.0.0
     * @category services
     */
    readonly service: Context.Service<Self, Push<A, E, never, B, E2, never>>;
    /**
     * Builds a Layer that installs a concrete Sink/Fx pair as this service.
     *
     * Building the Layer starts neither side. The Sink context is captured at
     * Layer construction; each output run additionally receives its subscriber's
     * context.
     *
     * @remarks
     * ## Why
     *
     * The Layer is the explicit composition boundary between implementation
     * requirements and consumers that depend only on `Self`.
     *
     * ## Ownership and lifetime
     *
     * Layer lifetime owns service installation. `Scope.Scope` is excluded from
     * captured requirements so scoped resources remain owned by the surrounding
     * scoped Effect.
     *
     * @example
     * ```ts
     * import { Effect } from "effect"
     * import * as Fx from "@typed/fx/Fx"
     * import * as Push from "@typed/fx/Push"
     * import * as Sink from "@typed/fx/Sink"
     * class Events extends Push.Service<Events, string, never, string>()("Events") {}
     * const Live = Events.make(Sink.make(() => Effect.void, () => Effect.void), Fx.succeed("ready"))
     * ```
     *
     * @since 1.0.0
     * @category layers
     */
    readonly make: <R = never, R2 = never>(
      sink: Sink.Sink<A, E, R>,
      fx: Fx.Fx<B, E2, R2>,
    ) => Layer.Layer<Self, never, Exclude<R | R2, Scope.Scope>>;
  }

  /**
   * Constructable static type produced by `Push.Service`.
   *
   * @remarks
   * ## Why
   *
   * The construct signature supports the class-extension pattern used by Effect
   * services while retaining the complete static Push API.
   *
   * ## Ownership and lifetime
   *
   * Constructing the class returns its static service value; it does not acquire,
   * subscribe to, or dispose the installed Push.
   *
   * @example
   * ```ts
   * import * as Push from "@typed/fx/Push"
   *
   * class Events extends Push.Service<Events, string, never, string>()("Events") {}
   * const ServiceClass: Push.Push.Class<Events, "Events", string, never, string, never> = Events
   * ```
   *
   * @since 1.0.0
   * @category Push services
   */
  export interface Class<Self, Id extends string, A, E, B, E2> extends Service<
    Self,
    Id,
    A,
    E,
    B,
    E2
  > {
    /**
     * Returns the static service value when used through the class pattern.
     *
     * @remarks
     * ## Why
     *
     * The construct signature allows `class X extends Push.Service(...)` while
     * preserving the service's precise static type.
     *
     * ## Ownership and lifetime
     *
     * Construction acquires nothing; the resulting value still resolves its
     * concrete Push from the current Effect Context.
     *
     * @example
     * ```ts
     * import * as Push from "@typed/fx/Push"
     * class Events extends Push.Service<Events, string, never, string>()("Events") {}
     * const events = new Events()
     * ```
     *
     * @since 1.0.0
     * @category services
     */
    new (): Service<Self, Id, A, E, B, E2>;
  }
}

/**
 * Couples a `Sink` input with an independent `Fx` output.
 *
 * The result forwards each input callback directly to `sink` and delegates every
 * output subscription to `fx`. It does not connect the two values, change output
 * cardinality or ordering, buffer inputs, or start either side eagerly.
 *
 * @remarks
 * ## Why
 *
 * `make` is the explicit boundary where a command consumer and event producer
 * become one bidirectional capability without hiding either contract.
 *
 * ## Ownership and lifetime
 *
 * Construction is allocation-free apart from the wrapper. Each input callback is
 * owned by its caller; each output run is owned by the wrapped Fx run and inherits
 * its interruption, Scope, cleanup, failures, and services.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Push from "@typed/fx/Push"
 * import { Fx } from "@typed/fx"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const received: Array<number> = []
 * const sink = Sink.make(() => Effect.void, (value: number) =>
 *   Effect.sync(() => received.push(value))
 * )
 * const push = Push.make(sink, Fx.fromIterable(["ready", "done"]))
 *
 * const program = Effect.gen(function* () {
 *   yield* push.onSuccess(42) // acknowledges the Sink callback
 *   const output = yield* Fx.collectAll(push)
 *   return { received, output }
 * }).pipe(Effect.scoped)
 * ```
 *
 * @since 1.0.0
 * @category Push construction
 */
export const make: {
  <B, E2, R2>(
    fx: Fx.Fx<B, E2, R2>,
  ): <A, E, R>(sink: Sink.Sink<A, E, R>) => Push<A, E, R, B, E2, R2>;
  <A, E, R, B, E2, R2>(sink: Sink.Sink<A, E, R>, fx: Fx.Fx<B, E2, R2>): Push<A, E, R, B, E2, R2>;
} = dual(2, (sink: any, fx: any) => new PushImpl<any, any, any, any, any, any>(sink, fx));

const VARIANCE = {
  _A: identity,
  _E: identity,
  _R: identity,
};

class PushImpl<A, E, R, B, E2, R2> implements Push<A, E, R, B, E2, R2> {
  readonly [FxTypeId]: typeof VARIANCE = VARIANCE;
  readonly sink: Sink.Sink<A, E, R>;
  readonly fx: Fx.Fx<B, E2, R2>;

  constructor(sink: Sink.Sink<A, E, R>, fx: Fx.Fx<B, E2, R2>) {
    this.sink = sink;
    this.fx = fx;

    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  run<R3>(sink: Sink.Sink<B, E2, R3>): Effect.Effect<unknown, never, R2 | R3> {
    return this.fx.run(sink);
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.sink.onFailure(cause);
  }

  onSuccess(value: A): Effect.Effect<unknown, never, R> {
    return this.sink.onSuccess(value);
  }

  pipe() {
    return pipeArguments(this, arguments);
  }
}

/**
 * Synchronously transforms each successful input before sending it to the Sink.
 *
 * One input maps to exactly one downstream input. Calling `onSuccess` evaluates
 * `f` immediately, before the returned downstream Effect is run; allocation and
 * thrown exceptions therefore occur at callback invocation (and become defects
 * only when that invocation itself occurs inside Effect evaluation). The Sink
 * callback Effect remains the acknowledgment. Calls are not serialized; execution
 * order and concurrency follow the producer. The Fx output is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Adapt an external command shape to an existing consumer without rebuilding or
 * changing the independent output stream.
 *
 * ## Ownership and lifetime
 *
 * `f` runs synchronously when `onSuccess` is called, before its returned Effect
 * exists, and acquires no resource. Downstream handling retains the original
 * Sink's `E`, `R`, caller fiber, interruption, and cleanup behavior.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const events: Array<string> = []
 * const base = Push.make(
 *   Sink.make(() => Effect.void, (n: number) => Effect.sync(() => events.push(`sink:${n}`))),
 *   Fx.empty
 * )
 * const mapped = Push.mapInput(base, (text: string) => {
 *   events.push(`map:${text}`)
 *   return Number(text)
 * })
 * const acknowledgement = mapped.onSuccess("42")
 * // events is already ["map:42"]; the Sink Effect has not run yet.
 * const program = Effect.as(acknowledgement, events)
 * ```
 *
 * @since 1.0.0
 * @category Transforming inputs
 */
export const mapInput: {
  <C, A>(
    f: (c: C) => A,
  ): <E, R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<C, E, R, B, E2, R2>;

  <A, E, R, B, E2, R2, C>(push: Push<A, E, R, B, E2, R2>, f: (c: C) => A): Push<C, E, R, B, E2, R2>;
} = dual(2, function mapInput<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
>(push: Push<A, E, R, B, E2, R2>, f: (c: C) => A): Push<C, E, R, B, E2, R2> {
  return make(Sink.map(push, f), push);
});

/**
 * Effectfully transforms each successful input before sending it to the Sink.
 *
 * Calling `onSuccess(value)` invokes `f(value)` immediately to construct an
 * Effect. Allocation and thrown exceptions therefore occur before an
 * acknowledgment Effect is returned. Running that returned Effect later executes
 * the constructed Effect in the caller's fiber. On success its single `A` reaches
 * the Sink; typed failure, defect, or interruption sends its full Cause to the
 * Sink failure callback. Calls are not serialized, so the producer controls order
 * and concurrency. Output values and order are unchanged.
 *
 * @remarks
 * ## Why
 *
 * Use this at an input boundary that must decode, validate, or load Effect
 * services before the existing consumer can accept a value.
 *
 * ## Ownership and lifetime
 *
 * Effect construction happens eagerly at `onSuccess`; only execution is deferred.
 * The fiber running the returned acknowledgment owns execution and interruption
 * of the constructed Effect and downstream callback. `E` is handled by the Sink
 * failure channel, while `R3` joins the input service requirements.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const numbers: Array<number> = []
 * const base = Push.make(
 *   Sink.make(() => Effect.void, (n: number) => Effect.sync(() => numbers.push(n))),
 *   Fx.empty
 * )
 * const parsed = Push.mapInputEffect(base, (text: string) =>
 *   text === "" ? Effect.fail("empty" as const) : Effect.succeed(Number(text))
 * )
 * ```
 *
 * @since 1.0.0
 * @category Transforming inputs
 */
export const mapInputEffect: {
  <C, R3, E, A>(
    f: (c: C) => Effect.Effect<A, E, R3>,
  ): <R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<C, E, R | R3, B, E2, R2>;

  <A, E, R, B, E2, R2, R3, C>(
    push: Push<A, E, R, B, E2, R2>,
    f: (c: C) => Effect.Effect<A, E, R3>,
  ): Push<C, E, R | R3, B, E2, R2>;
} = dual(2, function mapInputEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  R3,
  C,
>(push: Push<A, E, R, B, E2, R2>, f: (c: C) => Effect.Effect<A, E, R3>): Push<
  C,
  E,
  R | R3,
  B,
  E2,
  R2
> {
  return make(Sink.mapEffect(push, f), push);
});

/**
 * Keeps successful inputs that satisfy `f` and discards the rest.
 *
 * Calling `onSuccess` runs the predicate immediately. A match constructs one Sink
 * callback Effect; a non-match immediately returns an empty acknowledgment.
 * Predicate allocation and throws therefore occur before the returned Effect is
 * run. The producer controls call order and concurrency; output is preserved.
 *
 * @remarks
 * ## Why
 *
 * Filtering before the consumer avoids teaching the underlying Sink about input
 * values that are irrelevant to it.
 *
 * ## Ownership and lifetime
 *
 * The predicate is synchronous at `onSuccess` invocation and acquires no
 * resources. Accepted callback Effects retain the original Sink's errors,
 * services, interruption, and cleanup.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const checks: Array<number> = []
 * const positives = Push.filterInput(
 *   Push.make(Sink.make(() => Effect.void, (n: number) => Effect.log(n)), Fx.empty),
 *   (n) => (checks.push(n), n > 0)
 * )
 * const acknowledgement = positives.onSuccess(-1)
 * // checks is already [-1]; acknowledgement performs no Sink callback.
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export const filterInput: {
  <A>(
    f: (a: A) => boolean,
  ): <E, R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, B, E2, R2>;
  <A, E, R, B, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
    f: (a: A) => boolean,
  ): Push<A, E, R, B, E2, R2>;
} = dual(2, function filterInput<
  A,
  E,
  R,
  B,
  E2,
  R2,
>(push: Push<A, E, R, B, E2, R2>, f: (a: A) => boolean): Push<A, E, R, B, E2, R2> {
  return make(Sink.filter(push, f), push);
});

/**
 * Effectfully decides whether each successful input reaches the Sink.
 *
 * Calling `onSuccess(value)` invokes `f(value)` immediately to construct the
 * predicate Effect; allocation and throws happen before an acknowledgment is
 * returned. Running the acknowledgment later executes that Effect in the caller's
 * fiber. `true` forwards one value, `false` none, and failure sends its Cause to
 * the Sink failure callback. Calls are not serialized; the producer controls
 * order and concurrency. Output behavior is unchanged.
 *
 * @remarks
 * ## Why
 *
 * This supports authorization and service-backed eligibility checks directly at
 * the consumer boundary.
 *
 * ## Ownership and lifetime
 *
 * Predicate Effect construction is eager; its execution and downstream callback
 * belong to the fiber that runs the returned acknowledgment, whose interruption
 * stops them. Predicate services join input `R`; typed `E` is consumed through
 * the Sink failure channel.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const even = Push.filterInputEffect(
 *   Push.make(Sink.make(() => Effect.void, (_n: number) => Effect.void), Fx.empty),
 *   (n) => Effect.succeed(n % 2 === 0)
 * )
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export const filterInputEffect: {
  <A, R3, E>(
    f: (a: A) => Effect.Effect<boolean, E, R3>,
  ): <R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R | R3, B, E2, R2>;

  <A, E, R, B, E2, R2, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (a: A) => Effect.Effect<boolean, E, R3>,
  ): Push<A, E, R | R3, B, E2, R2>;
} = dual(2, function filterInputEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (a: A) => Effect.Effect<boolean, E, R3>): Push<
  A,
  E,
  R | R3,
  B,
  E2,
  R2
> {
  return make(Sink.filterEffect<A, E, R | R3>(push, f), push);
});

/**
 * Transforms an input and forwards it only when `f` returns `Some`.
 *
 * Calling `onSuccess` evaluates `f` immediately. `Some(a)` constructs one Sink
 * callback Effect; `None` immediately returns an empty acknowledgment. Mapping
 * allocation and throws therefore happen before the returned Effect runs. Calls
 * are not serialized, so ordering follows the producer. Output is unchanged.
 *
 * @remarks
 * ## Why
 *
 * `Option` combines parsing and filtering without a sentinel value or a separate
 * predicate pass.
 *
 * ## Ownership and lifetime
 *
 * The mapping is synchronous at `onSuccess` invocation and resource-free. A
 * forwarded callback Effect retains the original Sink's lifetime, error channel,
 * and service requirements.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const parsed: Array<string> = []
 * const integers = Push.filterMapInput(
 *   Push.make(Sink.make(() => Effect.void, (n: number) => Effect.log(n)), Fx.empty),
 *   (text: string) => {
 *     parsed.push(text)
 *     return /^\d+$/.test(text) ? Option.some(Number(text)) : Option.none()
 *   }
 * )
 * const acknowledgement = integers.onSuccess("nope")
 * // parsed is already ["nope"]; acknowledgement performs no Sink callback.
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export const filterMapInput: {
  <C, A>(
    f: (c: C) => Option.Option<A>,
  ): <P extends Push.Any>(
    push: P,
  ) => Push<
    C,
    Sink.Error<P>,
    Sink.Services<P>,
    Fx.Fx.Success<P>,
    Fx.Fx.Error<P>,
    Fx.Fx.Services<P>
  >;
  <A, E, R, B, E2, R2, C>(
    push: Push<A, E, R, B, E2, R2>,
    f: (c: C) => Option.Option<A>,
  ): Push<C, E, R, B, E2, R2>;
} = dual(2, function filterMapInput<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
>(push: Push<A, E, R, B, E2, R2>, f: (c: C) => Option.Option<A>): Push<C, E, R, B, E2, R2> {
  return make(Sink.filterMap(push, f), push);
});

/**
 * Effectfully transforms an input and forwards only a resulting `Some` value.
 *
 * Calling `onSuccess(value)` invokes `f(value)` immediately to construct an
 * Effect; allocation and throws happen before an acknowledgment is returned.
 * Running that acknowledgment later executes the constructed Effect in the
 * caller's fiber. `Some(a)` produces one Sink callback, `None` none, and failure
 * sends its full Cause to the Sink failure callback. Concurrent calls are not
 * serialized.
 *
 * @remarks
 * ## Why
 *
 * This is the input-boundary form for service-backed lookup or validation where
 * absence is expected but failure remains meaningful.
 *
 * ## Ownership and lifetime
 *
 * Mapper Effect construction is eager; execution belongs to the fiber that runs
 * the returned acknowledgment and can be interrupted there. Mapper requirements
 * join the Sink input requirements; its `E` is handled through the same failure
 * callback. The output Fx is untouched.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const known = Push.filterMapInputEffect(
 *   Push.make(Sink.make(() => Effect.void, (_n: number) => Effect.void), Fx.empty),
 *   (text: string) => Effect.succeed(text === "one" ? Option.some(1) : Option.none())
 * )
 * ```
 *
 * @since 1.0.0
 * @category Selecting inputs
 */
export const filterMapInputEffect: {
  <C, R3, E, A>(
    f: (c: C) => Effect.Effect<Option.Option<A>, E, R3>,
  ): <R, B, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<C, E, R | R3, B, E2, R2>;
  <A, E, R, B, E2, R2, R3, C>(
    push: Push<A, E, R, B, E2, R2>,
    f: (c: C) => Effect.Effect<Option.Option<A>, E, R3>,
  ): Push<C, E, R | R3, B, E2, R2>;
} = dual(2, function filterMapInputEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  R3,
  C,
>(push: Push<A, E, R, B, E2, R2>, f: (c: C) => Effect.Effect<Option.Option<A>, E, R3>): Push<
  C,
  E,
  R | R3,
  B,
  E2,
  R2
> {
  return make(Sink.filterMapEffect(push, f), push);
});

/**
 * Synchronously transforms every value emitted by the Fx output side.
 *
 * It emits exactly one `C` for every upstream `B`, preserving order and the
 * complete input Sink. The mapping does not buffer or introduce concurrency.
 *
 * @remarks
 * ## Why
 *
 * Adapt observed events without changing the commands the bidirectional boundary
 * accepts.
 *
 * ## Ownership and lifetime
 *
 * `f` runs in the upstream Fx delivery path and owns no resource. Output
 * subscription, interruption, failures, services, and cleanup remain those of the
 * wrapped Fx and downstream Sink.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Push from "@typed/fx/Push"
 * import { Fx } from "@typed/fx"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const program = Effect.gen(function* () {
 *   const push = Push.make(
 *     Sink.make(
 *       (cause) => Effect.void,
 *       (value) => Effect.void
 *     ),
 *     Fx.succeed(42)
 *   )
 *
 *   // Map output from number to string
 *   const mapped = Push.map(push, (n) => `Number: ${n}`)
 *
 *   // Observe the mapped output
 *   yield* Fx.observe(mapped, (value) =>
 *     Effect.sync(() => console.log(value))
 *   )
 *   // Output: "Number: 42"
 * })
 * ```
 *
 * @since 1.0.0
 * @category Transforming outputs
 */
export const map: {
  <B, C>(
    f: (b: B) => C,
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2, R2>;
  <A, E, R, B, E2, R2, C>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => C): Push<A, E, R, C, E2, R2>;
} = dual(2, function map<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => C): Push<A, E, R, C, E2, R2> {
  return make(push, Fx.map(push, f));
});

/**
 * Effectfully transforms each Fx output value.
 *
 * The mapper runs once per upstream value and emits one result on success, in
 * upstream order for a sequential source. Its typed failures join `E2`; its
 * required services join `R2`. The input side is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Use this for output enrichment that needs Effect services or can fail while
 * keeping input handling independent.
 *
 * ## Ownership and lifetime
 *
 * Each mapper Effect runs inside the output subscription and is interrupted with
 * it. No work starts before `run`; cleanup belongs to the upstream Fx and mapper
 * effects. `mapEffect` itself introduces no separate buffer or long-lived fiber.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.succeed(2))
 * const doubled = Push.mapEffect(push, (n) => Effect.succeed(n * 2))
 * ```
 *
 * @since 1.0.0
 * @category Transforming outputs
 */
export const mapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3>;
} = dual(2, function mapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Effect.Effect<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3
> {
  return make(push, Fx.mapEffect(push, f));
});

/**
 * Transforms the output (Fx) error channel of a `Push` using the provided function.
 *
 * Failures (Cause) are mapped via `Cause.map`, so only the typed failure (`Fail`)
 * is transformed; defects and interrupts are preserved unchanged.
 *
 * Mirrors `Effect.mapError` on the Fx side. Cardinality, value order, input
 * callbacks, and output service requirements are unchanged.
 *
 * @remarks
 * ## Why
 *
 * Normalize an output failure type at the observation boundary without touching
 * input errors or collapsing defects and interruption into typed failures.
 *
 * ## Ownership and lifetime
 *
 * The mapping is synchronous and resource-free. It runs when the output Cause is
 * delivered and preserves the upstream subscription, Scope, interruption, and
 * cleanup behavior.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.fail("offline"))
 * const normalized = Push.mapError(push, (message) => ({ message }))
 * ```
 *
 * @since 1.0.0
 * @category Output failures
 */
export const mapError: {
  <E2, E3>(
    f: (e: E2) => E3,
  ): <A, E, R, B, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, B, E3, R2>;
  <A, E, R, B, E2, R2, E3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (e: E2) => E3,
  ): Push<A, E, R, B, E3, R2>;
} = dual(2, function mapError<
  A,
  E,
  R,
  B,
  E2,
  R2,
  E3,
>(push: Push<A, E, R, B, E2, R2>, f: (e: E2) => E3): Push<A, E, R, B, E3, R2> {
  return make(push, Fx.mapError(push, f));
});

/**
 * Transforms both the output (Fx) success and error channels of a `Push` using the provided options.
 *
 * Mirrors `Effect.mapBoth` on the Fx side: `onSuccess` maps every emitted value
 * one-to-one and `onFailure` maps typed failures via `Cause.map`; defects and
 * interrupts are preserved. Ordering, services, and the input side are unchanged.
 *
 * @remarks
 * ## Why
 *
 * Adapt both observable result channels at once while leaving command handling
 * and non-typed Cause information intact.
 *
 * ## Ownership and lifetime
 *
 * Both functions run synchronously in the output delivery path and acquire no
 * resources. The wrapped Fx retains ownership of its subscription and finalizers.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.succeed(2))
 * const labeled = Push.mapBoth(push, {
 *   onFailure: (error: never) => error,
 *   onSuccess: (value) => `value:${value}`
 * })
 * ```
 *
 * @since 1.0.0
 * @category Transforming outputs
 */
export const mapBoth: {
  <B, C, E2, E3>(options: {
    readonly onFailure: (e: E2) => E3;
    readonly onSuccess: (b: B) => C;
  }): <A, E, R, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E3, R2>;
  <A, E, R, B, E2, R2, C, E3>(
    push: Push<A, E, R, B, E2, R2>,
    options: { readonly onFailure: (e: E2) => E3; readonly onSuccess: (b: B) => C },
  ): Push<A, E, R, C, E3, R2>;
} = dual(
  2,
  function mapBoth<A, E, R, B, E2, R2, C, E3>(
    push: Push<A, E, R, B, E2, R2>,
    options: {
      readonly onFailure: (e: E2) => E3;
      readonly onSuccess: (b: B) => C;
    },
  ): Push<A, E, R, C, E3, R2> {
    return make(push, Fx.mapBoth(push, options));
  },
);

/**
 * Keeps Fx output values that satisfy `f`.
 *
 * The upstream Sink invokes the predicate synchronously for each output value,
 * before the returned downstream callback Effect runs. Predicate allocation and
 * throws therefore occur at upstream callback invocation. Matches preserve their
 * relative order; non-matches produce no output. No buffer is added and every
 * input callback is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Restrict observed events without restricting which commands the Push accepts.
 *
 * ## Ownership and lifetime
 *
 * The predicate is synchronous at upstream `onSuccess` invocation and
 * resource-free. Subscription, interruption, failures, services, and cleanup
 * remain those of the wrapped Fx.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.fromIterable([1, 2, 3]))
 * const even = Push.filter(push, (n) => n % 2 === 0)
 * ```
 *
 * @since 1.0.0
 * @category Selecting outputs
 */
export const filter: {
  <B>(
    f: (b: B) => boolean,
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, B, E2, R2>;
  <A, E, R, B, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => boolean,
  ): Push<A, E, R, B, E2, R2>;
} = dual(2, function filter<
  A,
  E,
  R,
  B,
  E2,
  R2,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => boolean): Push<A, E, R, B, E2, R2> {
  return make(push, Fx.filter(push, f));
});

/**
 * Effectfully decides which Fx output values are emitted.
 *
 * Each upstream value runs one predicate. `true` emits that value, `false` emits
 * none, and predicate failures join the output error channel. For a sequential
 * source the predicate is acknowledged before the next delivery, preserving
 * order; the input side is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Use this when an observed event needs an Effect service or fallible check before
 * it is visible downstream.
 *
 * ## Ownership and lifetime
 *
 * Predicate effects run inside and are interrupted with the output subscription.
 * Their `E3` failures and `R3` services join the Fx channels. No separate queue or
 * persistent fiber is introduced.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.fromIterable([1, 2]))
 * const positive = Push.filterEffect(push, (n) => Effect.succeed(n > 0))
 * ```
 *
 * @since 1.0.0
 * @category Selecting outputs
 */
export const filterEffect: {
  <B, R3, E3>(
    f: (b: B) => Effect.Effect<boolean, E3, R3>,
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, B, E2 | E3, R2 | R3>;
  <A, E, R, B, E2, R2, R3, E3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<boolean, E3, R3>,
  ): Push<A, E, R, B, E2 | E3, R2 | R3>;
} = dual(2, function filterEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  R3,
  E3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Effect.Effect<boolean, E3, R3>): Push<
  A,
  E,
  R,
  B,
  E2 | E3,
  R2 | R3
> {
  return make(push, Fx.filterEffect(push, f));
});

/**
 * Maps each Fx output and emits only resulting `Some` values.
 *
 * The upstream Sink evaluates `f` synchronously for each value, before its
 * returned downstream callback Effect runs. Mapping allocation and throws occur
 * at that callback invocation. `Some(c)` emits exactly one `c`; `None` emits
 * nothing. Relative order, errors, services, and input behavior are preserved.
 *
 * @remarks
 * ## Why
 *
 * Combine output parsing and filtering without a sentinel value or a second pass.
 *
 * ## Ownership and lifetime
 *
 * The mapper is synchronous at upstream `onSuccess` invocation and resource-free.
 * The wrapped Fx retains ownership of subscription, Scope, interruption, and
 * finalizers.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.fromIterable(["1", "x"]))
 * const numbers = Push.filterMap(push, (text) => /^\d+$/.test(text) ? Option.some(Number(text)) : Option.none())
 * ```
 *
 * @since 1.0.0
 * @category Selecting outputs
 */
export const filterMap: {
  <B, C>(
    f: (b: B) => Option.Option<C>,
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2, R2>;
  <A, E, R, B, E2, R2, C>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Option.Option<C>,
  ): Push<A, E, R, C, E2, R2>;
} = dual(2, function filterMap<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Option.Option<C>): Push<A, E, R, C, E2, R2> {
  return make(push, Fx.filterMap(push, f));
});

/**
 * Effectfully maps each Fx output and emits only resulting `Some` values.
 *
 * One mapper Effect runs per upstream value. `Some(c)` emits once, `None` emits
 * nothing, and failures join the output error channel. Sequential sources retain
 * order; the input Sink remains unchanged.
 *
 * @remarks
 * ## Why
 *
 * This models service-backed lookup where absence is an ordinary filtered result
 * but operational failure must remain observable.
 *
 * ## Ownership and lifetime
 *
 * Mapper effects are owned and interrupted by the output subscription. Their
 * services join `R2` and failures join `E2`; the combinator adds no independent
 * buffer or resource.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.succeed("one"))
 * const ids = Push.filterMapEffect(push, (name) => Effect.succeed(name === "one" ? Option.some(1) : Option.none()))
 * ```
 *
 * @since 1.0.0
 * @category Selecting outputs
 */
export const filterMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<Option.Option<C>, E3, R3>,
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<Option.Option<C>, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3>;
} = dual(2, function filterMapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Effect.Effect<Option.Option<C>, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3
> {
  return make(push, Fx.filterMapEffect(push, f));
});

/**
 * Transforms each output value into an inner `Fx`, observing only the latest one.
 *
 * A new outer value interrupts the previous inner fiber before starting the next.
 * Output cardinality is the cardinality of the successive active inners; values
 * from an interrupted inner stop. Outer order determines replacement order, while
 * each active inner preserves its own order. The input Sink is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Latest-wins composition models search, navigation, and other work where a newer
 * request makes the previous result irrelevant.
 *
 * ## Ownership and lifetime
 *
 * Running the result requires `Scope.Scope`. Each inner runs in that Scope and is
 * interrupted on replacement or outer interruption; the last inner is joined
 * before normal completion. Outer and inner errors/services are combined.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const finalized: Array<number> = []
 * const outer = Fx.make<number>((sink) =>
 *   sink.onSuccess(1).pipe(
 *     Effect.andThen(Effect.sleep("5 millis")),
 *     Effect.andThen(sink.onSuccess(2))
 *   )
 * )
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), outer)
 * const switched = Push.switchMap(push, (id) =>
 *   Fx.make<number>((sink) =>
 *     Effect.gen(function* () {
 *       yield* Effect.sleep("2 millis")
 *       yield* sink.onSuccess(id * 10 + 1)
 *       yield* Effect.sleep(id === 1 ? "20 millis" : "2 millis")
 *       yield* sink.onSuccess(id * 10 + 2)
 *     }).pipe(Effect.ensuring(Effect.sync(() => finalized.push(id))))
 *   )
 * )
 * const program = Fx.collectAll(switched).pipe(
 *   Effect.map((values) => ({ values, finalized })),
 *   Effect.scoped
 * )
 * // Effect.runPromise(program) => { values: [11, 21, 22], finalized: [1, 2] }
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const switchMap: {
  <B, C, E3, R3>(
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function switchMap<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Fx.Fx<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.switchMap(push, f));
});

/**
 * Transforms each output value into an Effect, keeping only the latest Effect.
 *
 * Each new outer value interrupts the previous Effect before starting its own.
 * Every Effect can emit at most one value; interrupted Effects emit none. The
 * input side is unchanged.
 *
 * @remarks
 * ## Why
 *
 * This is latest-wins Effect composition without manually wrapping each Effect as
 * an Fx.
 *
 * ## Ownership and lifetime
 *
 * The output subscription's Scope owns the active Effect fiber. Replacement and
 * subscription interruption run its interruption/finalizers. `E3` joins output
 * errors and `R3` joins required services.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const finalized: Array<number> = []
 * const source = Fx.make<number>((sink) =>
 *   sink.onSuccess(1).pipe(
 *     Effect.andThen(Effect.sleep("2 millis")),
 *     Effect.andThen(sink.onSuccess(2))
 *   )
 * )
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), source)
 * const latest = Push.switchMapEffect(push, (id) =>
 *   Effect.sleep(id === 1 ? "20 millis" : "1 millis").pipe(
 *     Effect.as(id),
 *     Effect.ensuring(Effect.sync(() => finalized.push(id)))
 *   )
 * )
 * const program = Fx.collectAll(latest).pipe(
 *   Effect.map((values) => ({ values, finalized })),
 *   Effect.scoped
 * )
 * // Effect.runPromise(program) => { values: [2], finalized: [1, 2] }
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const switchMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function switchMapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Effect.Effect<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.switchMapEffect(push, f));
});

/**
 * Transforms each output value into an inner `Fx` and merges all inners concurrently.
 *
 * Every outer value starts one inner. All inner values are emitted; order within
 * each inner is preserved, but values from different inners may interleave. The
 * outer stream waits for all inners before normal completion. The input Sink is
 * unchanged.
 *
 * @remarks
 * ## Why
 *
 * Use concurrent flattening when every produced task matters and independent work
 * should overlap.
 *
 * ## Ownership and lifetime
 *
 * The output Scope owns a fiber set containing all active inners. Outer
 * interruption interrupts that set and runs inner cleanup. Inner failures and
 * services join the outer Fx channels; no ordering buffer is added.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const finalized: Array<number> = []
 * const push = Push.make(
 *   Sink.make(() => Effect.void, (_: string) => Effect.void),
 *   Fx.fromIterable([1, 2])
 * )
 * const merged = Push.flatMap(push, (id) =>
 *   Fx.make<number>((sink) =>
 *     Effect.gen(function* () {
 *       yield* Effect.sleep(id === 1 ? "5 millis" : "10 millis")
 *       yield* sink.onSuccess(id * 10 + 1)
 *       yield* Effect.sleep("20 millis")
 *       yield* sink.onSuccess(id * 10 + 2)
 *     }).pipe(Effect.ensuring(Effect.sync(() => finalized.push(id))))
 *   )
 * )
 * const program = Fx.collectAll(merged).pipe(
 *   Effect.map((values) => ({ values, finalized })),
 *   Effect.scoped
 * )
 * // Effect.runPromise(program) => { values: [11, 21, 12, 22], finalized: [1, 2] }
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const flatMap: {
  <B, C, E3, R3>(
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function flatMap<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Fx.Fx<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.flatMap(push, f));
});

/**
 * Transforms every output value into an Effect and merges their results concurrently.
 *
 * One Effect starts per outer value and can emit one result. All successful
 * results are emitted, but concurrent completion order may differ from input
 * order. The input side is unchanged.
 *
 * @remarks
 * ## Why
 *
 * This runs independent Effect work concurrently without manually lifting each
 * Effect into Fx.
 *
 * ## Ownership and lifetime
 *
 * Active Effects are fibers owned by the output Scope. Completion waits for all
 * of them; interruption stops them and runs their finalizers. `E3` and `R3` join
 * the output failure and service channels.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const finalized: Array<number> = []
 * const push = Push.make(
 *   Sink.make(() => Effect.void, (_: string) => Effect.void),
 *   Fx.fromIterable([1, 2])
 * )
 * const loaded = Push.flatMapEffect(push, (id) =>
 *   Effect.sleep(id === 1 ? "20 millis" : "1 millis").pipe(
 *     Effect.as(id),
 *     Effect.ensuring(Effect.sync(() => finalized.push(id)))
 *   )
 * )
 * const program = Fx.collectAll(loaded).pipe(
 *   Effect.map((values) => ({ values, finalized })),
 *   Effect.scoped
 * )
 * // Effect.runPromise(program) => { values: [2, 1], finalized: [2, 1] }
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const flatMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function flatMapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Effect.Effect<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.flatMapEffect(push, f));
});

/**
 * Runs at most one inner Fx and ignores outer values while it is active.
 *
 * The first value seen while idle starts an inner; every value arriving before
 * that inner completes is dropped. `f(value)` is still evaluated and its inner Fx
 * is constructed before the busy check; dropping means the returned Fx is not
 * run. Accepted inners preserve their own order and all values. Input is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Exhaust semantics prevent duplicate work, such as repeated submit clicks, while
 * allowing another request after the active one completes.
 *
 * ## Ownership and lifetime
 *
 * The output Scope owns the active inner fiber, joins it before completion, and
 * interrupts it with the subscription. Inner failures and services join the
 * outer channels; there is no pending-value buffer.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const constructed: Array<number> = []
 * const started: Array<number> = []
 * const finalized: Array<number> = []
 * const push = Push.make(
 *   Sink.make(() => Effect.void, (_: string) => Effect.void),
 *   Fx.fromIterable([1, 2])
 * )
 * const exhausted = Push.exhaustMap(push, (id) => {
 *   constructed.push(id)
 *   return Fx.make<number>((sink) =>
 *     Effect.gen(function* () {
 *       yield* Effect.sync(() => started.push(id))
 *       yield* Effect.sleep("5 millis")
 *       yield* sink.onSuccess(id * 10 + 1)
 *       yield* Effect.sleep("5 millis")
 *       yield* sink.onSuccess(id * 10 + 2)
 *     }).pipe(Effect.ensuring(Effect.sync(() => finalized.push(id))))
 *   )
 * })
 * const program = Fx.collectAll(exhausted).pipe(
 *   Effect.map((values) => ({ values, constructed, started, finalized })),
 *   Effect.scoped
 * )
 * // => { values: [11, 12], constructed: [1, 2], started: [1], finalized: [1] }
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const exhaustMap: {
  <B, C, E3, R3>(
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function exhaustMap<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Fx.Fx<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.exhaustMap(push, f));
});

/**
 * Runs at most one mapped Effect and ignores values while it is active.
 *
 * The first value while idle starts one Effect and can emit one result; all values
 * received before it completes are dropped. The mapping callback is still invoked
 * and constructs an Effect for every value before the busy check; dropped Effects
 * are not run. The input side is unchanged.
 *
 * @remarks
 * ## Why
 *
 * This guards non-overlapping Effect work without manual busy state.
 *
 * ## Ownership and lifetime
 *
 * The output Scope owns and joins the active Effect fiber. Subscription
 * interruption stops it and runs finalizers. Its errors and services join the
 * output channels; no value is buffered for later.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const constructed: Array<number> = []
 * const finalized: Array<number> = []
 * const push = Push.make(
 *   Sink.make(() => Effect.void, (_: string) => Effect.void),
 *   Fx.fromIterable([1, 2])
 * )
 * const saving = Push.exhaustMapEffect(push, (id) => {
 *   constructed.push(id)
 *   return Effect.sleep("10 millis").pipe(
 *     Effect.as(id),
 *     Effect.ensuring(Effect.sync(() => finalized.push(id)))
 *   )
 * })
 * const program = Fx.collectAll(saving).pipe(
 *   Effect.map((values) => ({ values, constructed, finalized })),
 *   Effect.scoped
 * )
 * // Effect.runPromise(program) => { values: [1], constructed: [1, 2], finalized: [1] }
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const exhaustMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function exhaustMapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Effect.Effect<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.exhaustMapEffect(push, f));
});

/**
 * Runs one inner Fx at a time and retains only the latest value received while busy.
 *
 * A value while idle starts immediately. While its inner runs, newer outer values
 * replace a single pending slot. `f(value)` is evaluated and an inner Fx is
 * constructed before every replacement; a superseded pending Fx is never run.
 * After completion, only the latest pending Fx starts. Accepted inners preserve
 * their own order and all values. The input Sink is unchanged.
 *
 * @remarks
 * ## Why
 *
 * This is useful when work must not overlap but the newest requested state must
 * eventually be processed.
 *
 * ## Ownership and lifetime
 *
 * The output Scope owns one active inner fiber and an in-memory latest slot. It
 * joins the final inner before completion and interrupts it with the subscription.
 * Inner failures and services join the output channels.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const constructed: Array<number> = []
 * const started: Array<number> = []
 * const finalized: Array<number> = []
 * const push = Push.make(
 *   Sink.make(() => Effect.void, (_: string) => Effect.void),
 *   Fx.fromIterable([1, 2, 3])
 * )
 * const latest = Push.exhaustLatestMap(push, (id) => {
 *   constructed.push(id)
 *   return Fx.make<number>((sink) =>
 *     Effect.gen(function* () {
 *       yield* Effect.sync(() => started.push(id))
 *       yield* Effect.sleep("5 millis")
 *       yield* sink.onSuccess(id * 10 + 1)
 *       yield* Effect.sleep("5 millis")
 *       yield* sink.onSuccess(id * 10 + 2)
 *     }).pipe(Effect.ensuring(Effect.sync(() => finalized.push(id))))
 *   )
 * })
 * const program = Fx.collectAll(latest).pipe(
 *   Effect.map((values) => ({ values, constructed, started, finalized })),
 *   Effect.scoped
 * )
 * // => values [11, 12, 31, 32]; constructed [1, 2, 3]; started/finalized [1, 3].
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const exhaustLatestMap: {
  <B, C, E3, R3>(
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Fx.Fx<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function exhaustLatestMap<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Fx.Fx<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.exhaustLatestMap(push, f));
});

/**
 * Runs one mapped Effect at a time and retains only the latest value received while busy.
 *
 * Each accepted Effect can emit one result. While it runs, one pending Effect is
 * repeatedly overwritten; after completion only the latest pending Effect starts.
 * The mapping callback still runs and constructs an Effect for every value before
 * replacement; superseded Effects are not run. The input side is unchanged.
 *
 * @remarks
 * ## Why
 *
 * This provides non-overlapping Effect work with eventual latest-state handling,
 * avoiding an unbounded queue of obsolete requests.
 *
 * ## Ownership and lifetime
 *
 * The output Scope owns the active Effect fiber and pending slot. It waits for the
 * final Effect, interrupts it with the subscription, and runs its finalizers.
 * Effect failures and services join the output channels.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const constructed: Array<number> = []
 * const finalized: Array<number> = []
 * const push = Push.make(
 *   Sink.make(() => Effect.void, (_: string) => Effect.void),
 *   Fx.fromIterable([1, 2, 3])
 * )
 * const latestSaved = Push.exhaustLatestMapEffect(push, (id) => {
 *   constructed.push(id)
 *   return Effect.sleep("10 millis").pipe(
 *     Effect.as(id),
 *     Effect.ensuring(Effect.sync(() => finalized.push(id)))
 *   )
 * })
 * const program = Fx.collectAll(latestSaved).pipe(
 *   Effect.map((values) => ({ values, constructed, finalized })),
 *   Effect.scoped
 * )
 * // Effect.runPromise(program) => { values: [1, 3], constructed: [1, 2, 3], finalized: [1, 3] }
 * ```
 *
 * @since 1.0.0
 * @category Concurrent output work
 */
export const exhaustLatestMapEffect: {
  <B, C, E3, R3>(
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): <A, E, R, E2, R2>(
    push: Push<A, E, R, B, E2, R2>,
  ) => Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
  <A, E, R, B, E2, R2, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    f: (b: B) => Effect.Effect<C, E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3 | Scope.Scope>;
} = dual(2, function exhaustLatestMapEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, f: (b: B) => Effect.Effect<C, E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3 | Scope.Scope
> {
  return make(push, Fx.exhaustLatestMapEffect(push, f));
});

/**
 * Maps over the output (Fx) side of a `Push` with an accumulator: for each emitted value `b`,
 * applies `f(state, b)` to get `[nextState, emitted]` and emits the second element.
 * The first element is the initial state; subsequent states are updated by each step.
 * It emits exactly one `C` per upstream value, in order. Accumulator state is
 * private to each output subscription; the input Sink is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Stateful output projection can derive running totals or protocol state without
 * moving that state into the bidirectional input boundary.
 *
 * ## Ownership and lifetime
 *
 * Each run owns its own synchronous accumulator. It is discarded when that run
 * completes or is interrupted and acquires no Scope or external resource.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), Fx.fromIterable([1, 2, 3]))
 * const totals = Push.mapAccum(push, 0, (total, value) => [total + value, total + value] as const)
 * ```
 *
 * @param initial - Initial accumulator state.
 * @param f - Reducer `(state, value) => [nextState, emitted]`.
 * @returns A `Push` whose Fx side emits the accumulated/mapped values.
 * @since 1.0.0
 * @category Stateful outputs
 */
export const mapAccum: {
  <S, B, C>(
    initial: S,
    f: (s: S, b: B) => readonly [S, C],
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2, R2>;
  <A, E, R, B, E2, R2, S, C>(
    push: Push<A, E, R, B, E2, R2>,
    initial: S,
    f: (s: S, b: B) => readonly [S, C],
  ): Push<A, E, R, C, E2, R2>;
} = dual(3, function mapAccum<
  A,
  E,
  R,
  B,
  E2,
  R2,
  S,
  C,
>(push: Push<A, E, R, B, E2, R2>, initial: S, f: (s: S, b: B) => readonly [S, C]): Push<
  A,
  E,
  R,
  C,
  E2,
  R2
> {
  return make(
    push,
    Fx.make((sink) =>
      push.run(
        Sink.loop(sink, initial, (s, b) => {
          const [sNext, c] = f(s, b);
          return [c, sNext];
        }),
      ),
    ),
  );
});

/**
 * Maps over the output (Fx) side of a `Push` with an effectful accumulator: for each emitted value `b`,
 * runs `f(state, b)` to get `[nextState, emitted]` and emits the second element.
 * The adapter does not serialize callbacks. Calling `onSuccess` invokes `f`
 * immediately with the current seed and constructs its Effect; overlapping calls
 * can therefore observe the same seed. Successful completion commits the returned
 * seed and emits in completion order, so later completion may overwrite newer
 * state. Reducer failure is sent to the output Sink, emits nothing, restores that
 * call's previous seed, and completes normally so a continuing producer can send
 * later values. The input Sink is unchanged.
 *
 * @remarks
 * ## Why
 *
 * Use an effectful accumulator when each transition needs services or can fail,
 * while keeping state local to observation rather than global application state.
 *
 * ## Ownership and lifetime
 *
 * Each output run owns one mutable seed, but concurrent producer callbacks may
 * race over it; callers needing serialized state transitions must serialize the
 * upstream deliveries. Each callback fiber runs and interrupts its own reducer
 * Effect. `E3` and `R3` join the output channels. State is discarded when the
 * subscription ends.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * const concurrent = Fx.make<number>((sink) =>
 *   Effect.all([sink.onSuccess(1), sink.onSuccess(2)], {
 *     concurrency: "unbounded",
 *     discard: true
 *   })
 * )
 * const push = Push.make(Sink.make(() => Effect.void, (_: string) => Effect.void), concurrent)
 * const totals = Push.mapAccumEffect(push, 0, (seed, value) =>
 *   Effect.sleep(value === 1 ? "20 millis" : "1 millis").pipe(
 *     Effect.as([seed + value, seed + value] as const)
 *   )
 * )
 * const program = Fx.collectAll(totals).pipe(Effect.scoped)
 * // Both reducers see seed 0; Effect.runPromise(program) resolves to [2, 1].
 *
 * const values: Array<number> = []
 * let failures = 0
 * const sequential = Push.make(
 *   Sink.make(() => Effect.void, (_: string) => Effect.void),
 *   Fx.fromIterable([1, 2, 3])
 * )
 * const continued = Push.mapAccumEffect(sequential, 0, (seed, value) =>
 *   value === 2
 *     ? Effect.fail("rejected" as const)
 *     : Effect.succeed([seed + value, seed + value] as const)
 * )
 * const recovery = continued.run(Sink.make(
 *   () => Effect.sync(() => { failures += 1 }),
 *   (value) => Effect.sync(() => values.push(value))
 * ))
 * // Effect.runPromise(recovery) leaves values [1, 4] and failures 1.
 * ```
 *
 * @param initial - Initial accumulator state.
 * @param f - Effectful reducer `(state, value) => Effect<[nextState, emitted]>`.
 * @returns A `Push` whose Fx side emits the accumulated/mapped values.
 * @since 1.0.0
 * @category Stateful outputs
 */
export const mapAccumEffect: {
  <S, B, C, E3, R3>(
    initial: S,
    f: (s: S, b: B) => Effect.Effect<readonly [S, C], E3, R3>,
  ): <A, E, R, E2, R2>(push: Push<A, E, R, B, E2, R2>) => Push<A, E, R, C, E2 | E3, R2 | R3>;
  <A, E, R, B, E2, R2, S, C, E3, R3>(
    push: Push<A, E, R, B, E2, R2>,
    initial: S,
    f: (s: S, b: B) => Effect.Effect<readonly [S, C], E3, R3>,
  ): Push<A, E, R, C, E2 | E3, R2 | R3>;
} = dual(3, function mapAccumEffect<
  A,
  E,
  R,
  B,
  E2,
  R2,
  S,
  C,
  E3,
  R3,
>(push: Push<A, E, R, B, E2, R2>, initial: S, f: (s: S, b: B) => Effect.Effect<readonly [S, C], E3, R3>): Push<
  A,
  E,
  R,
  C,
  E2 | E3,
  R2 | R3
> {
  return make(
    push,
    Fx.make(<RSink>(sink: Sink.Sink<C, E2 | E3, RSink>) =>
      push.run(
        Sink.filterMapLoopEffect(sink, initial, (s, b) =>
          f(s, b).pipe(
            Effect.map(([sNext, c]) => [Option.some(c), sNext] as const),
            Effect.catchCause((cause) =>
              sink.onFailure(cause).pipe(Effect.as([Option.none(), s] as const)),
            ),
          ),
        ),
      ),
    ),
  );
});

/**
 * Defines a named Effect service whose value is a `Push`.
 *
 * The returned class exposes `onSuccess`, `onFailure`, and `run` as Effects that
 * first resolve the service from Context. `make` captures the Sink construction
 * context and combines it with each output subscriber's context; it does not start
 * the Fx or send an input while building the Layer.
 *
 * @remarks
 * ## Why
 *
 * A service gives a bidirectional application capability one stable identity, so
 * producers and observers can depend on it through ordinary Effect requirements.
 *
 * ## Ownership and lifetime
 *
 * The returned Layer owns service installation and captures non-Scope services
 * needed by both sides. Output runs retain the caller's Scope and interruption;
 * input acknowledgment Effects run in their caller. Layer release drops the
 * service but does not invent cleanup beyond the supplied Sink and Fx.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Push from "@typed/fx/Push"
 * import * as Sink from "@typed/fx/Sink"
 *
 * class Messages extends Push.Service<Messages, string, never, string>()("Messages") {}
 * const MessagesLive = Messages.make(
 *   Sink.make(() => Effect.void, (message) => Effect.log(message)),
 *   Fx.succeed("ready")
 * )
 * const send = Messages.onSuccess("hello").pipe(Effect.provide(MessagesLive))
 * ```
 *
 * @since 1.0.0
 * @category Push services
 */
export function Service<Self, A, E = never, B = never, E2 = never>() {
  return <const Id extends string>(id: Id): Push.Class<Self, Id, A, E, B, E2> => {
    const service = Context.Service<Self, Push<A, E, never, B, E2, never>>(id);

    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    return class PushService {
      static readonly id = id;
      static readonly service = service;

      static readonly make = <R = never, R2 = never>(
        sink: Sink.Sink<A, E, R>,
        fx: Fx.Fx<B, E2, R2>,
      ): Layer.Layer<Self, never, Exclude<R | R2, Scope.Scope>> =>
        Layer.effect(
          service,
          Effect.context<R | R2>().pipe(
            Effect.map((services) =>
              make(
                Sink.make(
                  (cause) => Effect.provideContext(sink.onFailure(cause), services),
                  (value) => Effect.provideContext(sink.onSuccess(value), services),
                ),
                Fx.make(<RSink>(sink: Sink.Sink<B, E2, RSink>) =>
                  Effect.context<RSink>().pipe(
                    Effect.flatMap((services2) =>
                      Effect.provideContext(fx.run(sink), Context.merge(services, services2)),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );

      static readonly [FxTypeId] = VARIANCE;
      static readonly pipe = function (this: any) {
        return pipeArguments(this, arguments);
      };

      // Fx methods
      static readonly run = <R3>(
        sink: Sink.Sink<B, E2, R3>,
      ): Effect.Effect<unknown, never, R3 | Self> =>
        Effect.flatMap(service, (push) => push.run(sink));

      // Sink methods
      static readonly onSuccess = (value: A): Effect.Effect<unknown, never, Self> =>
        Effect.flatMap(service, (push) => push.onSuccess(value));
      static readonly onFailure = (cause: Cause.Cause<E>): Effect.Effect<unknown, never, Self> =>
        Effect.flatMap(service, (push) => push.onFailure(cause));

      constructor() {
        return PushService as unknown as Push.Class<Self, Id, A, E, B, E2>;
      }
    } as unknown as Push.Class<Self, Id, A, E, B, E2>;
  };
}
