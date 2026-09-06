/** @effect-diagnostics missingEffectError:skip-file */
/** @effect-diagnostics missingEffectContext:skip-file */

/**
 * Versioned is a special Fx which is also an Effect, and keeps track of a version number of the
 * current value it holds. The Fx portion is used to subscribe to changes, the Effect portion to
 * sample the current value. The version can be utilized to avoid computing work related to this value.
 * @since 1.0.0
 */

import * as Effect from "effect/Effect";
import * as Effectable from "effect/Effectable";
import type * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import { dual, flow, identity } from "effect/Function";
import * as Layer from "effect/Layer";
import { sum } from "effect/Number";
import * as Option from "effect/Option";
import { pipeArguments } from "effect/Pipeable";
import type * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import { filterMap as fxFilterMap } from "../Fx/combinators/filterMap.js";
import { filterMapEffect as fxFilterMapEffect } from "../Fx/combinators/filterMapEffect.js";
import { map as fxMap } from "../Fx/combinators/map.js";
import { mapEffect as fxMapEffect } from "../Fx/combinators/mapEffect.js";
import {
  provide as fxProvide,
  provideContext as fxprovideContext,
} from "../Fx/combinators/provide.js";
import { struct as fxStruct, tuple as fxTuple } from "../Fx/combinators/tuple.js";
import { succeed as fxSucceed } from "../Fx/constructors/succeed.js";
import type * as Fx from "../Fx/Fx.js";
import { MulticastEffect } from "../Fx/internal/multicast.js";
import { YieldableFx } from "../Fx/internal/yieldable.js";
import { FxTypeId } from "../Fx/TypeId.js";
import type * as Sink from "../Sink/Sink.js";
import * as Subject from "../Subject/Subject.js";

// TODO: dualize
// TODO: context abstraction
// TODO: More operators

/**
 * A Versioned value is a value that changes over time, and each change is associated with a version number.
 * It combines the capabilities of an `Fx` (to observe changes) and an `Effect` (to get the current value).
 *
 * @remarks
 * ## Why
 *
 * Keeps a current-value Effect, pushed Fx updates, and an invalidation version together so
 * consumers can avoid stale work without hiding errors or services.
 *
 * ## Ownership and lifetime
 *
 * Versioned is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.0.0
 * @category State protocol
 */
export interface Versioned<out R1, out E1, out A2, out E2, out R2, out A3, out E3, out R3>
  extends Fx.Fx<A2, E2, R2>, Effect.Effect<A3, E3, R3> {
  /**
   * Samples the current invalidation version.
   *
   * @remarks
   * ## Why
   *
   * Samples the input's invalidation token independently of reading the current value or observing
   * pushed updates.
   *
   * ## Ownership and lifetime
   *
   * version does not own its inputs. Observation and current reads retain upstream lifetime,
   * typed failures, services, and interruption behavior.
   *
   * @since 1.0.0
   * @category Version reads
   */
  readonly version: Effect.Effect<number, E1, R1>;
  /**
   * Interrupts shared in-flight current-value work.
   *
   * @remarks
   * ## Why
   *
   * Returns an Effect that interrupts shared in-flight current-value work and completes with
   * `void`; it does not complete or take ownership of the independently supplied Fx update channel.
   *
   * ## Ownership and lifetime
   *
   * Nothing happens until the Effect is run. It cannot fail, requires the version channel's `R1`,
   * and does not start a read or subscription merely by being accessed.
   *
   * @since 1.0.0
   * @category Lifetime
   */
  readonly interrupt: Effect.Effect<void, never, R1>;
}

/**
 * Type utilities and service contracts for Versioned values.
 *
 * @remarks
 * ## Why
 *
 * Groups channel-extraction types with the Context-backed service facade. The namespace is not a
 * Versioned value and cannot sample a version, read a current value, or observe pushes.
 *
 * ## Ownership and lifetime
 *
 * The namespace performs no acquisition. Concrete Versioned values and Layers retain their own
 * errors, services, interruption behavior, and Scope requirements.
 *
 * @since 1.0.0
 * @category State protocol
 */
export namespace Versioned {
  /**
   * Unifies a Versioned type.
   * @since 1.0.0
   * @category Type utilities
   * @remarks
   * ## Why
   *
   * Normalizes the eight Versioned channels after conditional type inference so generic helpers
   * preserve their exact value, error, and service types.
   *
   * ## Ownership and lifetime
   *
   * Unify is a contract and performs no acquisition. Implementations retain the errors,
   * services, interruption, and Scope requirements expressed by its members.
   *
   */
  export type Unify<T> = T extends
    | Versioned<infer R1, infer E1, infer A2, infer E2, infer R2, infer A3, infer E3, infer R3>
    | (infer _)
    ? Versioned<R1, E1, A2, E2, R2, A3, E3, R3>
    : never;

  /**
   * Extracts the context required to get the version.
   * @since 1.0.0
   * @category Type utilities
   * @remarks
   * ## Why
   *
   * Extracts only the services required to sample a Versioned token, which may differ from the push
   * and current-read environments.
   *
   * ## Ownership and lifetime
   *
   * VersionContext is a contract and performs no acquisition. Implementations retain the errors,
   * services, interruption, and Scope requirements expressed by its members.
   *
   */
  export type VersionContext<T> =
    T extends Versioned<infer R, any, any, any, any, any, any, any> ? R : never;

  /**
   * Extracts the error type of the version effect.
   * @since 1.0.0
   * @category Type utilities
   * @remarks
   * ## Why
   *
   * Extracts only the failure channel of version sampling instead of conflating it with update or
   * current-read failures.
   *
   * ## Ownership and lifetime
   *
   * VersionError is a contract and performs no acquisition. Implementations retain the errors,
   * services, interruption, and Scope requirements expressed by its members.
   *
   */
  export type VersionError<T> =
    T extends Versioned<any, infer E, any, any, any, any, any, any> ? E : never;

  /**
   * Defines the service state contract.
   *
   * @remarks
   * ## Why
   *
   * Creates an Effect service tag that exposes current reads, pushed updates, and versions through
   * one Layer-provided state dependency.
   *
   * ## Ownership and lifetime
   *
   * Service is a contract and performs no acquisition. Implementations retain the errors,
   * services, interruption, and Scope requirements expressed by its members.
   *
   * @since 1.0.0
   * @category Services
   */
  export interface Service<Self, Id extends string, E1, A2, E2, A3, E3> extends Versioned<
    Self,
    E1,
    A2,
    E2,
    Self,
    A3,
    E3,
    Self
  > {
    /**
     * Exposes id on the versioned contract.
     *
     * @remarks
     * ## Why
     *
     * Retains the literal service identifier for tooling, diagnostics, and Layer composition.
     *
     * ## Ownership and lifetime
     *
     * id does not own its inputs. Observation and current reads retain upstream lifetime, typed
     * failures, services, and interruption behavior.
     *
     * @since 1.0.0
     * @category Services
     */
    readonly id: Id;
    /**
     * Exposes service on the versioned contract.
     *
     * @remarks
     * ## Why
     *
     * Exposes the underlying Effect Context service used by the generated Versioned class.
     *
     * ## Ownership and lifetime
     *
     * service does not own its inputs. Observation and current reads retain upstream lifetime,
     * typed failures, services, and interruption behavior.
     *
     * @since 1.0.0
     * @category Services
     */
    readonly service: Context.Service<Self, Versioned<never, E1, A2, E2, never, A3, E3, never>>;
    /**
     * Exposes make on the versioned contract.
     *
     * @remarks
     * ## Why
     *
     * Builds one Versioned value from independently typed version, update, and current-value channels
     * instead of forcing them into one error or environment type.
     *
     * ## Ownership and lifetime
     *
     * Construction is lazy with respect to the Fx channel. Current reads share in-flight work until
     * interrupt is run; each component retains its declared errors and services.
     *
     * @since 1.0.0
     * @category Constructors
     */
    readonly make: <R1 = never, R2 = never, R3 = never>(
      version: Effect.Effect<number, E1, R1>,
      fx: Fx.Fx<A2, E2, R2>,
      effect: Effect.Effect<A3, E3, R3>,
    ) => Layer.Layer<Self, never, Exclude<R1 | R2 | R3, Scope.Scope>>;
  }

  /**
   * Defines the class state contract.
   *
   * @remarks
   * ## Why
   *
   * Describes the constructable service facade returned by Service, including the same static Effect
   * and Fx operations as its tag.
   *
   * ## Ownership and lifetime
   *
   * Class is a contract and performs no acquisition. Implementations retain the errors,
   * services, interruption, and Scope requirements expressed by its members.
   *
   * @since 1.0.0
   * @category Services
   */
  export interface Class<Self, Id extends string, E1, A2, E2, A3, E3> extends Service<
    Self,
    Id,
    E1,
    A2,
    E2,
    A3,
    E3
  > {
    /**
     * Construct signature used by the generated Versioned service class.
     *
     * @remarks
     * ## Why
     *
     * Enables class-extension syntax while returning the generated static service facade rather
     * than allocating another Versioned value.
     *
     * ## Ownership and lifetime
     *
     * Construction itself performs no Effect or acquisition. The matching Layer owns the installed
     * Versioned value and supplies its three channels.
     *
     * @since 1.0.0
     * @category Type utilities
     */
    new (): Service<Self, Id, E1, A2, E2, A3, E3>;
  }
}

/**
 * Creates a Versioned value from its components.
 *
 * @remarks
 * ## Why
 *
 * Builds one Versioned value from independently typed version, update, and current-value channels
 * instead of forcing them into one error or environment type.
 *
 * ## Ownership and lifetime
 *
 * Construction is lazy with respect to the Fx channel. Current reads share in-flight work until
 * interrupt is run; each component retains its declared errors and services.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Versioned from "@typed/fx/Versioned"
 *
 * const status = Versioned.make(
 *   Effect.succeed(1),
 *   Fx.succeed("ready"),
 *   Effect.succeed("ready")
 * )
 *
 * const snapshot = Effect.all({ value: status, version: status.version })
 * ```
 *
 * @param version - An effect that retrieves the current version number.
 * @param fx - The stream of updates.
 * @param effect - An effect that retrieves the current value.
 * @returns A `Versioned` value.
 * @since 1.0.0
 * @category Constructors
 */
export function make<R1, E1, A2, E2, R2, A3, E3, R3>(
  version: Effect.Effect<number, E1, R1>,
  fx: Fx.Fx<A2, E2, R2>,
  effect: Effect.Effect<A3, E3, R3>,
): Versioned<R1, E1, A2, E2, R2, A3, E3, R3> {
  return new VersionedImpl(version, fx, effect);
}

class VersionedImpl<R1, E1, A2, E2, R2, A3, E3, R3>
  extends YieldableFx<A2, E2, R2, A3, E3, R3>
  implements Versioned<R1, E1, A2, E2, R2, A3, E3, R3>
{
  readonly version: Effect.Effect<number, E1, R1>;
  readonly fx: Fx.Fx<A2, E2, R2>;
  readonly effect: MulticastEffect<A3, E3, R3>;

  constructor(
    version: Effect.Effect<number, E1, R1>,
    fx: Fx.Fx<A2, E2, R2>,
    effect: Effect.Effect<A3, E3, R3>,
  ) {
    super();
    this.version = version;
    this.fx = fx;
    this.effect = new MulticastEffect(effect);
  }

  run<R3>(sink: Sink.Sink<A2, E2, R3>): Effect.Effect<unknown, never, R2 | R3> {
    return this.fx.run(sink);
  }

  toEffect(): Effect.Effect<A3, E3, R3> {
    return this.effect;
  }

  interrupt = Effect.suspend(() => this.effect.interrupt());
}

/**
 * Transforms a Versioned value into another Versioned value.
 *
 * @remarks
 * ## Why
 *
 * Transforms the pushed and sampled channels together while retaining one version source, so both
 * ways of consuming the value stay coherent.
 *
 * ## Ownership and lifetime
 *
 * transform does not take ownership of its inputs. Its observation and current-read channels
 * retain upstream lifetime, typed failures, services, and interruption behavior.
 * Sampled projections and in-flight reads are cached separately for each Effect Context object.
 * Interrupting a transformed value affects the current Context's in-flight read.
 *
 * @param input - The source Versioned value.
 * @param transformFx - A function to transform the update stream.
 * @param transformGet - A function to transform the current value effect.
 * @returns A new `Versioned` value.
 * @since 1.0.0
 * @category Channel transformations
 */
export function transform<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
  input: Versioned<R0, E0, A, E, R, B, E2, R2>,
  transformFx: (fx: Fx.Fx<A, E, R>) => Fx.Fx<C, E3, R3>,
  transformGet: (effect: Effect.Effect<B, E2, R2>) => Effect.Effect<D, E4, R4>,
): Versioned<never, never, C, E3, R3, D, E0 | E4, R0 | R4> {
  if (isVersionedTransform(input)) {
    return new VersionedTransform(
      input.input,
      flow(input._transformFx, transformFx),
      flow(input._transformEffect, transformGet),
    );
  } else {
    return new VersionedTransform(input, transformFx, transformGet);
  }
}

/**
 * @internal
 */
export class VersionedTransform<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>
  extends YieldableFx<C, E3, R3, D, E0 | E4, R0 | R4>
  implements Versioned<never, never, C, E3, R3, D, E0 | E4, R0 | R4>
{
  public _version = -1;
  public _currentValue: Option.Option<Exit.Exit<D, E0 | E4>> = Option.none();
  public _fx: Fx.Fx<C, E3, R3>;
  private readonly contexts = new WeakMap<
    Context.Context<never>,
    {
      version: number;
      currentValue: Option.Option<Exit.Exit<D, E0 | E4>>;
      effect?: MulticastEffect<D, E0 | E4, R0 | R4>;
    }
  >();

  readonly input: Versioned<R0, E0, A, E, R, B, E2, R2>;
  readonly _transformFx: (fx: Fx.Fx<A, E, R>) => Fx.Fx<C, E3, R3>;
  readonly _transformEffect: (effect: Effect.Effect<B, E2, R2>) => Effect.Effect<D, E4, R4>;

  constructor(
    input: Versioned<R0, E0, A, E, R, B, E2, R2>,
    _transformFx: (fx: Fx.Fx<A, E, R>) => Fx.Fx<C, E3, R3>,
    _transformEffect: (effect: Effect.Effect<B, E2, R2>) => Effect.Effect<D, E4, R4>,
  ) {
    super();

    this.input = input;
    this._transformFx = _transformFx;
    this._transformEffect = _transformEffect;
    this._fx = _transformFx(this.input);
  }

  readonly version: Effect.Effect<number> = Effect.contextWith((context) =>
    Effect.sync(() => this.contexts.get(context)?.version ?? -1),
  );

  run<R5>(sink: Sink.Sink<C, E3, R5>): Effect.Effect<unknown, never, R3 | R5> {
    return this._fx.run(sink);
  }

  toEffect(): Effect.Effect<D, E0 | E4, R0 | R4> {
    const transformed = this._transformEffect(this.input);
    return Effect.contextWith((context) => {
      let state = this.contexts.get(context);
      if (!state) {
        state = { version: -1, currentValue: Option.none() };
        this.contexts.set(context, state);
      }
      const current = state;
      return (current.effect ??= new MulticastEffect(
        Effect.flatMap(this.input.version, (version) => {
          if (version === current.version && Option.isSome(current.currentValue)) {
            return current.currentValue.value;
          }
          return Effect.onExit(transformed, (exit) =>
            Effect.sync(() => {
              current.currentValue = Option.some(exit);
              current.version = version;
              this._currentValue = current.currentValue;
              this._version = version;
            }),
          );
        }),
      ));
    });
  }

  interrupt: Effect.Effect<void, never, never> = Effect.contextWith(
    (context) => this.contexts.get(context)?.effect?.interrupt() ?? Effect.void,
  );
}

function isVersionedTransform(
  u: unknown,
): u is VersionedTransform<any, any, any, any, any, any, any, any, any, any, any, any, any, any> {
  return u instanceof VersionedTransform;
}

/**
 * Transform a Versioned's output value as both an Fx and Effect.
 * @remarks
 * ## Why
 *
 * Applies corresponding pure projections to pushed and sampled values while leaving the version
 * token unchanged.
 *
 * ## Ownership and lifetime
 *
 * map does not take ownership of its inputs. Its observation and current-read channels retain
 * upstream lifetime, typed failures, services, and interruption behavior.
 *
 * Pure callbacks preserve push order and cardinality. `onFx` applies to every pushed update;
 * `onEffect` applies only when the current value is sampled.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Versioned from "@typed/fx/Versioned"
 *
 * const length = Versioned.map(Versioned.of("typed"), {
 *   onFx: (value) => value.length,
 *   onEffect: (value) => value.length
 * })
 *
 * const currentLength = Effect.runPromise(length)
 * ```
 *
 * @since 1.18.0
 * @category Channel transformations
 */
export const map: {
  <A, E, R, C, B, D>(options: {
    onFx: (a: A) => C;
    onEffect: (b: B) => D;
  }): <R0, E0, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  ) => Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2>;

  <R0, E0, A, E, R, B, E2, R2, C, D>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => C;
      onEffect: (b: B) => D;
    },
  ): Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2>;
} = dual(
  2,
  function map<R0, E0, A, E, R, B, E2, R2, C, D>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => C;
      onEffect: (b: B) => D;
    },
  ): Versioned<never, never, C, E, R, D, E0 | E2, R0 | R2> {
    return transform(versioned, (fx) => fxMap(fx, options.onFx), Effect.map(options.onEffect));
  },
);

/**
 * Transform a Versioned's output value as both an Fx and Effect using an Effect.
 * @remarks
 * ## Why
 *
 * Allows pushed and sampled projections to require services or fail, and exposes those additions
 * in the corresponding output channels.
 *
 * ## Ownership and lifetime
 *
 * No subscription starts during transformation. Callback effects run when their push or read
 * channel is consumed and are interrupted with that consumer.
 *
 * @since 1.18.0
 * @category Channel transformations
 */
export const mapEffect: {
  <A, C, E3, R3, B, D, E4, R4>(options: {
    onFx: (a: A) => Effect.Effect<C, E3, R3>;
    onEffect: (b: B) => Effect.Effect<D, E4, R4>;
  }): <R0, E0, R, E, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  ) => Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4>;

  <R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => Effect.Effect<C, E3, R3>;
      onEffect: (b: B) => Effect.Effect<D, E4, R4>;
    },
  ): Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4>;
} = dual(
  2,
  function mapEffect<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => Effect.Effect<C, E3, R3>;
      onEffect: (b: B) => Effect.Effect<D, E4, R4>;
    },
  ): Versioned<never, never, C, E | E3, R | R3, D, E0 | E2 | E4, R0 | R2 | R4> {
    return transform(
      versioned,
      (fx) => fxMapEffect(fx, options.onFx),
      Effect.flatMap(options.onEffect),
    );
  },
);

/**
 * Filter-maps a Versioned's output as both an Fx and Effect; the Effect value becomes `Option` (Some when the predicate holds, None otherwise).
 * @remarks
 * ## Why
 *
 * Drops absent pushed values while preserving an Option for the current read, making the two
 * absence semantics explicit.
 *
 * ## Ownership and lifetime
 *
 * filterMap does not take ownership of its inputs. Its observation and current-read channels
 * retain upstream lifetime, typed failures, services, and interruption behavior.
 *
 * @since 1.18.0
 * @category Optional channel transformations
 */
export const filterMap: {
  <A, E, R, C, B, D>(options: {
    onFx: (a: A) => Option.Option<C>;
    onEffect: (b: B) => Option.Option<D>;
  }): <R0, E0, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  ) => Versioned<never, never, C, E, R, Option.Option<D>, E0 | E2, R0 | R2>;

  <R0, E0, A, E, R, B, E2, R2, C, D>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => Option.Option<C>;
      onEffect: (b: B) => Option.Option<D>;
    },
  ): Versioned<never, never, C, E, R, Option.Option<D>, E0 | E2, R0 | R2>;
} = dual(
  2,
  function filterMap<R0, E0, A, E, R, B, E2, R2, C, D>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => Option.Option<C>;
      onEffect: (b: B) => Option.Option<D>;
    },
  ): Versioned<never, never, C, E, R, Option.Option<D>, E0 | E2, R0 | R2> {
    return transform(
      versioned,
      (fx) => fxFilterMap(fx, options.onFx),
      (effect) => Effect.map(effect, options.onEffect),
    );
  },
);

/**
 * Filter-maps a Versioned's output as both an Fx and Effect using an Effect; the Effect value becomes `Option`.
 * @remarks
 * ## Why
 *
 * Adds Effectful filtering independently to the push and current-read channels while preserving
 * their separate error and service types.
 *
 * ## Ownership and lifetime
 *
 * No subscription starts during transformation. Callback effects run when their push or read
 * channel is consumed and are interrupted with that consumer.
 *
 * @since 1.18.0
 * @category Optional channel transformations
 */
export const filterMapEffect: {
  <A, C, E3, R3, B, D, E4, R4>(options: {
    onFx: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>;
    onEffect: (b: B) => Effect.Effect<Option.Option<D>, E4, R4>;
  }): <R0, E0, R, E, R2, E2>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  ) => Versioned<never, never, C, E | E3, R | R3, Option.Option<D>, E0 | E2 | E4, R0 | R2 | R4>;

  <R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>;
      onEffect: (b: B) => Effect.Effect<Option.Option<D>, E4, R4>;
    },
  ): Versioned<never, never, C, E | E3, R | R3, Option.Option<D>, E0 | E2 | E4, R0 | R2 | R4>;
} = dual(
  2,
  function filterMapEffect<R0, E0, A, E, R, B, E2, R2, C, E3, R3, D, E4, R4>(
    versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
    options: {
      onFx: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>;
      onEffect: (b: B) => Effect.Effect<Option.Option<D>, E4, R4>;
    },
  ): Versioned<never, never, C, E | E3, R | R3, Option.Option<D>, E0 | E2 | E4, R0 | R2 | R4> {
    return transform(
      versioned,
      (fx) => fxFilterMapEffect(fx, options.onFx),
      (effect) => Effect.flatMap(effect, options.onEffect),
    );
  },
);

/**
 * Combines multiple Versioned values into a single tuple.
 * @remarks
 * ## Why
 *
 * Combines several Versioned values positionally and uses their versions as one invalidation token
 * for the assembled tuple.
 *
 * ## Ownership and lifetime
 *
 * tuple does not take ownership of its inputs. Its observation and current-read channels retain
 * upstream lifetime, typed failures, services, and interruption behavior.
 *
 * @since 1.0.0
 * @category State composition
 */
export function tuple<
  const VS extends ReadonlyArray<Versioned<any, any, any, any, any, any, any, any>>,
>(
  versioneds: VS,
): Versioned<
  Versioned.VersionContext<VS[number]>,
  Versioned.VersionError<VS[number]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Fx.Error<VS[number]>,
  Fx.Services<VS[number]>,
  { readonly [K in keyof VS]: Effect.Success<VS[K]> },
  Effect.Error<VS[number]>,
  Effect.Services<VS[number]>
> {
  return make(
    Effect.map(Effect.all(versioneds.map((v) => v.version)), (versions) => versions.reduce(sum, 0)),
    fxTuple(...versioneds),
    Effect.all(
      versioneds.map((v) => v),
      { concurrency: "unbounded" },
    ),
  ) as any;
}

/**
 * Combines multiple Versioned values into a single struct.
 * @remarks
 * ## Why
 *
 * Combines named Versioned values and preserves each field's pushed value, sampled value, errors,
 * and services in the resulting structure.
 *
 * ## Ownership and lifetime
 *
 * struct does not take ownership of its inputs. Its observation and current-read channels retain
 * upstream lifetime, typed failures, services, and interruption behavior.
 *
 * @since 1.0.0
 * @category State composition
 */
export function struct<
  const VS extends Readonly<Record<string, Versioned<any, any, any, any, any, any, any, any>>>,
>(
  versioneds: VS,
): Versioned<
  Versioned.VersionContext<VS[keyof VS]>,
  Versioned.VersionError<VS[keyof VS]>,
  { readonly [K in keyof VS]: Fx.Success<VS[K]> },
  Fx.Error<VS[keyof VS]>,
  Fx.Services<VS[keyof VS]>,
  { readonly [K in keyof VS]: Effect.Success<VS[K]> },
  Effect.Error<VS[keyof VS]>,
  Effect.Services<VS[keyof VS]>
> {
  return make(
    Effect.map(Effect.all(Object.values(versioneds).map((v) => v.version)), (versions) =>
      versions.reduce(sum, 0),
    ),
    fxStruct(versioneds),
    Effect.all(
      mapRecord(versioneds, (v) => v),
      { concurrency: "unbounded" },
    ) as any,
  );
}

/**
 * Provides context to a Versioned value.
 * @remarks
 * ## Why
 *
 * Supplies one Layer to all three Versioned channels so service elimination is consistent for
 * version reads, pushed updates, and current reads.
 *
 * ## Ownership and lifetime
 *
 * provide does not take ownership of its inputs. Its observation and current-read channels retain
 * upstream lifetime, typed failures, services, and interruption behavior.
 *
 * @since 1.0.0
 * @category Services
 */
export const provide = <R0, E0, A, E, R, B, E2, R2, R3 = never, S = never>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  layer: Layer.Layer<S, never, R3>,
): Versioned<R3 | Exclude<R0, S>, E0, A, E, R3 | Exclude<R, S>, B, E2, R3 | Exclude<R2, S>> => {
  return make(
    Effect.provide(versioned.version, layer),
    fxProvide(versioned, layer),
    Effect.provide(versioned, layer),
  );
};

function mapRecord<K extends string, V, R>(
  record: Record<K, V>,
  f: (v: V, k: K) => R,
): Record<K, R> {
  return Object.fromEntries(Object.entries<V>(record).map(([k, v]) => [k, f(v, k as K)])) as Record<
    K,
    R
  >;
}

/**
 * Creates a Versioned value from a constant.
 * @remarks
 * ## Why
 *
 * Creates constant versioned state for composition and testing without starting a fiber or
 * requiring a Scope.
 *
 * ## Ownership and lifetime
 *
 * of does not take ownership of its inputs. Its observation and current-read channels retain
 * upstream lifetime, typed failures, services, and interruption behavior.
 *
 * @since 1.0.0
 * @category Constructors
 */
export function of<A>(value: A): Versioned<never, never, A, never, never, A, never, never> {
  return make(Effect.succeed(1), fxSucceed(value), Effect.succeed(value));
}

/**
 * Holds the latest value of a Versioned stream.
 * @remarks
 * ## Why
 *
 * Retains the latest pushed value for later subscribers while leaving current-value reads
 * delegated to the original Versioned Effect.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx requires Scope; its shared upstream subscription and retained buffer are
 * finalized when that Scope closes. Current reads retain input errors and services.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Versioned from "@typed/fx/Versioned"
 *
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const shared = Versioned.hold(Versioned.of({ status: "ready" as const }))
 *   return yield* shared
 * }))
 * ```
 *
 * @since 1.0.0
 * @category Shared observation
 */
export function hold<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2> {
  return make(versioned.version, Subject.hold(versioned), versioned);
}

/**
 * Multicasts a Versioned stream.
 * @remarks
 * ## Why
 *
 * Shares one upstream push subscription among concurrent observers while retaining the original
 * current-read and version effects. Unlike `hold` and `replay`, `multicast` retains zero values: a
 * late observer receives only pushes that happen after it subscribes.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx requires Scope; that Scope owns and finalizes the shared upstream subscription.
 * There is no replay buffer or held latest value. Current reads bypass the multicast channel and
 * retain the input's errors and services.
 *
 * @since 1.0.0
 * @category Shared observation
 */
export function multicast<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
): Versioned<R0, E0, A, E, R | Scope.Scope, B, E2, R2> {
  return make(versioned.version, Subject.multicast(versioned), versioned);
}

/**
 * Replays the last `bufferSize` values of a Versioned stream.
 * @remarks
 * ## Why
 *
 * Shares an upstream push subscription and replays a bounded number of updates to late observers
 * without changing current-value reads.
 *
 * ## Ownership and lifetime
 *
 * The returned Fx requires Scope; its shared upstream subscription and retained buffer are
 * finalized when that Scope closes. Current reads retain input errors and services.
 *
 * @since 1.0.0
 * @category Shared observation
 */
export function replay<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned<R0, E0, A, E, R, B, E2, R2>,
  bufferSize: number,
): Versioned<R0, E0, A, E | Cause.IllegalArgumentError, R | Scope.Scope, B, E2, R2> {
  return make(versioned.version, Subject.replay(versioned, bufferSize), versioned);
}

const VARIANCE = {
  _A: identity,
  _E: identity,
  _R: identity,
};

/**
 * Creates a Context-backed Versioned service facade and Layer constructor.
 *
 * @remarks
 * ## Why
 *
 * Creates an Effect service tag that exposes current reads, pushed updates, and versions through
 * one Layer-provided state dependency.
 *
 * ## Ownership and lifetime
 *
 * Calling Service is pure. The generated make Layer captures required environments and owns the
 * provided state for the Layer Scope.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Fx from "@typed/fx/Fx"
 * import * as Versioned from "@typed/fx/Versioned"
 *
 * class Status extends Versioned.Service<Status, never, string, never, string>()(
 *   "example/Status"
 * ) {}
 *
 * const StatusLive = Status.make(
 *   Effect.succeed(1),
 *   Fx.succeed("ready"),
 *   Effect.succeed("ready")
 * )
 * ```
 *
 * @since 1.0.0
 * @category Services
 */
export function Service<Self, E1 = never, A2 = never, E2 = never, A3 = never, E3 = never>() {
  return <const Id extends string>(id: Id): Versioned.Class<Self, Id, E1, A2, E2, A3, E3> => {
    const service = Context.Service<Self, Versioned<never, E1, A2, E2, never, A3, E3, never>>(id);

    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    return class VersionedService {
      static readonly id = id;
      static readonly service = service;

      static {
        // @effect-diagnostics-next-line floatingEffect:off
        Object.assign(this, service);
        Object.setPrototypeOf(this, Object.getPrototypeOf(service));
        // @effect-diagnostics-next-line floatingEffect:off
        Object.assign(this, Effectable.Prototype<Effect.Effect<A3, E3, Self>>({
          label: "Versioned.Service",
          evaluate: () => Effect.flatten(service),
        }));
      }

      static readonly make = <R1 = never, R2 = never, R3 = never>(
        version: Effect.Effect<number, E1, R1>,
        fx: Fx.Fx<A2, E2, R2>,
        effect: Effect.Effect<A3, E3, R3>,
      ): Layer.Layer<Self, never, Exclude<R1 | R2 | R3, Scope.Scope>> =>
        Layer.effect(
          service,
          Effect.context<R1 | R2 | R3>().pipe(
            Effect.map((context) =>
              make(
                Effect.provide(version, context),
                fxprovideContext(fx, context),
                Effect.provide(effect, context),
              ),
            ),
          ),
        );

      static readonly [FxTypeId] = VARIANCE;
      static readonly pipe = function (this: any) {
        return pipeArguments(this, arguments);
      };

      static readonly version = Effect.flatMap(service, (v) => v.version);
      static readonly interrupt = Effect.flatMap(service, (v) => v.interrupt);

      static readonly run = <RSink>(sink: Sink.Sink<A2, E2, RSink>) =>
        Effect.flatMap(service, (v) => v.run(sink));

      static readonly override = Effect.flatMap(service, identity);
      static readonly [Symbol.iterator] = function* () {
        const v = yield* service;
        return yield* v;
      };

      constructor() {
        return VersionedService;
      }
    } as unknown as Versioned.Class<Self, Id, E1, A2, E2, A3, E3>;
  };
}
