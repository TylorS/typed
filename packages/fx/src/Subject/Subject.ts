import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import { dual, identity } from "effect/Function";
import * as Layer from "effect/Layer";
import * as MutableRef from "effect/MutableRef";
import * as Option from "effect/Option";
import { pipeArguments } from "effect/Pipeable";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import type * as Fx from "../Fx/index.js";
import { fail } from "../Fx/constructors/fail.js";
import { RingBuffer } from "../Fx/internal/ring-buffer.js";
import { awaitScopeClose, withExtendedScope } from "../Fx/internal/scope.js";
import { FxTypeId } from "../Fx/TypeId.js";
import type * as Sink from "../Sink/Sink.js";

/**
 * A multicast boundary that is both an `Fx` of its publications and a `Sink` that accepts them.
 * Successes and failures are pushed to every subscriber present when that publication begins.
 *
 * @remarks
 * ## Why
 *
 * `Subject` connects imperative or independently owned producers to `Fx` without changing the
 * producer-driven direction of the work. Because the same value is also a `Sink`, another `Fx` can
 * publish into it with `run` while any number of consumers subscribe through the ordinary `Fx`
 * surface.
 *
 * ## Publication order
 *
 * Publications are serialized in FIFO order, including publications made concurrently or from
 * inside a subscriber callback. The subscriber set is snapshotted once per publication: a
 * subscriber removed during a delivery receives no later publication, and a subscriber added
 * during a delivery begins with the next publication. A failure publication uses the error channel
 * but does not permanently terminate the subject. A reentrant `onSuccess` or `onFailure` call from
 * the fiber currently draining subscribers enqueues its publication and returns before that queued
 * publication is delivered; the outer drain still delivers it in FIFO order.
 *
 * ## Ownership and lifetime
 *
 * Each call to `run` registers its sink in the caller's `Scope`; closing that scope removes only
 * that subscription. `interrupt` closes all current subscriber scopes and clears retained replay
 * state. A subject created by `make` is interrupted automatically when its owning scope closes;
 * `unsafeMake` leaves that responsibility with the caller.
 *
 * @example
 * ```ts
 * import { Effect, Fiber } from "effect"
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const program = Effect.gen(function* () {
 *   const events = yield* Subject.make<string>(2)
 *   const collected = yield* Effect.forkScoped(Fx.collectAll(Fx.take(events, 2)))
 *
 *   yield* events.onSuccess("connected")
 *   yield* events.onSuccess("ready")
 *
 *   return yield* Fiber.join(collected)
 * }).pipe(Effect.scoped)
 * ```
 *
 * @since 1.0.0
 * @category Publication contracts
 */
export interface Subject<A, E = never, R = never>
  extends Fx.Fx<A, E, R | Scope.Scope>, Sink.Sink<A, E, R> {
  /**
   * Samples the number of sinks currently registered with this subject.
   *
   * @remarks
   * ## Why
   *
   * Exposes demand for diagnostics and demand-sensitive coordination without coupling producers to
   * the subject implementation.
   *
   * ## Ownership and lifetime
   *
   * The returned `Effect` does not subscribe or retain anything. It reads the count when executed
   * and requires the same services `R` as the subject implementation.
   *
   * @since 1.0.0
   * @category utilities
   */
  readonly subscriberCount: Effect.Effect<number, never, R>;
  /**
   * Interrupts every current subscription and clears any retained replay values.
   *
   * @remarks
   * ## Why
   *
   * Gives the subject owner one deterministic shutdown operation for all active consumers and
   * retained publications.
   *
   * ## Ownership and lifetime
   *
   * Closing subscriber scopes runs their finalizers. The effect cannot fail, and the subject may be
   * subscribed to and published through again after the interruption.
   *
   * @since 1.0.0
   * @category utilities
   */
  readonly interrupt: Effect.Effect<void, never, R>;
}

export declare namespace Subject {
  /**
   * The service-shaped form of a `Subject` created by `Subject.Service`.
   *
   * @remarks
   * ## Why
   *
   * A service form lets producers and consumers refer to one shared subject through Effect's
   * context instead of passing the concrete instance through every call.
   *
   * ## Ownership and lifetime
   *
   * Static Subject operations require `Self` and delegate to the instance installed by `make`.
   * The layer owns that instance in a `Scope` and interrupts it when the layer is released.
   *
   * @example
   * ```ts
   * import * as Subject from "@typed/fx/Subject"
   *
   * class Events extends Subject.Service<Events, string>()("Events") {}
   * const EventsLive = Events.make()
   * ```
   *
   * @since 1.0.0
   * @category Subject services
   */
  export interface Service<Self, Id extends string, A, E> extends Subject<A, E, Self> {
    /**
     * The literal context identifier supplied to `Subject.Service`.
     *
     * @remarks
     * ## Why
     *
     * Preserves the service's stable identity for diagnostics and layer composition.
     *
     * ## Ownership and lifetime
     *
     * This string literal acquires and retains no resources.
     *
     * @since 1.0.0
     * @category identifiers
     */
    readonly id: Id;
    /**
     * The Effect context service used to retrieve the live subject instance.
     *
     * @remarks
     * ## Why
     *
     * Provides the standard Effect service lookup used by every static Subject operation.
     *
     * ## Ownership and lifetime
     *
     * The tag acquires nothing; the layer installed for it owns the concrete subject.
     *
     * @since 1.0.0
     * @category context
     */
    readonly service: Context.Service<Self, Subject<A, E>>;
    /**
     * Builds a scoped layer containing one subject with the requested replay capacity.
     *
     * @remarks
     * ## Why
     *
     * Packages one shared subject as a normal Effect layer for dependency composition.
     *
     * ## Ownership and lifetime
     *
     * Invalid capacities fail layer construction with `Cause.IllegalArgumentError`. The layer's
     * scope owns the subject and interrupts its subscribers and clears its replay buffer on release.
     *
     * @example
     * ```ts
     * import * as Subject from "@typed/fx/Subject"
     *
     * class Events extends Subject.Service<Events, string>()("Events") {}
     * const EventsLive = Events.make(1)
     * ```
     *
     * @since 1.0.0
     * @category layers
     */
    readonly make: (replay?: number) => Layer.Layer<Self, Cause.IllegalArgumentError, Scope.Scope>;
  }

  /**
   * A constructible service facade whose static side is also the contextual `Subject`.
   *
   * @remarks
   * ## Why
   *
   * Supports the class-based Effect service declaration pattern without creating a second runtime
   * object distinct from the static Subject facade.
   *
   * ## Ownership and lifetime
   *
   * Constructing the class returns its service facade; it does not allocate a subject. Use the
   * static `make` layer to allocate and scope the backing instance.
   *
   * @since 1.0.0
   * @category Subject services
   */
  export interface Class<Self, Id extends string, A, E> extends Service<Self, Id, A, E> {
    /**
     * Returns the contextual service facade without allocating a subject.
     *
     * @remarks
     * ## Why
     *
     * Enables `class Events extends Subject.Service<...>()("Events") {}` while retaining the
     * facade's static `Fx`, `Sink`, and layer operations.
     *
     * ## Ownership and lifetime
     *
     * Construction acquires no resources; the static `make` layer owns the backing subject.
     *
     * @example
     * ```ts
     * import * as Subject from "@typed/fx/Subject"
     *
     * class Events extends Subject.Service<Events, string>()("Events") {}
     * const facade = new Events()
     * ```
     *
     * @since 1.0.0
     * @category constructors
     */
    new (): Service<Self, Id, A, E>;
  }
}

/**
 * Shares one active execution of an `Fx` among subscribers through the supplied `Subject`.
 *
 * @remarks
 * ## Why
 *
 * Use `share` when the caller must choose the multicast boundary—for example, a replaying subject,
 * a renderer-independent state object, or a service-backed subject—while ensuring that simultaneous
 * consumers do not duplicate the source's effects.
 *
 * ## Subscription and publication
 *
 * A subscriber is registered with the subject before the source starts, so the first subscriber
 * observes synchronous first values and failures. The first active subscriber starts the source;
 * later subscribers join that execution. When the last subscriber leaves, the source fiber is
 * interrupted. A later subscriber starts a fresh session.
 *
 * ## Errors, services, and interruption
 *
 * Source successes and failures are pushed unchanged through the subject. The returned `Fx`
 * requires the union of source services and subject services.
 *
 * ## Ownership and lifetime
 *
 * `Scope` owns each individual subscription. The shared source is finalized exactly once when the
 * active session ends or the source itself exits. `share` takes session ownership of the supplied
 * subject: source exit calls its `interrupt`, closing all of that subject's subscribers and clearing
 * retained state. Do not concurrently reuse the same subject for an independently owned producer
 * or subscriber population.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const backing = Subject.unsafeMake<number>(1)
 * const request = Fx.fromEffect(Effect.succeed(42))
 * const shared = Subject.share(request, backing)
 * ```
 *
 * @param fx - The source Fx.
 * @param subject - The subject to use for multicasting.
 * @returns A shared `Fx`.
 * @since 1.0.0
 * @category Sharing sources
 */
export function share<A, E, R, R2>(
  fx: Fx.Fx<A, E, R>,
  subject: Subject<A, E, R2>,
): Fx.Fx<A, E, R | R2 | Scope.Scope> {
  return new Share(fx, subject);
}

class RefCounter {
  _RefCount: MutableRef.MutableRef<number> = MutableRef.make(0);

  increment() {
    return MutableRef.updateAndGet(this._RefCount, (n) => n + 1);
  }

  decrement() {
    return MutableRef.updateAndGet(this._RefCount, (n) => Math.max(0, n - 1));
  }
}

const VARIANCE: Fx.Fx.Variance<any, any, any> = {
  _A: identity,
  _E: identity,
  _R: identity,
};

const MAX_REPLAY_CAPACITY = 0xffff_ffff;
const INVALID_REPLAY_CAPACITY_MESSAGE =
  "Replay capacity must be an integer from 0 through 4294967295";

const isReplayCapacity = (capacity: number): boolean =>
  Number.isInteger(capacity) && capacity >= 0 && capacity <= MAX_REPLAY_CAPACITY;

const invalidReplayCapacity = (): Cause.IllegalArgumentError =>
  new Cause.IllegalArgumentError(INVALID_REPLAY_CAPACITY_MESSAGE);

/**
 * The concrete lazy `Fx` returned by `share`.
 *
 * @remarks
 * ## Why
 *
 * `Share` exposes the ref-counted sharing mechanism as an ordinary `Fx`: one source execution feeds
 * the selected subject while each caller has an independently scoped subscription to that subject.
 * Most callers should prefer `share`, `multicast`, `hold`, or `replay` for clearer intent.
 *
 * ## Ownership and lifetime
 *
 * Construction acquires nothing. The first executing `run` starts a detached source fiber; the
 * final executing `run` interrupts it. Source completion interrupts the subject's current
 * subscribers. Source, subject, and sink services are required only when `run` executes.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Share, unsafeMake } from "@typed/fx/Subject"
 *
 * const shared = new Share(Fx.succeed(1), unsafeMake<number>())
 * ```
 *
 * @since 1.0.0
 * @category Sharing sources
 */
export class Share<A, E, R, R2> implements Fx.Fx<A, E, R | R2 | Scope.Scope> {
  /**
   * Carries `Fx` variance information for the shared output, error, and service channels.
   *
   * @remarks
   * ## Why
   *
   * Lets generic `Fx` utilities recognize and infer a `Share` without inspecting its runtime fields.
   *
   * ## Ownership and lifetime
   *
   * The marker is immutable metadata and acquires no resources.
   *
   * @since 1.0.0
   * @category type-level
   */
  readonly [FxTypeId]: Fx.Fx.Variance<A, E, R | R2 | Scope.Scope> = VARIANCE;

  /**
   * Tracks the source fiber for the current active subscriber session.
   *
   * @remarks
   * ## Why
   *
   * Gives the final departing subscriber an exact fiber to interrupt without restarting or
   * duplicating the source.
   *
   * ## Ownership and lifetime
   *
   * The reference is empty before a session, set after the first subscriber starts the source, and
   * cleared before or when that session ends. It does not outlive the `Share` instance.
   *
   * @since 1.0.0
   * @category state
   */
  _FxFiber: MutableRef.MutableRef<Option.Option<Fiber.Fiber<unknown>>> = MutableRef.make(
    Option.none(),
  );
  /**
   * Tracks how many executing `run` effects participate in the active source session.
   *
   * @remarks
   * ## Why
   *
   * Implements the first-subscriber start and last-subscriber stop boundary.
   *
   * ## Ownership and lifetime
   *
   * The counter is owned by the `Share` instance and never falls below zero. Each executing `run`
   * increments once and decrements in its exit finalizer.
   *
   * @since 1.0.0
   * @category state
   */
  _RefCount = new RefCounter();

  /**
   * The source whose execution is shared.
   *
   * @remarks
   * ## Why
   *
   * Retains the original source so every active session can start exactly that `Fx`.
   *
   * ## Ownership and lifetime
   *
   * Holding the `Fx` value starts no work. Its `R` services and cleanup participate only while a
   * subscriber session is active.
   *
   * @since 1.0.0
   * @category inputs
   */
  readonly i0: Fx.Fx<A, E, R>;
  /**
   * The multicast subject receiving source publications.
   *
   * @remarks
   * ## Why
   *
   * Separates source sharing from retention and publication policy.
   *
   * ## Ownership and lifetime
   *
   * `Share` does not allocate this subject. It subscribes sinks to it and interrupts it when the
   * source session exits; the subject's `R2` services remain required by `run`.
   *
   * @since 1.0.0
   * @category inputs
   */
  readonly i1: Subject<A, E, R2>;

  /**
   * Creates the lazy shared `Fx`; source acquisition waits until the first call to `run` executes.
   *
   * @remarks
   * ## Why
   *
   * Keeps selection of the source and multicast policy separate from their execution.
   *
   * ## Ownership and lifetime
   *
   * The constructor only stores `i0` and `i1`; it starts no fiber and installs no finalizer.
   *
   * @example
   * ```ts
   * import { Fx } from "@typed/fx"
   * import { Share, unsafeMake } from "@typed/fx/Subject"
   *
   * const shared = new Share(Fx.succeed("ready"), unsafeMake<string>())
   * ```
   *
   * @since 1.0.0
   * @category constructors
   */
  constructor(i0: Fx.Fx<A, E, R>, i1: Subject<A, E, R2>) {
    this.i0 = i0;
    this.i1 = i1;
  }

  /**
   * Returns this value through the concrete class's zero-argument pipe entrypoint.
   *
   * @remarks
   * ## Why
   *
   * Supplies the runtime pipe hook required by `Fx`; the concrete `Share` declaration currently
   * publishes only its zero-argument signature, so typed combinator composition should target the
   * `Fx` returned by `share`, `multicast`, `hold`, or `replay`.
   *
   * ## Ownership and lifetime
   *
   * Calling `pipe` itself acquires no resources; only an executing downstream `run` starts work.
   *
   * @example
   * ```ts
   * import { Fx } from "@typed/fx"
   * import { Share, unsafeMake } from "@typed/fx/Subject"
   *
   * const shared = new Share(Fx.succeed(1), unsafeMake<number>())
   * const same = shared.pipe()
   * ```
   *
   * @since 1.0.0
   * @category utilities
   */
  pipe() {
    return pipeArguments(this, arguments);
  }

  /**
   * Registers `sink`, joins or starts the active source session, and remains active until the
   * subscription ends. Interruption removes this subscriber and stops the source if it was last.
   *
   * @remarks
   * ## Why
   *
   * Implements `Fx` consumption while coordinating one source execution across independent sinks.
   *
   * ## Ownership and lifetime
   *
   * The caller's `Scope` owns its subject subscription. Source `R`, subject `R2`, and sink `R3`
   * services are required during execution. Source failures are published to the sink rather than
   * failing this returned Effect, whose error channel is `never`.
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import { Fx } from "@typed/fx"
   * import * as Sink from "@typed/fx/Sink"
   * import { Share, unsafeMake } from "@typed/fx/Subject"
   *
   * const shared = new Share(Fx.succeed(1), unsafeMake<number>())
   * const run = shared.run(
   *   Sink.make(
   *     () => Effect.void,
   *     (value) => Effect.sync(() => console.log(value))
   *   )
   * )
   * ```
   *
   * @since 1.0.0
   * @category runners
   */
  run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<unknown, never, R | R2 | R3 | Scope.Scope> {
    return Effect.onExit(
      Effect.acquireUseRelease(
        Effect.forkScoped(this.i1.run(sink), { startImmediately: true }),
        (fiber) => Effect.andThen(this.initialize(), Fiber.join(fiber)),
        Fiber.interrupt,
      ),
      () => (this._RefCount.decrement() === 0 ? this.interrupt() : Effect.void),
    );
  }

  private initialize(): Effect.Effect<unknown, never, R | R2> {
    return Effect.suspend((): Effect.Effect<unknown, never, R | R2> => {
      if (this._RefCount.increment() === 1) {
        return this.i0.run(this.i1).pipe(
          Effect.ensuring(
            Effect.suspend(() => {
              MutableRef.set(this._FxFiber, Option.none());
              return this.i1.interrupt;
            }),
          ),
          Effect.interruptible,
          Effect.forkDetach,
          Effect.tap((fiber) =>
            Effect.sync(() => MutableRef.set(this._FxFiber, Option.some(fiber))),
          ),
        );
      } else {
        return Effect.void;
      }
    });
  }

  private interrupt(): Effect.Effect<void, never, R | R2> {
    return Option.match(MutableRef.getAndSet(this._FxFiber, Option.none()), {
      onNone: () => Effect.void,
      onSome: Fiber.interrupt,
    });
  }
}

/**
 * Multicasts an `Fx` without replaying values that arrived before a subscriber joined.
 *
 * @remarks
 * ## Why
 *
 * `multicast` is the zero-retention sharing policy: simultaneous subscribers share source work,
 * while consumers that arrive later receive only later publications.
 *
 * ## Ownership and lifetime
 *
 * The first subscriber starts one source execution and the last subscriber interrupts it. A later
 * subscriber starts a fresh execution. No replay buffer is retained. Source errors and services
 * are preserved, and `Scope` owns each subscription.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const sharedTicks = Subject.multicast(Fx.periodic("1 second"))
 * ```
 *
 * @param fx - The source Fx.
 * @returns A multicasted `Fx`.
 * @since 1.0.0
 * @category Sharing sources
 */
export function multicast<A, E, R>(fx: Fx.Fx<A, E, R>): Fx.Fx<A, E, R | Scope.Scope> {
  return new Share(fx, unsafeMake<A, E>(0));
}

/**
 * Shares an `Fx` and immediately replays its latest success or failure to each new subscriber.
 *
 * @remarks
 * ## Why
 *
 * `hold` gives late subscribers the current publication without restarting an already active
 * source, making it suitable for current-value streams and state-like projections.
 *
 * ## Ownership and lifetime
 *
 * One retained `Exit` belongs to the active shared subject. The first subscriber starts the source,
 * the last subscriber interrupts it, and interruption clears the retained exit. Source errors and
 * services remain visible in the returned `Fx`; subscription cleanup belongs to `Scope`.
 *
 * ## Join-during-publication behavior
 *
 * The latest `Exit` is retained before it enters the serialized publication queue. If a subscriber
 * joins while an earlier publication is still draining, it can receive that queued exit immediately
 * as replay and then receive it again when the queue reaches it. Consumers that require exactly-once
 * delivery across concurrent subscription and publication must coordinate that boundary externally.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const currentStatus = Subject.hold(Fx.succeed("ready"))
 * ```
 *
 * @param fx - The source Fx.
 * @returns A shared `Fx` that replays the latest value.
 * @since 1.0.0
 * @category Sharing sources
 */
export function hold<A, E, R>(fx: Fx.Fx<A, E, R>): Fx.Fx<A, E, R | Scope.Scope> {
  return new Share(fx, unsafeMake<A, E>(1));
}

/**
 * Shares an `Fx` and replays up to the last `capacity` successes or failures to new subscribers.
 *
 * @remarks
 * ## Why
 *
 * `replay` makes retention an explicit caller-selected policy rather than an implicit property of
 * every shared stream. Capacity `0` is equivalent to multicast retention; capacity `1` has hold
 * semantics; larger values replay the retained window from oldest to newest.
 *
 * ## Errors and interruption
 *
 * A non-integer, negative, or larger-than-32-bit capacity produces an `Fx` that fails with
 * `Cause.IllegalArgumentError` without starting the source. Valid buffers retain `Exit` values, so
 * typed failures keep their original causes and order. The last subscriber interrupts the source
 * and clears the buffer; source services remain in the return type.
 *
 * ## Ownership and lifetime
 *
 * `Scope` owns each subscription and the final subscriber owns shutdown of the active source
 * session. Buffer memory belongs to that session and is cleared when it is interrupted.
 *
 * ## Join-during-publication behavior
 *
 * Each `Exit` enters the replay buffer before it enters the serialized publication queue. A
 * subscriber joining while an earlier publication is still draining can replay a later queued exit
 * and then receive the same exit again when normal delivery reaches it. Replay guarantees retained
 * order, not exactly-once delivery across a concurrent subscribe/publish race.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const recent = Fx.fromIterable([1, 2, 3]).pipe(Subject.replay(2))
 * ```
 *
 * @param capacity - An integer from 0 through 4,294,967,295. The buffer can retain up to
 * `capacity` values, so callers own the memory policy for valid capacities. Invalid capacities
 * fail through the Fx error channel with `Cause.IllegalArgumentError`.
 * @param fx - The source Fx.
 * @returns A shared `Fx` that replays values.
 * @since 1.0.0
 * @category Sharing sources
 */
export const replay: {
  (
    capacity: number,
  ): <A, E, R>(fx: Fx.Fx<A, E, R>) => Fx.Fx<A, E | Cause.IllegalArgumentError, R | Scope.Scope>;
  <A, E, R>(
    fx: Fx.Fx<A, E, R>,
    capacity: number,
  ): Fx.Fx<A, E | Cause.IllegalArgumentError, R | Scope.Scope>;
} = dual(2, function replay<A, E, R>(fx: Fx.Fx<A, E, R>, capacity: number): Fx.Fx<
  A,
  E | Cause.IllegalArgumentError,
  R | Scope.Scope
> {
  if (!isReplayCapacity(capacity)) {
    return fail(invalidReplayCapacity());
  }
  return new Share(fx, unsafeMake<A, E>(capacity));
});

const DISCARD = { discard: true } as const;

interface Publication<A, E> {
  readonly exit: Exit.Exit<A, E>;
  readonly acknowledgement: Deferred.Deferred<void>;
}

/**
 * Implements a zero-replay subject with scoped subscribers and serialized publication delivery.
 *
 * @remarks
 * ## Why
 *
 * This is the queueing core behind public subjects. It snapshots subscribers per publication and
 * drains successes and failures in FIFO order without recursive stack growth.
 *
 * ## Publication and errors
 *
 * A non-reentrant publisher waits for its publication to finish delivery. A publisher called from
 * the active drain fiber enqueues and returns immediately so subscriber callbacks cannot deadlock;
 * the outer drain subsequently delivers that publication. Sink callback defects or interruption
 * are handled by the sink boundary and do not become a typed Subject failure.
 *
 * ## Ownership and lifetime
 *
 * Each `run` call creates a child scope for its sink and removes it on closure. `interrupt` closes
 * all current child scopes. The instance may accept later subscriptions and publications.
 *
 * This class remains marked `@internal` and is not a supported construction API even though the
 * current wildcard package export makes it import-reachable. Use `make` or `unsafeMake`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const supported = Effect.scoped(Subject.make<number>())
 * ```
 *
 * @since 1.0.0
 * @category internal
 * @internal
 */
export class SubjectImpl<A, E> implements Subject<A, E> {
  /**
   * Carries the `Fx` variance channels implemented by this subject.
   *
   * @remarks
   * ## Why
   *
   * Allows the implementation to satisfy the runtime `Fx` protocol.
   *
   * ## Ownership and lifetime
   *
   * Immutable metadata; it acquires no resources.
   *
   * @since 1.0.0
   * @category internal
   */
  readonly [FxTypeId]: Fx.Fx.Variance<A, E, Scope.Scope> = VARIANCE;
  protected sinks: Set<readonly [Sink.Sink<A, E, any>, Context.Context<any>, Scope.Closeable]> =
    new Set();
  private readonly publications: Array<Publication<A, E>> = [];
  private publicationIndex = 0;
  private activePublication: Publication<A, E> | undefined;
  private activeDrainFiberId: number | null = null;

  /**
   * Creates an empty zero-replay subject and binds its producer callbacks.
   *
   * @remarks
   * ## Why
   *
   * Initializes the internal queueing boundary without starting work.
   *
   * ## Ownership and lifetime
   *
   * Construction acquires no fibers or scopes; later `run` calls own subscriptions.
   *
   * @since 1.0.0
   * @category internal
   */
  constructor() {
    this.onFailure = this.onFailure.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
  }

  /**
   * Delegates to the Effect pipeable protocol.
   *
   * @remarks
   * ## Why
   *
   * Lets the implementation participate in ordinary `Fx` composition.
   *
   * ## Ownership and lifetime
   *
   * Piping starts no subscription; execution begins only when the resulting `Fx` is run.
   *
   * @since 1.0.0
   * @category internal
   */
  pipe() {
    return pipeArguments(this, arguments);
  }

  /**
   * Registers a sink until its child scope closes.
   *
   * @remarks
   * ## Why
   *
   * Implements the subscription side of the `Fx` contract.
   *
   * ## Ownership and lifetime
   *
   * The caller's `Scope` owns this subscription and its captured `R2` context. Publications deliver
   * `A` or `Cause<E>` to the sink; the returned Effect itself cannot fail.
   *
   * @since 1.0.0
   * @category internal
   */
  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R2 | Scope.Scope> {
    return this.addSink(sink, awaitScopeClose);
  }

  /**
   * Enqueues a failure publication for the current subscriber snapshot.
   *
   * @remarks
   * ## Why
   *
   * Preserves the complete Effect `Cause`, including defects and interruption, at the Sink boundary.
   *
   * ## Ownership and lifetime
   *
   * Non-reentrant callers wait for delivery; a call from the active drain fiber returns after
   * enqueueing. The publication is not retained for later subscribers.
   *
   * @since 1.0.0
   * @category internal
   */
  onFailure(cause: Cause.Cause<E>) {
    return this.onCause(cause);
  }

  /**
   * Enqueues a successful value for the current subscriber snapshot.
   *
   * @remarks
   * ## Why
   *
   * Provides the producer-facing push operation while preserving FIFO delivery.
   *
   * ## Ownership and lifetime
   *
   * Non-reentrant callers wait for delivery; a call from the active drain fiber returns after
   * enqueueing. The value is not retained for later subscribers.
   *
   * @since 1.0.0
   * @category internal
   */
  onSuccess(a: A) {
    return this.onEvent(a);
  }

  protected interruptScopes = Effect.withFiber((fiber) =>
    Effect.forEach(
      Array.from(this.sinks),
      ([, , scope]) => Scope.close(scope, Exit.interrupt(fiber.id)),
      DISCARD,
    ),
  );

  /**
   * Closes every currently registered subscriber scope.
   *
   * @remarks
   * ## Why
   *
   * Gives the owner one cleanup boundary for all active subscriptions.
   *
   * ## Ownership and lifetime
   *
   * Finalizers run for current subscribers; later subscriptions remain possible. This base class
   * retains no replay state.
   *
   * @since 1.0.0
   * @category internal
   */
  readonly interrupt = this.interruptScopes;

  protected addSink<R, B, R2>(
    sink: Sink.Sink<A, E, R>,
    f: (scope: Scope.Scope) => Effect.Effect<B, never, R2>,
  ): Effect.Effect<B, never, R2 | Scope.Scope> {
    return withExtendedScope(
      (innerScope) =>
        Effect.contextWith((ctx) => {
          const entry = [sink, ctx, innerScope] as const;
          this.sinks.add(entry);
          const remove = Effect.sync(() => this.sinks.delete(entry));

          return Effect.flatMap(Scope.addFinalizer(innerScope, remove), () => f(innerScope));
        }),
      "sequential",
    );
  }

  /**
   * Samples the number of currently registered sinks without subscribing.
   *
   * @remarks
   * ## Why
   *
   * Exposes current demand for diagnostics and coordination.
   *
   * ## Ownership and lifetime
   *
   * The Effect reads the owned sink set when executed and retains no additional state.
   *
   * @since 1.0.0
   * @category internal
   */
  readonly subscriberCount: Effect.Effect<number> = Effect.sync(() => this.sinks.size);

  protected onEvent(a: A): Effect.Effect<void, never, never> {
    return this.enqueue(Exit.succeed(a));
  }

  protected onCause(cause: Cause.Cause<E>) {
    return this.enqueue(Exit.failCause(cause));
  }

  private enqueue(exit: Exit.Exit<A, E>): Effect.Effect<void, never, never> {
    return Effect.withFiber((fiber) =>
      Effect.suspend(() => {
        const publication: Publication<A, E> = {
          exit,
          acknowledgement: Deferred.makeUnsafe(),
        };
        this.publications.push(publication);

        if (this.activeDrainFiberId === fiber.id) {
          return Effect.void;
        } else if (this.activeDrainFiberId !== null) {
          return Deferred.await(publication.acknowledgement);
        }

        const ownerFiberId = fiber.id;
        this.activeDrainFiberId = ownerFiberId;
        return Effect.onExit(this.drain(ownerFiberId), (exit) =>
          this.clearDrain(ownerFiberId, exit),
        );
      }),
    );
  }

  private drain(ownerFiberId: number): Effect.Effect<void, never, never> {
    return Effect.suspend(() => {
      const publication = this.publications[this.publicationIndex++];
      if (publication === undefined) {
        this.publications.length = 0;
        this.publicationIndex = 0;
        if (this.activeDrainFiberId === ownerFiberId) {
          this.activeDrainFiberId = null;
        }
        return Effect.void;
      }

      this.activePublication = publication;
      const sinks = Array.from(this.sinks);
      const deliver = Exit.match(publication.exit, {
        onFailure: (cause) =>
          Effect.forEach(
            sinks,
            ([sink, ctx, scope]) => runSinkCause(sink, ctx, scope, cause),
            DISCARD,
          ),
        onSuccess: (value) =>
          Effect.forEach(sinks, ([sink, ctx]) => runSinkEvent(sink, ctx, value), DISCARD),
      });

      return Effect.andThen(
        deliver,
        Effect.sync(() => {
          Deferred.doneUnsafe(publication.acknowledgement, Effect.void);
          this.activePublication = undefined;
        }).pipe(Effect.andThen(() => this.drain(ownerFiberId))),
      );
    });
  }

  private clearDrain(ownerFiberId: number, exit: Exit.Exit<void, never>) {
    return Effect.sync(() => {
      if (Exit.isSuccess(exit) || this.activeDrainFiberId !== ownerFiberId) {
        return;
      }

      const completion = Exit.asVoid(exit);
      if (this.activePublication !== undefined) {
        Deferred.doneUnsafe(this.activePublication.acknowledgement, completion);
      }
      for (let i = this.publicationIndex; i < this.publications.length; i++) {
        Deferred.doneUnsafe(this.publications[i]!.acknowledgement, completion);
      }

      this.publications.length = 0;
      this.publicationIndex = 0;
      this.activePublication = undefined;
      this.activeDrainFiberId = null;
    });
  }
}

function runSinkEvent<A, E>(
  sink: Sink.Sink<A, E, any>,
  ctx: Context.Context<any>,
  a: A,
): Effect.Effect<void, never, never> {
  return Effect.provide(Effect.catchCause(sink.onSuccess(a), sink.onFailure), ctx);
}

function runSinkCause<A, E>(
  sink: Sink.Sink<A, E, any>,
  ctx: Context.Context<any>,
  scope: Scope.Closeable,
  cause: Cause.Cause<E>,
): Effect.Effect<void, never, never> {
  return Effect.provide(
    Effect.catchCause(sink.onFailure(cause), (error) => Scope.close(scope, Exit.failCause(error))),
    ctx,
  );
}

/**
 * Internal one-exit replay implementation used for public hold semantics.
 *
 * @remarks
 * ## Why
 *
 * Extends the serialized Subject core with a current `Exit`, allowing a new subscriber to observe
 * the latest success or failure immediately.
 *
 * ## Join-during-publication behavior
 *
 * The current exit is updated before queue delivery. A subscriber joining while another
 * publication drains can replay a later queued exit and receive it again when the queue reaches it.
 *
 * ## Ownership and lifetime
 *
 * The instance owns one retained exit. `interrupt` closes subscribers and clears it. This class is
 * import-reachable under the current wildcard export but remains `@internal`; use `hold`, `make(1)`,
 * or `unsafeMake(1)`.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const supported = Subject.hold(Fx.succeed("ready"))
 * ```
 *
 * @since 1.0.0
 * @category internal
 * @internal
 */
export class HoldSubjectImpl<A, E> extends SubjectImpl<A, E> implements Subject<A, E> {
  /**
   * Stores the most recently published success or failure.
   *
   * @remarks
   * ## Why
   *
   * Supplies the immediate current-state replay used when a sink subscribes.
   *
   * ## Ownership and lifetime
   *
   * Updated before enqueueing each publication and cleared by `interrupt`; it retains at most one
   * `Exit<A, E>`.
   *
   * @since 1.0.0
   * @category internal
   */
  readonly lastValue: MutableRef.MutableRef<Option.Option<Exit.Exit<A, E>>> = MutableRef.make(
    Option.none(),
  );

  /**
   * Retains a success, then enqueues it for serialized delivery.
   *
   * @remarks
   * ## Why
   *
   * Makes the latest value immediately visible to subscribers without bypassing FIFO live delivery.
   *
   * ## Ownership and lifetime
   *
   * The retained value remains until replaced or interrupted. A reentrant call returns after
   * enqueueing; a joining subscriber can therefore observe the queued value twice.
   *
   * @since 1.0.0
   * @category internal
   */
  override onSuccess = (a: A): Effect.Effect<void, never, never> =>
    Effect.suspend(() => {
      // Keep track of the last value emitted by the subject
      MutableRef.set(this.lastValue, Option.some(Exit.succeed(a)));

      return this.onEvent(a);
    });

  /**
   * Retains a failure cause, then enqueues it for serialized delivery.
   *
   * @remarks
   * ## Why
   *
   * Gives late subscribers the same current failure, preserving its complete `Cause`.
   *
   * ## Ownership and lifetime
   *
   * The retained failure remains until replaced or interrupted. A joining subscriber can replay a
   * queued cause and receive it again from the live drain.
   *
   * @since 1.0.0
   * @category internal
   */
  override onFailure = (cause: Cause.Cause<E>): Effect.Effect<void, never, never> => {
    return Effect.suspend(() => {
      // Keep track of the last value emitted by the subject
      MutableRef.set(this.lastValue, Option.some(Exit.failCause(cause)));

      return this.onCause(cause);
    });
  };

  /**
   * Registers a sink, delivers the retained exit if present, then awaits scope closure.
   *
   * @remarks
   * ## Why
   *
   * Combines a current-state read with the live Subject subscription.
   *
   * ## Ownership and lifetime
   *
   * The caller's `Scope` owns registration and captured `R2` services. Replay occurs before waiting
   * for later publications; concurrent queued publication can duplicate that replay as described on
   * the class.
   *
   * @since 1.0.0
   * @category internal
   */
  override run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R2 | Scope.Scope> {
    return this.addSink(sink, (scope) =>
      Option.match(MutableRef.get(this.lastValue), {
        onNone: () => awaitScopeClose(scope),
        // If we have a previous value, emit it first
        onSome: (exit) => Effect.flatMap(Exit.match(exit, sink), () => awaitScopeClose(scope)),
      }),
    );
  }

  /**
   * Closes current subscribers and clears the retained exit.
   *
   * @remarks
   * ## Why
   *
   * Couples subscription cleanup with current-state cleanup.
   *
   * ## Ownership and lifetime
   *
   * Later subscriptions remain possible but have no replay until another publication arrives.
   *
   * @since 1.0.0
   * @category internal
   */
  override readonly interrupt = Effect.tap(
    this.interruptScopes,
    Effect.sync(() => MutableRef.set(this.lastValue, Option.none())),
  );
}

/**
 * Internal bounded replay implementation used for public replay semantics.
 *
 * @remarks
 * ## Why
 *
 * Extends the serialized Subject core with an explicit-capacity FIFO window of successful and
 * failed publications.
 *
 * ## Join-during-publication behavior
 *
 * Each exit enters the ring buffer before queue delivery. A subscriber joining while another
 * publication drains can replay a later queued exit and receive it again when the queue reaches it.
 *
 * ## Ownership and lifetime
 *
 * The instance owns the supplied ring buffer. `interrupt` closes subscribers and clears the buffer.
 * This class is import-reachable under the current wildcard export but remains `@internal`; use
 * `replay`, `make`, or `unsafeMake`.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const supported = Fx.fromIterable([1, 2, 3]).pipe(Subject.replay(2))
 * ```
 *
 * @since 1.0.0
 * @category internal
 * @internal
 */
export class ReplaySubjectImpl<A, E> extends SubjectImpl<A, E> {
  /**
   * Stores the bounded FIFO window of retained successes and failures.
   *
   * @remarks
   * ## Why
   *
   * Makes replay capacity and eviction explicit in the implementation.
   *
   * ## Ownership and lifetime
   *
   * Owned by this subject, filled before live queue delivery, and emptied by `interrupt`.
   *
   * @since 1.0.0
   * @category internal
   */
  readonly buffer: RingBuffer<Exit.Exit<A, E>>;

  /**
   * Creates a replay subject around an already allocated ring buffer.
   *
   * @remarks
   * ## Why
   *
   * Keeps capacity validation and allocation in the public factories while this class owns replay.
   *
   * ## Ownership and lifetime
   *
   * Construction starts no fibers. The instance retains and later clears the supplied buffer.
   *
   * @since 1.0.0
   * @category internal
   */
  constructor(buffer: RingBuffer<Exit.Exit<A, E>>) {
    super();
    this.buffer = buffer;
  }

  /**
   * Appends a success to the ring buffer, then enqueues it for live delivery.
   *
   * @remarks
   * ## Why
   *
   * Preserves one order for retained and live values while bounding memory by capacity.
   *
   * ## Ownership and lifetime
   *
   * The buffer evicts its oldest exit when full. A joining subscriber can replay this queued value
   * and receive it again from the live drain.
   *
   * @since 1.0.0
   * @category internal
   */
  override onSuccess = (a: A): Effect.Effect<void, never, never> =>
    Effect.suspend(() => {
      // Keep track of the last value emitted by the subject
      this.buffer.push(Exit.succeed(a));
      return this.onEvent(a);
    });

  /**
   * Appends a failure cause to the ring buffer, then enqueues it for live delivery.
   *
   * @remarks
   * ## Why
   *
   * Replays failures in causal order without reducing them to typed error values.
   *
   * ## Ownership and lifetime
   *
   * The complete `Cause` remains retained until eviction or interruption. A joining subscriber can
   * replay the queued cause and receive it again from the live drain.
   *
   * @since 1.0.0
   * @category internal
   */
  override onFailure = (cause: Cause.Cause<E>): Effect.Effect<void, never, never> =>
    Effect.suspend(() => {
      this.buffer.push(Exit.failCause(cause));
      return this.onCause(cause);
    });

  /**
   * Registers a sink, replays the retained window oldest-to-newest, then awaits scope closure.
   *
   * @remarks
   * ## Why
   *
   * Gives late subscribers bounded history before they consume subsequent live publications.
   *
   * ## Ownership and lifetime
   *
   * The caller's `Scope` owns registration and captured `R2` services. Replay itself does not remove
   * entries. Concurrent queued publication can duplicate an exit as described on the class.
   *
   * @since 1.0.0
   * @category internal
   */
  override run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R2 | Scope.Scope> {
    return this.addSink(sink, (scope) =>
      Effect.flatMap(this.buffer.forEach(Exit.match(sink)), () => awaitScopeClose(scope)),
    );
  }

  /**
   * Closes current subscribers and empties the replay buffer.
   *
   * @remarks
   * ## Why
   *
   * Releases both subscriber lifetimes and caller-selected retained memory at one boundary.
   *
   * ## Ownership and lifetime
   *
   * Later subscriptions remain possible but have no history until new publications arrive.
   *
   * @since 1.0.0
   * @category internal
   */
  override readonly interrupt = Effect.tap(
    this.interruptScopes,
    Effect.sync(() => this.buffer.clear()),
  );
}

/**
 * Immediately allocates a `Subject` with the requested replay capacity and manual ownership.
 *
 * @remarks
 * ## Why
 *
 * `unsafeMake` is the escape hatch for owners that cannot acquire through an Effect `Scope`, such
 * as a long-lived host object with its own explicit teardown. Prefer `make` inside Effect programs.
 *
 * ## Ownership and lifetime
 *
 * Allocation is synchronous and starts no fibers. The caller must execute `interrupt` to close
 * subscribers and clear retained `Exit` values. Capacity `0` retains nothing, capacity `1` retains
 * the latest publication, and larger capacities retain the newest window in FIFO replay order.
 *
 * ## Errors
 *
 * Invalid capacities throw `Cause.IllegalArgumentError` synchronously; this function has no typed
 * Effect error channel. Publishing and subscribing use the `E` and service channels of the returned
 * subject.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const events = Subject.unsafeMake<string>(10)
 *
 * const shutdown = events.interrupt
 * const publish = events.onSuccess("ready").pipe(Effect.asVoid)
 * ```
 *
 * @param replay - An integer from 0 through 4,294,967,295. The buffer can retain up to
 * `replay` values, so callers own the memory policy for valid capacities.
 * @returns A `Subject` that replays the last `replay` values.
 * @since 1.0.0
 * @category Subject construction
 */
export function unsafeMake<A, E = never>(replay: number = 0): Subject<A, E> {
  if (!isReplayCapacity(replay)) {
    throw invalidReplayCapacity();
  }

  if (replay === 0) {
    return new SubjectImpl<A, E>();
  } else if (replay === 1) {
    return new HoldSubjectImpl<A, E>();
  } else {
    return new ReplaySubjectImpl<A, E>(new RingBuffer(replay));
  }
}

/**
 * Acquires a `Subject` whose subscribers and replay state are released with the current `Scope`.
 *
 * @remarks
 * ## Why
 *
 * `make` places the imperative subject boundary under Effect's structured resource ownership, so
 * cancellation and scope closure cannot leave subscriptions or retained values behind.
 *
 * ## Ownership and lifetime
 *
 * The effect allocates when executed, not when described. Its required `Scope` installs a finalizer
 * that runs `interrupt`, closing all subscriber scopes and clearing the replay buffer. Individual
 * subscriber scopes may still end earlier without affecting other subscribers.
 *
 * ## Errors
 *
 * Invalid capacities fail in the typed error channel with `Cause.IllegalArgumentError`; no subject
 * is allocated. Once acquired, publication callbacks have no typed failure result; the subject's
 * `E` parameter describes incoming Causes rather than publication acknowledgment errors.
 * Interruption and defects remain distinct from that typed channel.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as Subject from "@typed/fx/Subject"
 *
 * const program = Effect.gen(function* () {
 *   const messages = yield* Subject.make<string>(1)
 *   yield* messages.onSuccess("online")
 *   return yield* messages.subscriberCount
 * }).pipe(Effect.scoped)
 * ```
 *
 * @since 1.0.0
 * @category Subject construction
 */
export function make<A, E = never>(
  replay?: number,
): Effect.Effect<Subject<A, E>, Cause.IllegalArgumentError, Scope.Scope> {
  const capacity = replay ?? 0;
  if (!isReplayCapacity(capacity)) {
    return Effect.fail(invalidReplayCapacity());
  }
  return Effect.acquireRelease(
    Effect.sync(() => unsafeMake(capacity)),
    (subject) => subject.interrupt,
  );
}

/**
 * Defines an Effect context service that is simultaneously a `Subject`, `Fx`, and `Sink` facade.
 *
 * @remarks
 * ## Why
 *
 * A named subject often represents an application-wide event boundary. `Service` keeps that
 * boundary type-safe and lets producers, consumers, and layers compose through Effect's normal
 * service channel instead of a module-global mutable instance.
 *
 * ## Ownership and lifetime
 *
 * Defining the class acquires nothing. Calling its static `make` creates a layer backed by scoped
 * `Subject.make`; releasing the layer interrupts subscriptions and clears replay. Static `Fx` and
 * `Sink` operations require `Self`, then delegate to the installed subject. Invalid replay
 * capacities fail layer construction with `Cause.IllegalArgumentError`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 * import * as Subject from "@typed/fx/Subject"
 *
 * class Notifications extends Subject.Service<Notifications, string>()("Notifications") {}
 *
 * const program = Effect.gen(function* () {
 *   yield* Notifications.onSuccess("saved")
 *   return yield* Fx.first(Notifications)
 * }).pipe(Effect.provide(Notifications.make(1)), Effect.scoped)
 * ```
 *
 * @since 1.0.0
 * @category Subject services
 */
export function Service<Self, A, E = never>() {
  return <const Id extends string>(id: Id): Subject.Class<Self, Id, A, E> => {
    const service = Context.Service<Self, Subject<A, E>>(id);

    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    return class SubjectService {
      static readonly id = id;
      static readonly service = service;

      static {
        // @effect-diagnostics-next-line floatingEffect:off
        Object.assign(this, service);
        Object.assign(this.prototype, Object.getPrototypeOf(service));
      }

      static readonly make = (
        replay?: number,
      ): Layer.Layer<Self, Cause.IllegalArgumentError, Scope.Scope> =>
        Layer.effect(service, make<A, E>(replay));

      static readonly [FxTypeId] = VARIANCE;
      static readonly pipe = function (this: any) {
        return pipeArguments(this, arguments);
      };

      // Fx
      static readonly run = <RSink>(sink: Sink.Sink<A, E, RSink>) =>
        Effect.flatMap(service, (subject) => subject.run(sink));

      // Sink
      static readonly onSuccess = (value: A) =>
        Effect.flatMap(service, (subject) => subject.onSuccess(value));
      static readonly onFailure = (cause: Cause.Cause<E>) =>
        Effect.flatMap(service, (subject) => subject.onFailure(cause));

      // Subject
      static readonly subscriberCount = Effect.flatMap(
        service,
        (subject) => subject.subscriberCount,
      );
      static readonly interrupt = Effect.flatMap(service, (subject) => subject.interrupt);

      constructor() {
        return SubjectService;
      }
    } as unknown as Subject.Class<Self, Id, A, E>;
  };
}
