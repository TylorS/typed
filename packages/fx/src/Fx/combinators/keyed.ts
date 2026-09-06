import * as Cause from "effect/Cause";
import * as Clock from "effect/Clock";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import { dual, identity } from "effect/Function";
import * as Option from "effect/Option";
import { pipeArguments } from "effect/Pipeable";
import * as Scope from "effect/Scope";
import * as Context from "effect/Context";
import * as SynchronizedRef from "effect/SynchronizedRef";
import type * as TestClock from "effect/testing/TestClock";
import * as RefSubject from "../../RefSubject/RefSubject.js";
import * as Sink from "../../Sink/Sink.js";
import type { Fx } from "../Fx.js";
import type { Add, Moved, Remove, Update } from "../internal/diff.js";
import { diff } from "../internal/diff.js";
import { withScopedFork } from "../internal/scope.js";
import { FxTypeId } from "../TypeId.js";

/**
 * Configuration options for the `keyed` combinator.
 *
 * @remarks
 * ## Why
 *
 * The options put identity, per-identity work, and output coalescing beside one
 * another so callers can choose collection behavior without exposing the keyed
 * implementation's maps, child Scopes, or diff patches.
 *
 * ## Ownership and lifetime
 *
 * The options object acquires nothing. {@link keyed} invokes `onValue` once per
 * admitted key. Its run fiber belongs to the outer parent Scope; the per-key
 * child Scope is supplied to that Fx for resources it explicitly registers.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * interface Row { readonly id: string; readonly value: number }
 *
 * const options: Fx.KeyedOptions<Row, string, number, never, never> = {
 *   getKey: (row) => row.id,
 *   onValue: (row) => Fx.map(row, ({ value }) => value)
 * }
 * ```
 *
 * @since 1.0.0
 * @category Operator options
 */
export interface KeyedOptions<A, B, C, E2, R2> {
  /**
   * Extracts the stable identity of an element.
   *
   * @remarks
   * ## Why
   *
   * A key lets value updates and moves reuse one existing child rather than
   * interpreting array position as identity.
   *
   * ## Ownership and lifetime
   *
   * The function is called synchronously while processing a source array. It
   * acquires no resource; keys are retained only while their entries are live.
   *
   * @since 1.0.0
   * @category models
   */
  readonly getKey: (a: A) => B;
  /**
   * Creates the Fx for one key from its live value RefSubject and stable key.
   *
   * @remarks
   * ## Why
   *
   * Passing a `RefSubject` separates identity from the current value: later
   * values with the same key update the existing child instead of recreating it.
   *
   * ## Ownership and lifetime
   *
   * `keyed` calls this once when a key is added and forks its run fiber in the
   * outer parent Scope. It provides a per-key child `Scope` to the run, so
   * resources registered through that service close when the key is removed.
   * Closing the child Scope does not by itself interrupt an arbitrary returned
   * Fx run fiber; resourceful work must honor the supplied Scope. Failures and
   * services remain on the returned `keyed` Fx.
   *
   * @since 1.0.0
   * @category models
   */
  readonly onValue: (ref: RefSubject.RefSubject<A>, key: B) => Fx<C, E2, R2 | Scope.Scope>;
  /**
   * Delays and coalesces array emissions after keyed state changes.
   *
   * @remarks
   * ## Why
   *
   * Several child updates can describe one logical collection change. Debounce
   * replaces the pending array emission so consumers receive the latest coherent
   * ready prefix rather than every intermediate scheduling step.
   *
   * ## Ownership and lifetime
   *
   * The delay fiber belongs to the outer keyed `Scope`. A later change interrupts
   * and replaces it; outer completion waits for the final scheduled emission and
   * interruption discards it. Omission uses a one-millisecond delay.
   *
   * @since 1.0.0
   * @category models
   */
  readonly debounce?: Duration.Input;
}

/**
 * Efficiently transforms a list of values into a list of Fx streams, using keys to track identity.
 *
 * This is crucial for performance when rendering lists or managing collections of stateful entities.
 * When the input list changes:
 * - New keys cause `onValue` to be called.
 * - Existing keys have their `RefSubject` updated with the new value.
 * - Removed keys close the supplied child Scope and clean resources registered
 *   through it; the `onValue` run fiber remains owned by the outer parent Scope.
 *
 * @remarks
 * ## Why
 *
 * A stable key separates identity from position. Consumers can move or update
 * the exact result already associated with a value instead of recreating every
 * result when a collection changes. This is the state-preserving substrate used
 * by keyed template rendering, but the combinator itself is renderer-agnostic.
 *
 * ## Ownership and lifetime
 *
 * Each key receives its own `RefSubject` and child `Scope`. Reusing a key updates
 * that subject in place. Removing a key closes the child Scope and therefore the
 * resources registered through its supplied Scope service. The `onValue` run
 * fiber itself is forked in the outer parent Scope, so child-Scope closure does
 * not guarantee interruption of an arbitrary Fx that ignores Scope. Interrupting
 * the outer run closes the parent and remaining children. Source and `onValue`
 * failures, services, and Scope requirements remain visible in the return type.
 *
 * ## Ordering and failures
 *
 * Each source array produces a unique-key diff. Added keys start one child Fx;
 * reused keys update their existing RefSubject, including moves; removed keys
 * have their child Scope closed. A child may emit repeatedly, replacing only
 * that key's latest output. Arrays follow current source order and contain the
 * contiguous ready prefix: a later key is withheld until every earlier key has
 * emitted at least once. Debounce coalesces scheduled arrays, not child Fx
 * values. Duplicate keys fail with `Cause.IllegalArgumentError` rather than
 * sharing a child lifetime.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const rows = Fx.keyed(Fx.succeed([{ id: "a", value: 1 }]), {
 *   getKey: (row) => row.id,
 *   onValue: (row) => Fx.map(row, ({ value }) => value)
 * })
 * ```
 *
 * @param fx - An `Fx` emitting an array of values.
 * @param options - Configuration options.
 * @returns An `Fx` emitting an array of results.
 * @since 1.0.0
 * @category Keyed work
 */
export const keyed: {
  <A, B extends PropertyKey, C, E2, R2>(
    options: KeyedOptions<A, B, C, E2, R2>,
  ): <E, R>(
    fx: Fx<ReadonlyArray<A>, E, R>,
  ) => Fx<ReadonlyArray<C>, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;
  <A, E, R, B extends PropertyKey, C, E2, R2>(
    fx: Fx<ReadonlyArray<A>, E, R>,
    options: KeyedOptions<A, B, C, E2, R2>,
  ): Fx<ReadonlyArray<C>, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;
} = dual(2, function keyed<
  A,
  E,
  R,
  B extends PropertyKey,
  C,
  E2,
  R2,
>(fx: Fx<ReadonlyArray<A>, E, R>, options: KeyedOptions<A, B, C, E2, R2>): Fx<
  ReadonlyArray<C>,
  E | E2 | Cause.IllegalArgumentError,
  R | R2 | Scope.Scope
> {
  return new Keyed(fx, options);
});

type StateContext<A, C> = {
  entry: KeyedEntry<A, C>;
  output: C;
};

const StateContext = Context.Service<StateContext<any, any>>("@services/StateContext");

const VARIANCE: Fx.Variance<any, any, any> = {
  _A: identity,
  _E: identity,
  _R: identity,
};

class Keyed<A, E, R, B extends PropertyKey, C, E2, R2> implements Fx<
  ReadonlyArray<C>,
  E | E2 | Cause.IllegalArgumentError,
  R | R2 | Scope.Scope
> {
  readonly [FxTypeId]: Fx.Variance<
    ReadonlyArray<C>,
    E | E2 | Cause.IllegalArgumentError,
    R | R2 | Scope.Scope
  > = VARIANCE;
  readonly fx: Fx<ReadonlyArray<A>, E, R>;
  readonly options: KeyedOptions<A, B, C, E2, R2>;

  constructor(fx: Fx<ReadonlyArray<A>, E, R>, options: KeyedOptions<A, B, C, E2, R2>) {
    this.fx = fx;
    this.options = options;
  }

  run<R3>(sink: Sink.Sink<ReadonlyArray<C>, E | E2 | Cause.IllegalArgumentError, R3>) {
    return Effect.withFiber((fiber) => runKeyed(this.fx, this.options, sink, fiber.id));
  }

  pipe(this: Keyed<A, E, R, B, C, E2, R2>) {
    return pipeArguments(this, arguments);
  }
}

interface KeyedState<A, B extends PropertyKey, C> {
  readonly entries: Map<B, KeyedEntry<A, C>>;
  readonly indices: Map<number, B>;
  previousValues: ReadonlyArray<A>;
}

function emptyKeyedState<A, B extends PropertyKey, C>(): KeyedState<A, B, C> {
  return {
    entries: new Map(),
    indices: new Map(),
    previousValues: [],
  };
}

function runKeyed<A, E, R, B extends PropertyKey, C, E2, R2, R3>(
  fx: Fx<ReadonlyArray<A>, E, R>,
  options: KeyedOptions<A, B, C, E2, R2>,
  sink: Sink.Sink<ReadonlyArray<C>, E | E2 | Cause.IllegalArgumentError, R3>,
  id: number,
): Effect.Effect<unknown, never, Scope.Scope | R | R2 | R3> {
  return withDebounceFork((debounceFork, parentScope) => {
    const state = emptyKeyedState<A, B, C>();
    const emit = Effect.suspend(() => sink.onSuccess(getReadyIndices(state)));
    const scheduleNextEmit = debounceFork(emit);

    let first = true;
    let previousKeyMap: Map<PropertyKey, number> = new Map();

    return fx.run(
      Sink.make(
        sink.onFailure,
        Effect.fn(function* (values: ReadonlyArray<A>) {
          const previous = state.previousValues;
          const keyMap = getUniqueKeyMap(values, options.getKey);
          if (Cause.isIllegalArgumentError(keyMap)) {
            return yield* sink.onFailure(Cause.fail(keyMap));
          }

          let changed = first;
          first = false;

          for (const patch of diff<A, B>(previous, values, {
            getKey: options.getKey,
            previousKeyMap,
            keyMap,
          })) {
            if (patch._tag === "Remove") {
              changed = true;
              yield* removeValue(state, patch, state.entries.get(patch.key)!);
            } else if (patch._tag === "Add") {
              changed = true;
              yield* addValue({
                state,
                values,
                patch,
                id,
                parentScope,
                keyedOptions: options,
                sink,
                scheduleNextEmit,
              });
            } else {
              changed = true;
              yield* updateValue(state, values, patch);
            }
          }

          state.previousValues = Array.from(values);
          previousKeyMap = keyMap;

          if (changed) {
            yield* scheduleNextEmit;
          } else {
            yield* adjustTime();
          }
        }),
      ),
    );
  }, options.debounce || 1);
}

function getUniqueKeyMap<A>(
  values: ReadonlyArray<A>,
  getKey: (value: A) => PropertyKey,
): Map<PropertyKey, number> | Cause.IllegalArgumentError {
  const keyMap = new Map<PropertyKey, number>();

  for (let i = 0; i < values.length; ++i) {
    const key = getKey(values[i]);
    if (keyMap.has(key)) {
      return new Cause.IllegalArgumentError(`Duplicate keyed() key ${formatKeyedKey(key)}`);
    }
    keyMap.set(key, i);
  }

  return keyMap;
}

function formatKeyedKey(key: PropertyKey): string {
  return typeof key === "symbol" ? key.toString() : JSON.stringify(key);
}

class KeyedEntry<A, C> {
  public value: A;
  public index: number;
  public output: Option.Option<C>;
  public readonly ref: RefSubject.RefSubject<A>;
  public readonly interrupt: Effect.Effect<void>;

  constructor(
    value: A,
    index: number,
    output: Option.Option<C>,
    ref: RefSubject.RefSubject<A>,
    interrupt: Effect.Effect<void>,
  ) {
    this.value = value;
    this.index = index;
    this.output = output;
    this.ref = ref;
    this.interrupt = interrupt;
  }
}

function getReadyIndices<A, B extends PropertyKey, C>({
  entries,
  indices,
  previousValues,
}: KeyedState<A, B, C>): ReadonlyArray<C> {
  const output: Array<C> = [];

  for (let i = 0; i < previousValues.length; ++i) {
    const key = indices.get(i);

    if (key === undefined) break;

    const entry = entries.get(key)!;
    if (Option.isSome(entry.output)) {
      output.push(entry.output.value);
    } else {
      break;
    }
  }

  return output;
}

function* addValue<A, B extends PropertyKey, C, R2, E2, E, R3, D>(options: {
  state: KeyedState<A, B, C>;
  values: ReadonlyArray<A>;
  patch: Add<A, B>;
  id: number;
  parentScope: Scope.Scope;
  keyedOptions: KeyedOptions<A, B, C, E2, R2>;
  sink: Sink.Sink<ReadonlyArray<C>, E | E2 | Cause.IllegalArgumentError, R2 | R3>;
  scheduleNextEmit: Effect.Effect<D, never, R3>;
}) {
  const { id, keyedOptions, parentScope, patch, scheduleNextEmit, sink, state, values } = options;
  const { entries, indices } = state;
  const value = values[patch.index];
  const childScope = yield* Scope.fork(parentScope, "sequential");
  const ref = yield* RefSubject.make(Effect.sync<A>(() => entry.value)).pipe(
    Effect.provideService(Scope.Scope, childScope),
  );

  const entry: KeyedEntry<A, C> = new KeyedEntry<A, C>(
    value,
    patch.index,
    Option.none(),
    ref,
    Scope.close(childScope, Exit.interrupt(id)),
  );

  entries.set(patch.key, entry);
  indices.set(patch.index, patch.key);

  yield* Effect.forkIn(
    keyedOptions
      .onValue(ref, patch.key)
      .run(
        Sink.make(
          (cause) => sink.onFailure(cause),
          (output) => {
            entry.output = Option.some(output);

            return scheduleNextEmit;
          },
        ),
      )
      .pipe(Effect.provideService(Scope.Scope, childScope)),
    parentScope,
  );
}

function removeValue<A, B extends PropertyKey, C>(
  { entries, indices }: KeyedState<A, B, C>,
  patch: Remove<A, B>,
  entry: KeyedEntry<A, C>,
) {
  entries.delete(patch.key);
  indices.delete(patch.index);
  return entry.interrupt;
}

function updateValue<A, B extends PropertyKey, C>(
  { entries, indices }: KeyedState<A, B, C>,
  values: ReadonlyArray<A>,
  patch: Update<A, B> | Moved<A, B>,
) {
  const key = patch.key;
  const entry = entries.get(key)!;

  if (patch._tag === "Moved") {
    const currentKey = indices.get(patch.index);
    if (currentKey === key) {
      indices.delete(patch.index);
    }
    indices.set(patch.to, key);
    entry.value = values[(entry.index = patch.to)];
  } else {
    entry.value = values[(entry.index = patch.index)];
  }

  return RefSubject.set(entry.ref, entry.value);
}

function withDebounceFork<A, E, R>(
  f: (
    fork: <R>(effect: Effect.Effect<A, never, R>) => Effect.Effect<void, never, R>,
    scope: Scope.Scope,
  ) => Effect.Effect<A, E, R>,
  duration: Duration.Input,
): Effect.Effect<unknown, E, R | Scope.Scope> {
  return withScopedFork(
    (fork, scope) =>
      Effect.flatMap(SynchronizedRef.make(Option.none<Fiber.Fiber<unknown>>()), (ref) =>
        Effect.flatMap(
          f(
            (effect) =>
              SynchronizedRef.updateEffect(
                ref,
                Option.match({
                  onNone: () => Effect.asSome(fork(Effect.delay(effect, duration))),
                  onSome: (fiber) =>
                    Fiber.interrupt(fiber).pipe(
                      Effect.flatMap(() => fork(Effect.delay(effect, duration))),
                      Effect.asSome,
                    ),
                }),
              ),
            scope,
          ),
          () =>
            SynchronizedRef.updateEffect(
              ref,
              Option.match({
                onNone: () => Effect.succeedNone,
                onSome: (fiber) => Fiber.join(fiber).pipe(Effect.as(Option.none())),
              }),
            ),
        ),
      ),
    "sequential",
  );
}

function* adjustTime() {
  const services = yield* Effect.context<never>();
  const clock = Context.get(services, Clock.Clock) as Clock.Clock | TestClock.TestClock;
  if ("adjust" in clock) {
    yield* clock.adjust(Duration.millis(1));
  } else {
    yield* clock.sleep(Duration.millis(1));
  }
}
