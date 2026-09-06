# @typed/fx

> **Beta:** This package is in beta; APIs may change.

`@typed/fx` provides reactive streams and state for Effect: **Fx** (streams with rich combinators and run functions), **Push**, **RefSubject** (and typed refs like RefArray, RefBoolean), **Subject**, **Sink**, and **Versioned**. Use it for event streams, reactive UI state, and composing effects as streams.

## Dependencies

- `effect`

## API overview

- **Fx** — Stream type `Fx.Fx<A, E, R>` with constructors (`succeed`, `fail`, `fromEffect`, `fromIterable`, `make`, `periodic`, etc.), combinators (`map`, `flatMap`, `filter`, `take`, `switchMap`, etc.), and run (`runPromise`, `collectAll`, `fork`, `observe`).
- **Push** — Push-based stream abstraction.
- **RefSubject** — Mutable reactive refs; `RefSubject.make(initial)`; typed helpers like `RefSubject.increment` / `RefSubject.decrement` for numbers; `RefArray`, `RefBoolean`, `RefOption`, etc.
- **Subject** — Multicast subject for Fx streams.
- **Sink** — Consumer abstraction with combinators.
- **Versioned** — Versioned values.

## Example

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";

Fx.fromIterable([1, 2, 3]).pipe(
  Fx.filter((n) => n % 2 === 0),
  Fx.map((n) => n * 2),
  Fx.observe((n) => Effect.log(`emitted: ${n}`)),
  Effect.runPromise,
);
```

See the [counter example](https://github.com/TylorS/typed/tree/development/examples/counter) for a full runnable app.

## API reference

- [Fx](#fx)
- [Push](#push)
- [RefSubject](#refsubject)
- [Subject](#subject)
- [Sink](#sink)
- [Versioned](#versioned)

### Fx

Reactive stream type with concurrency, error handling, and context, integrated with Effect.

**Type**

- `Fx<A, E, R>` — Stream that emits `A`, can fail with `E`, requires context `R`; has `.run(sink)`.

**Type-level**

- `Fx.Success<T>`, `Fx.Error<T>`, `Fx.Services<T>` — Extract success, error, and context from an Fx type.
- `Fx.Any`, `Fx.Variance` — Wildcard and variance markers.
- `Fx.Service`, `Fx.Class` — Dependency-injection service/class for Fx.

**Constructors**

- `succeed(value)` — Emit a single value and complete.
- `succeedNull` / `null` — Emit `null` and complete.
- `succeedUndefined` / `undefined` — Emit `undefined` and complete.
- `succeedVoid` / `void` — Emit void and complete.
- `fail(error)` — Fail immediately with an error.
- `failCause(cause)` — Fail immediately with a Cause.
- `die(defect)` — Terminate with a defect.
- `interrupt(id?)` — Create an Fx that interrupts.
- `empty` — Emit nothing and complete immediately.
- `never` — Run forever without emitting.
- `fromEffect(effect)` — One-value Fx from an Effect (emit on success, fail on failure).
- `fromIterable(iterable)` — Emit each element of the iterable then complete.
- `fromSchedule(schedule)` — Emit `void` each time the schedule fires.
- `fromFailures(failures)` — Fx that fails with combined failures from an iterable.
- `make(run)` — Low-level: build Fx from a function that runs a Sink.
- `callback(run)` — Build Fx from a callback; receives `Emit` (succeed, failCause, fail, die, done).
- `at(value, delay)` — Emit one value after a delay.
- `periodic(period)` — Emit `void` on a fixed interval.
- `fn(body, ...pipeables)` — Effect.fn-style for Fx (body can return Fx); optional name/span.

**Combinators**

- `map(f)` — Transform emitted values.
- `mapEffect(f)` — Transform with an Effect.
- `mapError(f)` — Transform typed failures.
- `mapBoth({ onSuccess, onFailure })` — Transform both success values and typed failures.
- `flatMap(f)` — Map to inner Fx and merge (concurrent; like mergeMap).
- `flatMapEffect(f)` — Map to an Effect and merge its successful values.
- `flatMapConcurrently(f, concurrency)` — FlatMap with a positive safe-integer concurrency limit; invalid limits fail through the Fx error channel with `IllegalArgumentError`.
- `flatMapConcurrentlyEffect(f, concurrency)` — Map to Effects with the same validated concurrency contract.
- `switchMap(f)` — Map to inner Fx and switch to latest (cancels previous).
- `switchMapEffect(f)` — Map to an Effect and switch to the latest execution.
- `exhaustMap(f)` — Map to inner Fx, ignore new outer values while inner runs.
- `exhaustMapEffect(f)` — Map to an Effect, ignoring new values while it runs.
- `exhaustLatestMap(f)` — Like exhaustMap but cancel previous inner when new outer arrives.
- `exhaustLatestMapEffect(f)` — Effect-based exhaustLatestMap.
- `filter(f)` — Keep only values satisfying the predicate.
- `filterEffect(f)` — Filter with an Effect predicate.
- `filterMap(f)` — Filter and map to Option; compact.
- `filterMapEffect(f)` — FilterMap with Effect.
- `compact` — Filter out `None`, unwrap `Some`.
- `take(n)` — Take first n elements.
- `takeEffect(effect)` — Take first n elements, where n is computed by an Effect.
- `takeUntil(predicate)` — Take values until the predicate matches; the matching value is excluded.
- `takeUntilEffect(f)` — Take values until an effectful predicate matches; the matching value is excluded.
- `takeWhile(f)` — Take while predicate holds.
- `takeWhileEffect(f)` — Take while effectful predicate holds.
- `skip(n)` — Skip first n elements.
- `skipEffect(effect)` — Skip first n elements, where n is computed by an Effect.
- `skipWhile(f)` / `dropWhile(f)` — Skip while predicate holds.
- `skipWhileEffect(f)` / `dropWhileEffect(f)` — Skip while effectful predicate holds.
- `slice(options)` — Skip/take by bounds.
- `sliceEffect(effect)` — Skip/take by bounds produced by an Effect.
- `skipRepeats` — Drop consecutive duplicates (Equal).
- `skipRepeatsWith(equiv)` — Drop consecutive duplicates with custom equivalence.
- `changesWithEffect(f)` — Effectful consecutive deduplication predicate.
- `merge(fx)` — Merge with another Fx.
- `mergeAll(fxs)` — Merge multiple Fx streams.
- `mergeOrdered(fxs)` — Merge with ordering guarantees.
- `concat(fx)` — Concatenate with another Fx (run second after first completes).
- `zip(fx)` / `zipWith(fx, f)` — Zip streams in lockstep.
- `zipLatest(fx)` / `zipLatestWith(fx, f)` — Zip latest values after both emit once.
- `catch(f)` — Recover from errors.
- `catchIf(refinement, f)` — Recover conditionally from typed failures.
- `catchCauseIf(predicate, f)` — Recover conditionally from failure causes.
- `catchTags(handlers)` — Recover from multiple tagged failures with handler map.
- `onError(f)` — Run an effect on failure.
- `onExit(f)` — Run an effect on exit (success/failure/interrupt).
- `onInterrupt(f)` — Run an effect on interrupt.
- `ensuring(effect)` — Run effect when Fx ends (success, failure, or interrupt).
- `provide(layer)` — Provide services to the Fx from a Layer.
- `provideService(tag, service)` — Provide a single service to the Fx.
- `provideServiceEffect(tag, effect)` — Provide a service produced by an Effect.
- `if(condition, { onTrue, onFalse })` — Switch between two Fx streams based on a boolean Fx.
- `when(condition, { onTrue, onFalse })` — Map a boolean Fx to one of two values.
- `unwrap` — Unwrap Fx of Fx (flatten one level).
- `unwrapScoped` — Unwrap with Scope for inner Fx.
- `gen(f)` — Build Fx from a generator (yield Effects, return Fx).
- `genScoped(f)` — gen with Scope.
- `loop(initial, f)` — Loop with state and Option for continue/exit.
- `loopEffect(initial, f)` — Loop with Effect.
- `scan(initial, f)` — Emit running accumulation (includes initial value).
- `scanEffect(initial, f)` — Effectful running accumulation.
- `loopCause(initial, f)` — Loop with Cause handling.
- `loopCauseEffect(initial, f)` — Loop with Cause and Effect.
- `filterMapLoop(initial, f)` — Loop yielding Option.
- `filterMapLoopEffect(initial, f)` — filterMapLoop with Effect.
- `filterMapLoopCause(initial, f)` — filterMapLoop with Cause.
- `filterMapLoopCauseEffect(initial, f)` — filterMapLoop with Cause and Effect.
- `keyed({ getKey, onValue, debounce? })` — Track array elements by key and run an inner Fx per key.
- `tap(f)` — Run a function or Effect for each value, then pass the value through.
- `exit` — Turn Fx of Exit into Fx that fails/succeeds accordingly.
- `result` — Materialize successes/failures as `Result`.
- `causes` — Expose failures as Cause emissions.
- `continueWith(f)` — When Fx ends, continue with another Fx.
- `flip` — Swap success and error types.
- `tuple(...fxs)` — Combine Fx streams into tuple Fx.
- `withSpan(name, options?)` — Add tracing spans around the Fx and sink callbacks.

**Run**

- `runPromise(fx, options?)` — Run to completion; Promise rejects on failure.
- `runPromiseExit(fx, options?)` — Run to completion; Promise resolves to Exit.
- `collectAll(fx)` — Collect all emitted values into an array (Effect).
- `collectAllFork(fx)` — Fork collection of all values (returns Fiber of array).
- `collectUpTo(fx, n)` — Collect at most n values.
- `collectUpToFork(fx, n)` — Fork collectUpTo.
- `first(fx)` — Effect that yields first value as Option (None if empty).
- `fork(fx, options?)` — Run Fx in a background fiber; returns Effect of Fiber.
- `runFork(fx, options?)` — Run Fx in a new fiber via Effect.runFork.
- `observe(fx, f)` — Run callback for each value; returns Effect that completes when stream ends.
- `drain(fx)` — Run Fx, discard values (Effect completes when stream ends).
- `drainLayer(fx)` — Layer that forks and drains the Fx.
- `observeLayer(fx, f)` — Layer that observes the Fx with the given callback.

**Stream interop**

- `toStream(fx, options?)` — Convert Fx to Effect Stream.
- `fromStream(stream, options?)` — Convert Effect Stream to Fx.

---

### Push

Push-based abstraction that is both a Sink (input) and an Fx (output).

**Type**

- `Push<A, E, R, B, E2, R2>` — Consumes `A` (Sink) and produces `B` (Fx); input and output types are independent.

**Constructor**

- `Push.make(sink, fx)` — Create a Push from a Sink and an Fx (dual: can be called as `make(fx)(sink)`).

**Service**

- `Push.Service`, `Push.Class` — Dependency-injection for Push.

---

### RefSubject

Mutable reactive reference: observable state that can be read (as Effect), updated, and subscribed to (as Fx).

**Types**

- `RefSubject<A, E, R>` — Mutable ref; extends `Computed` and `Subject`; has `updates(transaction)` and `interrupt`.
- `Computed<A, E, R>` — Read-only derived value (Fx + Effect); emits and samples transformed value.
- `Filtered<A, E, R>` — Computed over Option; may not always have a value.
- `GetSetDelete<A, E, R>` — Interface with get/set/delete for use inside `updates`.

**Constructors**

- `make(initial, options?)` — Create RefSubject from value, Effect, or Fx; options include `eq` (equivalence).
- `hydrate(schema, initial, options?)` — Create a callable `HydratedRefSubject` that is both reactive state and its DOM hydration ref. A named hydration requires a string-encoded schema.
- `hydrateAll(first, ...rest)` — Compose hydrated states into one DOM ref invocation.
- `fromEffect(effect)` — RefSubject driven by an Effect (e.g. initial value from async source).
- `fromFx(fx)` — RefSubject that follows an Fx stream.
- `fromStream(stream)` — RefSubject from an Effect Stream.

**Core operations**

- `set(ref, value)` — Set current value.
- `reset(ref)` — Reset to initial (if any); returns previous value as Option.
- `update(ref, f)` — Update with a pure function.
- `updateEffect(ref, f)` — Update with an Effect.
- `modify(ref, f)` — Modify and return a result (pure).
- `modifyEffect(ref, f)` — Modify with an Effect.
- `runUpdates(ref, f)` — Run an effect that can read/update the ref (transactional).
- `increment(ref)` — Add 1 to a number RefSubject; returns new value.
- `decrement(ref)` — Subtract 1 from a number RefSubject; returns new value.
- `proxy(ref)` — Create a proxy RefSubject that forwards to the given ref.
- `isRefSubject(value)` — Type guard for RefSubject.

**Hydration**

```ts
const count = yield * RefSubject.hydrate(Schema.Number, 0);
const page = yield * RefSubject.hydrate(Schema.NumberFromString, 1, { name: "page" });

html`<section ref=${RefSubject.hydrateAll(count, page)}>${count}</section>`;
```

The returned state is directly callable as the specialized DOM ref; there is no separate hydration property. Unnamed states share a versioned `data-typed-refsubject` tuple that is consumed and removed without installing an ongoing subscription. A named state uses its string codec directly in `data-<name>`, retains that attribute, and keeps it synchronized with exactly one scope-owned subscription. Closing the scope stops named synchronization.

**Derived**

- `map(ref, f)` — Computed that applies f to the value.
- `mapEffect(ref, f)` — Computed with Effect transformation.
- `filterMap(ref, f)` — Filtered computed (Option).
- `filterMapEffect(ref, f)` — FilterMap with Effect.
- `compact(ref)` — Filtered that strips Option.
- `slice(ref, options)` — Slice over iterable-like ref.
- `transform(ref, transformFx, transformGet)` — General transform of a RefSubject/Versioned.
- `makeComputed(input, f)` — Build a Computed from a Versioned and an Effect function.
- `makeFiltered(input, f)` — Build a Filtered from a Versioned and an Effect returning Option.
- `struct(refs)` — Combine refs into a struct RefSubject.
- `tuple(refs)` — Combine refs into a tuple RefSubject.
- `computedFromService(service)`, `filteredFromService(service)` — Computed/Filtered from a service.

**Typed refs** (each has `make` and domain-specific helpers)

- `RefArray` — Array ref; e.g. prepend, append, insertAt, replaceAt, drop, and filterValues.
- `RefBoolean` — Boolean ref; e.g. toggle, setTrue, setFalse.
- `RefOption` — Option ref.
- `RefResult` — Result ref.
- `RefString` — String ref.
- `RefBigInt` — BigInt ref.
- `RefBigDecimal` — BigDecimal ref.
- `RefDuration` — Duration ref.
- `RefDateTime` — DateTime ref.
- `RefCause` — Cause ref.
- `RefChunk` — Chunk ref.
- `RefHashMap` — HashMap ref.
- `RefHashSet` — HashSet ref.
- `RefRecord` — Record ref.
- `RefStruct` — Struct ref.
- `RefTuple` — Tuple ref.
- `RefGraph` — Graph ref.
- `RefHashRing` — HashRing ref.
- `RefTrie` — Trie ref.
- `RefIterable` — Iterable ref.

---

### Subject

Multicast point: both an Fx and a Sink; multiple subscribers share one run of the source.

**Type**

- `Subject<A, E, R>` — Implements `Fx<A, E, R>` and `Sink<A, E, R>`; has `subscriberCount` (Effect) and `interrupt`.

**Constructors**

- `Subject.make(replay?)` — Create a subject; optional replay buffer size must be an integer from 0 through 4,294,967,295, otherwise the Effect fails with `IllegalArgumentError`.
- `Subject.unsafeMake(replay?)` — Create without Scope (unsafe for cleanup); replay capacity has the same bounds and throws `IllegalArgumentError` when invalid.

**Combinators**

- `Subject.share(fx, subject)` — Multicast Fx through a subject (one run, many subscribers).
- `Subject.multicast(fx)` — Share Fx with a fresh subject.
- `Subject.hold(fx)` — Fx that holds last value for late subscribers.
- `Subject.replay(fx, n)` — Replay the last `n` values to new subscribers. Invalid capacities fail through the Fx error channel with `IllegalArgumentError`; valid capacities retain storage under the caller's memory policy.

**Service**

- `Subject.Service`, `Subject.Class` — Dependency-injection for Subject.

---

### Sink

Consumer of values: two callbacks, one for success and one for failure.

**Type**

- `Sink<A, E, R>` — `{ onSuccess: (value: A) => Effect, onFailure: (cause: Cause<E>) => Effect }`.
- `Sink.WithEarlyExit<A, E, R>` — Adds `earlyExit` for early termination.
- `Sink.WithState<A, E, R, B>` — Sink with state Ref.
- `Sink.WithStateSemaphore<A, E, R, B>` — Sink with state and transactional updates.

**Constructor**

- `Sink.make(onFailure, onSuccess)` — Build a Sink from the two callbacks.

**Combinators**

- `map(sink, f)` — Transform values before they reach the sink.
- `filterMap(sink, f)` — Filter and map (Option).
- `compact(sink)` — Sink for Option, forward only Some.
- `filter(sink, f)` — Filter values.
- `withEarlyExit(sink, earlyExit)` — Add early-exit capability.
- `withState(sink, initial, f)` — Stateful sink.
- `withStateSemaphore(sink, initial, f)` — Stateful sink with semaphore for transactional updates.
- `loop(sink, initial, f)` — Loop over sink with state.
- `loopCause(sink, initial, f)` — Loop with Cause handling.
- `filterMapLoop(sink, initial, f)` — Loop with filterMap.
- `filterMapLoopCause(sink, initial, f)` — filterMapLoop with Cause.
- `loopEffect(sink, initial, f)` — Loop with Effect.
- `filterMapLoopEffect(sink, initial, f)` — filterMapLoop with Effect.
- `loopCauseEffect(sink, initial, f)` — loopCause with Effect.
- `filterMapLoopCauseEffect(sink, initial, f)` — Full variant with Cause and Effect.
- `slice(sink, options)` — Skip/take at the Sink level.
- `mapEffect(sink, f)` — Effectful map.
- `filterMapEffect(sink, f)` — Effectful filterMap.
- `filterEffect(sink, f)` — Effectful filter.
- `tapEffect(sink, f)` — Tap with Effect, pass value through.
- `flip(sink)` — Swap success and error types.
- `exit(sink)` — Sink for Exit (success/failure).
- `dropAfter(sink, predicate, run)` — Run with a derived sink that forwards through the first predicate match, then exits early.
- `skipInterrupt(sink)` — Ignore interrupt at the Sink.

**Service**

- `Sink.Service`, `Sink.Class` — Dependency-injection for Sink.

---

### Versioned

Value that changes over time with a version number; both an Fx (subscribe to changes) and an Effect (sample current value).

**Type**

- `Versioned<R1, E1, A2, E2, R2, A3, E3, R3>` — Fx emits `A2`; sampling yields `A3`; has `version` (Effect of number) and `interrupt`.

**Type-level**

- `Versioned.Unify<T>` — Unify a Versioned type.
- `Versioned.VersionContext<T>` — Context required to get version.
- `Versioned.VersionError<T>` — Error type of the version effect.

**Constructor**

- `Versioned.make(version, fx, effect)` — Build Versioned from version effect, update stream (Fx), and current-value effect.

**Combinators**

- `Versioned.transform(input, transformFx, transformGet)` — Transform the Fx and the sampling effect into a new Versioned.

**Service**

- `Versioned.Service`, `Versioned.Class` — Dependency-injection for Versioned.
