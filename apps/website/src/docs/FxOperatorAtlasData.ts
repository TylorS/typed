/** Explicit, source-audited scenarios. Every public runtime export has its own entry. */
import type {
  FxOperatorDiagram,
  FxNonTemporalExport,
} from "./FxOperatorAtlas.js";

export const fxOperatorDiagrams: ReadonlyArray<FxOperatorDiagram> = [
  {
    name: "append",
    guide: "composing-fx",
    diagram:
      "title: append(end)\ncovers: append\ninput values: . value-1 value-2 | .\noperator: append(end)\noutput: . value-1 value-2 end |",
    explanation: "Append the end value after the source run returns.",
    source: "packages/fx/src/Fx/combinators/continueWith.ts",
    lifecycle:
      "The value is emitted exactly once after every source success and any delivered source failure. Interruption or a defect that prevents the source run from returning suppresses it. No resource is acquired; the source error, services, and observation lifetime are unchanged.",
    category: "Combining sources",
  },
  {
    name: "as",
    guide: "transforming-fx",
    diagram:
      'title: as("ready")\ncovers: as\ninput: a . b . c |\noperator: as("ready")\noutput: ready . ready . ready |',
    explanation:
      "Replace every payload with the same constant without suppressing any delivery.",
    source: "packages/fx/src/Fx/combinators/map.ts",
    lifecycle:
      "This operation is a pure `map`; it acquires no resources, retains no state, and forwards source failure, completion, services, and interruption unchanged.",
    category: "Transforming values",
  },
  {
    name: "at",
    guide: "building-fx",
    explanation:
      "One-second slots: sleep for two seconds, emit once, then complete. Interruption during sleep would prevent ready.",
    diagram:
      'title: at("ready", "2 seconds")\ncovers: at\ninput subscription: ^ . . .\noutput: . . ready |\noperator: at("ready", "2 seconds")',
    source: "packages/fx/src/Fx/constructors/at.ts",
    lifecycle:
      "Construction starts no timer. Running the `Fx` sleeps, emits exactly once, and completes after the sink handles the value. Interrupting the run cancels the sleep.",
    category: "Time and rate",
  },
  {
    name: "callback",
    guide: "building-fx",
    explanation:
      "Register lazily; external callbacks fork deliveries. Consumer cancellation closes the registration scope and runs its returned cleanup Effect.",
    diagram:
      "title: callback(register)\ncovers: callback\ninput external: register a . b .\ninput consumer: ^ . . . x\ninner listener: ^ . . . remove |\noutput: . a . b x\noperator: callback(register)",
    source: "packages/fx/src/Fx/constructors/make.ts",
    lifecycle:
      "Registration is lazy: `run` is called once for each `Fx` run. The run creates a child scope and stays active until `emit.done()`, sink early exit, or interruption. If `run` returns an Effect, it is registered as the scope finalizer. Each emit operation starts its sink handler in a fiber, so handler completion can overlap; use the returned fibers or a serialized source when ordering of effects matters.",
    category: "Callback sources",
  },
  {
    name: "catch",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: catch_(fallback)\ncovers: catch\ninput source: ^ guide . !offline\noperator: catch (alias of catch_)\ninner fallback: . . . . ^ cached |\noutput: . guide . . . cached |",
    explanation:
      "Exact export alias of catch_; the trace and lifecycle are identical. Recover a typed failure by running the replacement Fx; earlier values remain delivered.",
    aliasOf: "catch_",
    source: "packages/fx/src/Fx/combinators/catch.ts",
    lifecycle:
      "The source runs until it reports a Cause containing a `Fail`. The first typed failure starts exactly one fallback and the entire original Cause is replaced, including any defects or interrupts composed beside that Fail. A Cause with no Fail passes through unchanged. Source values already delivered remain delivered. The fallback's services become requirements of the returned Fx, and external interruption stops whichever run is active.",
    category: "Errors and recovery",
  },
  {
    name: "catch_",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: catch_(fallback)\ncovers: catch_\ninput source: ^ guide . !offline\noperator: catch_(fallback)\ninner fallback: . . . . ^ cached |\noutput: . guide . . . cached |",
    explanation:
      "Recover a typed failure by running the replacement Fx; earlier values remain delivered.",
    source: "packages/fx/src/Fx/combinators/catch.ts",
    lifecycle:
      "The source runs until it reports a Cause containing a `Fail`. The first typed failure starts exactly one fallback and the entire original Cause is replaced, including any defects or interrupts composed beside that Fail. A Cause with no Fail passes through unchanged. Source values already delivered remain delivered. The fallback's services become requirements of the returned Fx, and external interruption stops whichever run is active.",
    category: "Errors and recovery",
  },
  {
    name: "catchAll",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: catchAll shares catch_ semantics\ncovers: catchAll\ninput source: ^ guide . !offline\noperator: catchAll (alias of catch_)\ninner fallback: . . . . ^ cached |\noutput: . guide . . . cached |",
    source: "packages/fx/src/Fx/combinators/catch.ts",
    explanation:
      "Exact alias of catch_. Recover a typed failure by running the replacement Fx; earlier values remain delivered.",
    lifecycle:
      "It has exactly the source/fallback switching, failure, service, and interruption semantics of `catch`; it allocates no wrapper resource beyond that combinator.",
    category: "Errors and recovery",
    aliasOf: "catch_",
  },
  {
    name: "catchCause",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: catchCause replaces any terminal Cause with one fallback\ncovers: catchCause\ninput source: ^ . !decoder-defect\noperator: catchCause(recordAndFallback)\ninner fallback: . . . ^ unavailable |\noutput: . . . . unavailable |",
    source: "packages/fx/src/Fx/combinators/catch.ts",
    explanation: "Recovers from any failure cause by running a fallback Fx.",
    lifecycle:
      "The handler runs once after the source reports a cause and its returned Fx continues in the same subscription. It receives the cause unchanged. Values emitted before failure are not replayed, and the fallback's errors and services replace the recovered source error and join its requirements. Because interruption is catchable here, use this only when intentionally translating interruption rather than for ordinary typed recovery.",
    category: "Errors and recovery",
  },
  {
    name: "catchCauseIf",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: catchCauseIf recovers only when its Cause predicate matches\ncovers: catchCauseIf\ninput source: ^ . !decoder-defect\noperator: catchCauseIf(hasDies, fallback)\ninner fallback: . . . ^ reported |\noutput: . . . . reported |",
    source: "packages/fx/src/Fx/combinators/catch.ts",
    explanation:
      "Recovers a failure cause only when a predicate accepts the complete cause.",
    lifecycle:
      "The predicate receives the source cause unchanged. A match starts one lazy fallback in the same subscription; otherwise the original cause propagates. The fallback's requirements and errors are added, prior source values stay delivered, and interrupting the returned Fx interrupts its active run.",
    category: "Errors and recovery",
  },
  {
    name: "catchIf",
    guide: "fx-errors-and-recovery",
    explanation:
      "The predicate rejects denied, so the original typed failure is forwarded and cached never starts.",
    diagram:
      "title: catchIf(isOffline, cached)\ncovers: catchIf\ninput: guide . !denied\ninner predicate: . . false\noutput: guide . !denied\noperator: catchIf(isOffline, cached)",
    source: "packages/fx/src/Fx/combinators/catch.ts",
    lifecycle:
      "The predicate is evaluated on the first Fail found anywhere in the source Cause. A match starts one lazy fallback and replaces that entire Cause, including any defects or interrupts composed with the Fail. A rejection, or a Cause containing no Fail, forwards the original Cause unchanged. The fallback contributes its errors and services and shares the subscription.",
    category: "Errors and recovery",
  },
  {
    name: "catchTag",
    guide: "fx-errors-and-recovery",
    explanation:
      "Only the Offline tag selects this fallback; its one cached value follows acquisition.",
    diagram:
      'title: catchTag("Offline", cached)\ncovers: catchTag\ninput: guide . !Offline\ninner cached: . . ^ cached |\noutput: guide . . cached |\noperator: catchTag("Offline", cached)',
    source: "packages/fx/src/Fx/combinators/catch.ts",
    lifecycle:
      "The source owns the subscription until its Cause contains a Fail whose tag matches. That first matching Fail starts one handler Fx and replaces the entire original Cause, including any defects or interrupts composed with it. A Cause with no Fail, or a first Fail with another tag, passes through intact. The fallback is lazy and contributes its errors and services to the result.",
    category: "Errors and recovery",
  },
  {
    name: "catchTags",
    guide: "fx-errors-and-recovery",
    explanation:
      "This Denied failure selects the Denied handler from the handler table.",
    diagram:
      "title: catchTags({ Offline, Denied })\ncovers: catchTags\ninput: guide . !Denied\ninner Denied handler: . . ^ login |\noutput: guide . . login |\noperator: catchTags({ Offline, Denied })",
    source: "packages/fx/src/Fx/combinators/catch.ts",
    lifecycle:
      "The first Fail found anywhere in the source Cause is inspected. A listed tag starts exactly one handler Fx and replaces the entire original Cause, including any defects or interrupts composed with that Fail. An untagged or unlisted first Fail, or a Cause with no Fail, propagates intact. Handlers are lazy and contribute their individual errors and service requirements.",
    category: "Errors and recovery",
  },
  {
    name: "causes",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: causes emits only the terminal Cause as a value\ncovers: causes\ninput source: ^ guide . !malformed\noperator: causes\noutput: . . . Cause(malformed) |",
    source: "packages/fx/src/Fx/combinators/causes.ts",
    explanation:
      "Emits the source's terminal failure cause and discards every successful value.",
    lifecycle:
      "The source is subscribed once. Success values are dropped in arrival order; a terminal cause is emitted once and the returned Fx completes without a typed error. Defects and interruption are retained inside the emitted cause. No resource is acquired beyond the source subscription.",
    category: "Errors and recovery",
  },
  {
    name: "changesWithEffect",
    guide: "fx-stateful-transforms",
    diagram:
      "title: changesWithEffect waits for each equivalence check before deciding the next output\ncovers: changesWithEffect\ninput: received . received . packed . packed |\noperator: changesWithEffect(sameStatus)\noutput: received . . . packed . . |",
    source: "packages/fx/src/Fx/combinators/changesWithEffect.ts",
    explanation:
      'Drops consecutive elements that are considered equal by an effectful predicate. When the effect returns `true`, the element is skipped; when `false`, it is emitted. This is the effectful variant of `skipRepeatsWith`: instead of a pure `Equivalence<A>`, you supply `(prev, next) => Effect<boolean>` where `true` means "equal" (skip) and `false` means "changed" (emit).',
    lifecycle:
      "One previous value and a semaphore are scoped to each run. Comparison effects are serialized, interrupted with the run, and add their failures and services to the resulting Fx.",
    category: "Selecting values",
  },
  {
    name: "collectAll",
    guide: "consuming-fx",
    explanation:
      "Retain all successful values until the finite source completes, then return their ordered array.",
    diagram:
      "title: collectAll(source)\ncovers: collectAll\ninput source: a . b . c |\noutput Effect: . . . . . [a,b,c] |\noperator: collectAll(source)",
    source: "packages/fx/src/Fx/run/collect.ts",
    lifecycle:
      "The array is allocated separately for each Effect run. Subscription starts when the Effect runs and ends on source completion, failure, or interruption. Every emitted value is retained until completion, so an infinite source never completes and can grow memory without bound. Failures and services remain in `E` and `R`.",
    category: "Collecting values",
  },
  {
    name: "collectAllFork",
    guide: "consuming-fx",
    explanation:
      "Return a Fiber immediately; joining it later yields the full collected array.",
    diagram:
      "title: collectAllFork(source)\ncovers: collectAllFork\ninput Scope: ^ . . . . |\ninner collection: . a b [a,b] |\noutput Effect: Fiber |\noperator: collectAllFork(source)",
    source: "packages/fx/src/Fx/run/collect.ts",
    lifecycle:
      "Running the returned Effect starts a child fiber immediately. The parent fiber's scope supervises it, so parent termination interrupts collection. The child retains every value until completion and exposes source failure as its `E` channel.",
    category: "Collecting values",
  },
  {
    name: "collectUpTo",
    guide: "consuming-fx",
    explanation:
      "Stop after two values and return the retained prefix; cancel remaining producer work.",
    diagram:
      "title: collectUpTo(source, 2)\ncovers: collectUpTo\ninput source: a . b x . .\noutput Effect: . . [a,b] |\noperator: collectUpTo(source, 2)",
    source: "packages/fx/src/Fx/run/collect.ts",
    lifecycle:
      "Each Effect run owns a fresh array and source subscription. At most `upTo` values are retained in producer order; reaching the bound requests early exit and cleans up upstream. If the source completes first, the shorter array is returned. Source failures before completion remain typed.",
    category: "Collecting values",
  },
  {
    name: "collectUpToFork",
    guide: "consuming-fx",
    explanation:
      "Return a Fiber for bounded collection; the second value ends its producer and resolves its joined result.",
    diagram:
      "title: collectUpToFork(source, 2)\ncovers: collectUpToFork\ninput Scope: ^ . . . . |\ninner collection: . a b [a,b] |\ninner source: ^ a b x\noutput Effect: Fiber |\noperator: collectUpToFork(source, 2)",
    source: "packages/fx/src/Fx/run/collect.ts",
    lifecycle:
      "Running the Effect starts a supervised child immediately. It retains at most `upTo` values, stops upstream at the bound, and is interrupted when its parent terminates. Source failures are reported by the child fiber.",
    category: "Collecting values",
  },
  {
    name: "compact",
    guide: "transforming-fx",
    diagram:
      "title: compact drops None and unwraps Some\ncovers: compact\ninput: Some(a) None Some(b) |\noperator: compact\noutput: a . b |",
    source: "packages/fx/src/Fx/combinators/compact.ts",
    explanation:
      "Compacts an Fx of Options, discarding `None` values and unwrapping `Some` values.",
    lifecycle:
      "This is a stateless sink transformation. It acquires no resources and forwards source failures, services, completion, and interruption unchanged.",
    category: "Selecting values",
  },
  {
    name: "concat",
    guide: "composing-fx",
    diagram:
      "title: concat(cached, live)\ncovers: concat\ninput cached: cached . | . .\ninput live: . . ^ live |\noperator: concat(cached, live)\noutput: cached . . live |",
    explanation: "Subscribe to live only after the cached run returns.",
    source: "packages/fx/src/Fx/combinators/additive.ts",
    lifecycle:
      "Only one source is active at a time. Interruption stops the active source and prevents later acquisition. Failure is Sink delivery rather than a failing `Fx.run` Effect, so it does not by itself prevent the right source from being acquired.",
    category: "Combining sources",
  },
  {
    name: "concatMap",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: concatMap finishes each inner before starting the next\ncovers: concatMap\ninput: a b c . . . . . . |\noperator: concatMap(save)\ninner a: ^ a1 a2 | . . . . . .\ninner b: . . . ^ b1 b2 | . . .\ninner c: . . . . . . ^ c1 c2 |\noutput: . a1 a2 . b1 b2 . c1 c2 |",
    source: "packages/fx/src/Fx/combinators/concatMap.ts",
    explanation:
      "Maps each element to an inner Fx and concatenates the results sequentially. This scenario uses concurrent source deliveries: a pending source callback can wait for admission while another callback is already active.",
    lifecycle:
      "Source and inner failures are forwarded to the output Sink, and both service requirements remain in the returned type. The required `Scope` owns the admitted inner fiber; interruption closes it and prevents queued source work from starting. No values are dropped, switched, or replayed.",
    category: "Concurrent work",
  },
  {
    name: "concatMapEffect",
    guide: "fx-higher-order-and-concurrency",
    explanation:
      "One Effect runs at a time. Every successful Effect emits exactly one result in source order. This scenario uses concurrent source deliveries: a pending source callback can wait for admission while another callback is already active.",
    diagram:
      "title: concatMapEffect(save)\ncovers: concatMapEffect\ninput: a b c . . . . | .\ninner save-a: ^ . A | . . . . .\ninner save-b: . . . ^ B | . . .\ninner save-c: . . . . . ^ C | .\noutput: . . A . B . C |\noperator: concatMapEffect(save)",
    source: "packages/fx/src/Fx/combinators/concatMap.ts",
    lifecycle:
      "Source failures and Effect failures remain typed; callback services are added to the output requirements. The returned Fx requires `Scope`, which owns the active callback Effect and interrupts it when observation ends.",
    category: "Concurrent work",
  },
  {
    name: "continueWith",
    guide: "composing-fx",
    diagram:
      "title: continueWith(() => live)\ncovers: continueWith\ninput cached: cached . | . .\ninput live: . . ^ live |\noperator: continueWith(() => live)\noutput: cached . . live |",
    explanation:
      "Invoke the continuation lazily after the current run returns, then subscribe to its result.",
    source: "packages/fx/src/Fx/combinators/continueWith.ts",
    lifecycle:
      "Failures and service requirements from both producers remain on the public type and both failures are delivered to the same Sink. The returned Fx owns neither input. Interruption or a defect that prevents the first run Effect from returning also prevents the continuation from starting.",
    category: "Combining sources",
  },
  {
    name: "debounce",
    guide: "fx-time-and-rate",
    diagram:
      "title: debounce emits 250ms after the final value (50ms slots)\ncovers: debounce\ninput: t . ty . typed . . . . . |\noperator: debounce(250ms)\noutput: . . . . . . . . . typed |",
    source: "packages/fx/src/Fx/combinators/debounce.ts",
    explanation:
      "Emits a value only after no newer source value arrives for `duration`.",
    lifecycle:
      "Each value starts a scoped sleep. A newer value interrupts the previous sleep and replaces its pending value, so at most the latest value is emitted after a quiet period. Source errors terminate the result. Interruption stops both source and pending timer; `Scope` owns those switching lifetimes.",
    category: "Time and rate",
  },
  {
    name: "delay",
    guide: "fx-time-and-rate",
    diagram:
      "title: delay shifts every value by 100ms (two 50ms slots)\ncovers: delay\ninput: a . b . c . . |\noperator: delay(100ms)\noutput: . . a . b . c |",
    source: "packages/fx/src/Fx/combinators/delay.ts",
    explanation:
      "Delays every source value by `duration` while preserving its value and order.",
    lifecycle:
      "Each delivered value runs an Effect sleep before reaching the sink. Because this uses sequential effectful mapping, later values wait behind earlier sleeps and arrival order is preserved. Source failures propagate; interrupting the subscription interrupts the active sleep. No external resource is retained.",
    category: "Time and rate",
  },
  {
    name: "delimit",
    guide: "composing-fx",
    diagram:
      "title: delimit(start, end)\ncovers: delimit\ninput values: . value-1 value-2 | .\noperator: delimit(start, end)\noutput: start value-1 value-2 end |",
    explanation: "The start and end values bracket one source run.",
    source: "packages/fx/src/Fx/combinators/continueWith.ts",
    lifecycle:
      "`before` is emitted once, followed by every source success or delivered source failure, then `after` once when the source run Effect returns. Interruption or a defect suppresses `after`; this is Sink sequencing, not `Effect.ensuring`. No resource is acquired and source requirements are kept.",
    category: "Combining sources",
  },
  {
    name: "die",
    guide: "building-fx",
    explanation: "Deliver a defect Cause rather than a typed E failure.",
    diagram:
      "title: die(defect)\ncovers: die\ninput subscription: ^ .\noutput: . !Die(defect)\noperator: die(defect)",
    source: "packages/fx/src/Fx/constructors/die.ts",
    lifecycle:
      "Construction is inert. Each run delivers one defect cause to the sink and emits no values; it acquires no resources.",
    category: "Failure sources",
  },
  {
    name: "drain",
    guide: "consuming-fx",
    explanation:
      "Run the source and discard successful payloads; the Effect completes only after source return.",
    diagram:
      "title: drain(source)\ncovers: drain\ninput source: a b c |\noutput Effect: . . . void |\noperator: drain(source)",
    source: "packages/fx/src/Fx/run/observe.ts",
    lifecycle:
      "Running the Effect owns one source subscription until completion, failure, or interruption. It allocates no collection and adds no per-value effect. Source failures and services remain visible.",
    category: "Running effects",
  },
  {
    name: "drainLayer",
    guide: "consuming-fx",
    explanation:
      "Acquire a Layer that drains values in a background fiber; closing the Layer Scope interrupts it.",
    diagram:
      "title: drainLayer(source)\ncovers: drainLayer\ninput Layer Scope: ^ . . . x\ninner drain: . a b . x\noutput acquisition: . ready |\noperator: drainLayer(source)",
    source: "packages/fx/src/Fx/run/observe.ts",
    lifecycle:
      "Building the Layer starts `drain(fx)` with `forkScoped`. Acquisition succeeds after the fiber is registered; it does not wait for that fiber. The Layer scope interrupts the fiber on release. A source failure is stored in the discarded child Fiber exit: it does not fail Layer acquisition and this API exposes no handle for awaiting it. Recover, report, or otherwise observe failures inside `fx` before calling `drainLayer`, or use `fork` when the caller needs the Fiber exit. The annotated `E` channel remains in the public Layer type even though the background exit is not propagated by this implementation. `Scope` is supplied by the Layer.",
    category: "Running effects",
  },
  {
    name: "dropAfter",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: dropAfter includes its matching sentinel\ncovers: dropAfter\ninput: connected indexing complete ignored |\noperator: dropAfter(isComplete)\noutput: connected indexing complete | .",
    source: "packages/fx/src/Fx/combinators/takeUntil.ts",
    explanation:
      "Drops elements from an Fx after a predicate returns true. The element that satisfies the predicate is included in the output.",
    lifecycle:
      "The match stops upstream through the early-exit sink. The operation acquires no external resource and preserves source failures and services before completion.",
    category: "Selecting values",
  },
  {
    name: "dropUntil",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: dropUntil(isConnected)\ncovers: dropUntil\ninput: banner banner connected indexing |\noperator: dropUntil(isConnected)\noutput: . . connected indexing |",
    explanation:
      "Drops elements from an Fx until a predicate returns true. Emits from the first element for which the predicate returns true (including that element) and all following elements.",
    source: "packages/fx/src/Fx/combinators/dropUntil.ts",
    lifecycle:
      "The gate is local to one run and discarded on completion or interruption. No resources are acquired and the source's errors and services pass through unchanged.",
    category: "Selecting values",
  },
  {
    name: "dropUntilEffect",
    guide: "fx-selection-and-cardinality",
    explanation:
      "Each predicate Effect takes one turn in this serialized source. Its failure is forwarded rather than treated as false. The predicate still runs after the gate opens.",
    diagram:
      "title: dropUntilEffect(oneTurnCheck)\ncovers: dropUntilEffect\ninput: banner . banner . connected . indexing . |\ninner predicate: ^ false ^ false ^ true ^ false |\noutput: . . . . . connected . indexing |\noperator: dropUntilEffect(oneTurnCheck)",
    source: "packages/fx/src/Fx/combinators/dropUntil.ts",
    lifecycle:
      "The gate is per run. Predicate effects inherit producer ordering and concurrency, are interrupted with their invoking delivery, and expose `E2`/`R2`. Failures remain observable after the gate opens.",
    category: "Selecting values",
  },
  {
    name: "dropWhile",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: dropWhile shares skipWhile semantics\ncovers: dropWhile\ninput: banner banner connected indexing |\noperator: dropWhile (alias of skipWhile)\noutput: . . connected indexing |",
    source: "packages/fx/src/Fx/combinators/skipWhile.ts",
    explanation:
      "Exact alias of skipWhile. Skips elements from an Fx while a predicate returns true. Emits from the first element for which the predicate returns false (including that element) and all following elements.",
    lifecycle:
      "This alias has exactly `skipWhile`'s per-run gate and acquires no additional resource.",
    category: "Selecting values",
    aliasOf: "skipWhile",
  },
  {
    name: "dropWhileEffect",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: dropWhileEffect shares skipWhileEffect semantics\ncovers: dropWhileEffect\ninput: banner . banner . connected . indexing . |\ninner predicate: ^ true ^ true ^ false ^ false |\noutput: . . . . . connected . indexing |\noperator: dropWhileEffect (alias of skipWhileEffect)",
    source: "packages/fx/src/Fx/combinators/skipWhile.ts",
    explanation:
      "Exact alias of skipWhileEffect. Each predicate Effect takes one turn in this serialized source. Its failure is forwarded rather than treated as false. The predicate still runs after the gate opens.",
    lifecycle:
      "This alias retains `skipWhileEffect`'s failure, service, state, and interruption semantics.",
    category: "Selecting values",
    aliasOf: "skipWhileEffect",
  },
  {
    name: "during",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: during forwards only while its named window is active\ncovers: during\ninput events: before . move . after . |\ninput drag: . down |\noperator: during(events, drag)\ninner stop: . ^ . . . up |\noutput: . . move . after | .",
    source: "packages/fx/src/Fx/combinators/during.ts",
    explanation:
      "Forwards `events` only between a start signal and that signal's first stop event.",
    lifecycle:
      "`events` and the outer `signals` Fx start concurrently in one child Scope. Only the first outer value is used; that value must itself be an Fx, whose first value closes the gate. Event values before the start signal and after the stop signal are discarded. Completion of `events` completes the result. A failure from events, signals, or the selected stop Fx terminates everything; closing or interrupting the returned Fx interrupts all remaining fibers and closes the private Scope.",
    category: "Time and rate",
  },
  {
    name: "empty",
    guide: "building-fx",
    explanation: "Returns immediately with no successful delivery.",
    diagram:
      "title: empty\ncovers: empty\ninput subscription: ^\noutput: |\noperator: empty",
    source: "packages/fx/src/Fx/constructors/empty.ts",
    lifecycle:
      "Each run completes synchronously, emits nothing, and acquires no resources.",
    category: "Value sources",
  },
  {
    name: "ensuring",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: ensuring(close)\ncovers: ensuring\ninput source: ^ a b | .\noperator: ensuring(close)\ninner lifecycle: . . . finalize |\noutput values: . a b . |",
    explanation:
      "Run close after completion, failure, or interruption; output completion waits for cleanup.",
    source: "packages/fx/src/Fx/combinators/ensuring.ts",
    lifecycle:
      "The finalizer runs exactly once after normal completion, failure, defect, or interruption of the source run and follows Effect's `ensuring` finalization semantics. Its `never` typed-error channel does not make it incapable of defecting or being interrupted: a finalizer defect can fail a successful run or combine with the source Cause. Its services are required for the subscription.",
    category: "Resource lifetime",
  },
  {
    name: "exhaustLatestMap",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: exhaustLatestMap keeps only the newest value waiting behind active work\ncovers: exhaustLatestMap\ninput: a b c . . . . . |\noperator: exhaustLatestMap(index)\ninner a: ^ a1 . a2 | . . . .\ninner c: . . . . . ^ c1 c2 |\noutput: . a1 . a2 . . c1 c2 |",
    source: "packages/fx/src/Fx/combinators/exhaustLatestMap.ts",
    explanation:
      "Maps each element to an inner Fx, running one now and retaining only the latest waiting value.",
    lifecycle:
      "Source and admitted-inner failures are forwarded and both environments remain typed. The required `Scope` owns every active inner fiber. Source completion waits until the active and final pending inner finish; interruption closes the Scope and runs inner finalizers. The one-slot pending buffer retains work, not emitted output.",
    category: "Concurrent work",
  },
  {
    name: "exhaustLatestMapEffect",
    guide: "fx-higher-order-and-concurrency",
    explanation:
      "b is replaced by c in the single pending slot. Active a is allowed to finish.",
    diagram:
      "title: exhaustLatestMapEffect(index)\ncovers: exhaustLatestMapEffect\ninput: a b c | . . .\ninner index-a: ^ . . A | . .\ninner index-c: . . . . ^ C |\noutput: . . . A . C |\noperator: exhaustLatestMapEffect(index)",
    source: "packages/fx/src/Fx/combinators/exhaustLatestMapEffect.ts",
    lifecycle:
      "Source and admitted Effect failures remain typed, as do callback service requirements. The required `Scope` owns the active Effect; source completion drains the final pending value, while interruption discards pending work and runs active finalizers.",
    category: "Concurrent work",
  },
  {
    name: "exhaustMap",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: exhaustMap ignores arrivals until the active inner completes\ncovers: exhaustMap\ninput: a b . . c . . . |\noperator: exhaustMap(submit)\ninner a: ^ a1 . a2 | . . .\ninner c: . . . . ^ c1 . c2 |\noutput: . a1 . a2 . c1 . c2 |",
    source: "packages/fx/src/Fx/combinators/exhaustMap.ts",
    explanation:
      "Maps each element of an Fx to a new Fx, ignoring new elements until the current inner Fx completes.",
    lifecycle:
      "Source and admitted-inner failures are forwarded and their services remain typed. A `FiberHandle` in the required `Scope` owns the active inner. Source completion waits for that inner; interruption closes the handle and the inner's child Scope, running its finalizers.",
    category: "Concurrent work",
  },
  {
    name: "exhaustMapEffect",
    guide: "fx-higher-order-and-concurrency",
    explanation: "Ignore b while a is running; accept c after a completes.",
    diagram:
      "title: exhaustMapEffect(submit)\ncovers: exhaustMapEffect\ninput: a b . . c . |\ninner submit-a: ^ . A | . . .\ninner submit-c: . . . . ^ C |\noutput: . . A . . C |\noperator: exhaustMapEffect(submit)",
    source: "packages/fx/src/Fx/combinators/exhaustMapEffect.ts",
    lifecycle:
      "Source and callback Effect failures remain typed and callback services are added to the output requirements. The active Effect is owned by the returned Fx's required `Scope`; completion waits for it and interruption runs its finalizers.",
    category: "Concurrent work",
  },
  {
    name: "exit",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: exit materializes values and the terminal Cause without failing\ncovers: exit\ninput source: ^ guide . !offline\noperator: exit\noutput: . Exit.succeed(guide) . Exit.failCause(offline) |",
    source: "packages/fx/src/Fx/combinators/exit.ts",
    explanation:
      "Materializes every success and the terminal failure as infallible `Exit` values.",
    lifecycle:
      "Each source value becomes `Exit.succeed` in arrival order. A source failure, including a defect or interrupt, becomes one `Exit.failCause`, after which the returned Fx completes with error type `never`. It acquires no resource beyond the single source subscription.",
    category: "Errors and recovery",
  },
  {
    name: "fail",
    guide: "building-fx",
    explanation: "Deliver one typed failure Cause with no successful value.",
    diagram:
      'title: fail("offline")\ncovers: fail\ninput subscription: ^ .\noutput: . !offline\noperator: fail("offline")',
    source: "packages/fx/src/Fx/constructors/fail.ts",
    lifecycle:
      "Construction is inert. Each run delivers one typed failure cause to the sink and acquires no resources.",
    category: "Failure sources",
  },
  {
    name: "failCause",
    guide: "building-fx",
    explanation:
      "Forward the supplied whole Cause without dropping its combined failure or defect reasons.",
    diagram:
      "title: failCause(combinedCause)\ncovers: failCause\ninput cause: Fail(a)+Die(b)\noutput: !Fail(a)+Die(b)\noperator: failCause(combinedCause)",
    source: "packages/fx/src/Fx/constructors/failCause.ts",
    lifecycle:
      "Construction is inert. Each run forwards the cause once to `sink.onFailure`, emits no values, and acquires no resources.",
    category: "Failure sources",
  },
  {
    name: "filter",
    guide: "transforming-fx",
    diagram:
      "title: filter keeps admitted values in their input slots\ncovers: filter\ninput: 1 2 3 4 |\noperator: filter(isEven)\noutput: . 2 . 4 |",
    source: "packages/fx/src/Fx/combinators/filter.ts",
    explanation: "Filters elements of an Fx using a predicate function.",
    lifecycle:
      "No resource or buffer is acquired. The predicate runs while the source invokes the downstream sink; source failure, completion, and interruption are forwarded unchanged.",
    category: "Selecting values",
  },
  {
    name: "filterEffect",
    guide: "transforming-fx",
    explanation:
      "Admit each value only after its asynchronous even-number check succeeds. Concurrent producers can overlap callback Effects; these rows assume serial delivery.",
    diagram:
      "title: filterEffect(oneTurnCallback)\ncovers: filterEffect\ninput: 1 . 2 . 3 . 4 . |\ninner callback: ^ done ^ done ^ done ^ done |\noutput: . . . 2 . . . 4 |\noperator: filterEffect(oneTurnCallback)",
    source: "packages/fx/src/Fx/combinators/filterEffect.ts",
    lifecycle:
      "A predicate Effect belongs to the producer callback that invoked it. Its Cause is sent to the Sink, `R2` stays required, and interruption follows that delivery. No lock or queue is added.",
    category: "Selecting values",
  },
  {
    name: "filterMap",
    guide: "transforming-fx",
    diagram:
      "title: filterMap omits None and emits each Some in order\ncovers: filterMap\ninput: 1 2 3 4 |\noperator: filterMap(toOption)\noutput: . 20 . 40 |",
    source: "packages/fx/src/Fx/combinators/filterMap.ts",
    explanation: "Maps and filters elements of an Fx in a single operation.",
    lifecycle:
      "This operation is stateless and acquires no resources. It preserves the source's error and service channels and stops whenever the source or consuming fiber stops.",
    category: "Selecting values",
  },
  {
    name: "filterMapEffect",
    guide: "transforming-fx",
    explanation:
      "Resolve Option results asynchronously: None drops and Some unwraps. Concurrent producers can overlap callback Effects; these rows assume serial delivery.",
    diagram:
      "title: filterMapEffect(oneTurnCallback)\ncovers: filterMapEffect\ninput: 1 . 2 . 3 . 4 . |\ninner callback: ^ done ^ done ^ done ^ done |\noutput: . . . 20 . . . 40 |\noperator: filterMapEffect(oneTurnCallback)",
    source: "packages/fx/src/Fx/combinators/filterMapEffect.ts",
    lifecycle:
      "Each callback Effect follows its invoking producer delivery. Its failure Cause is sent to the Sink, services remain exposed as `R2`, and no semaphore, queue, or resource is added.",
    category: "Selecting values",
  },
  {
    name: "filterMapLoop",
    guide: "fx-stateful-transforms",
    diagram:
      "title: filterMapLoop can update state without emitting a value\ncovers: filterMapLoop\ninput: a . b . c . d |\noperator: filterMapLoop(0, everyOther)\noutput: 0:a . . . 2:c . . |",
    source: "packages/fx/src/Fx/combinators/filterMapLoop.ts",
    explanation:
      "Loops over an Fx with an accumulator, producing an optional new value for each element. If the function returns `None`, the element is filtered out.",
    lifecycle:
      "The seed is copied into each run and retained only until that run ends. The callback is pure, and source failure, services, completion, and interruption are preserved.",
    category: "Stateful transforms",
  },
  {
    name: "filterMapLoopCause",
    guide: "fx-stateful-transforms",
    diagram:
      "title: filterMapLoopCause can suppress a terminal cause\ncovers: filterMapLoopCause\ninput source: loaded . cached . !offline\noperator: filterMapLoopCause(0, suppress)\noutput source: loaded . cached . |",
    source: "packages/fx/src/Fx/combinators/filterMapLoopCause.ts",
    explanation:
      "Loops over the failure causes of an Fx with an accumulator, potentially transforming or filtering them. This allows for complex error handling logic that maintains state across failures.",
    lifecycle:
      "Failure state is isolated to one run and discarded afterward. The pure callback acquires no resources; defects and interrupts are visible inside the full `Cause` supplied to it.",
    category: "Stateful transforms",
  },
  {
    name: "filterMapLoopCauseEffect",
    guide: "fx-stateful-transforms",
    diagram:
      "title: filterMapLoopCauseEffect completes only after its one-turn suppression decision\ncovers: filterMapLoopCauseEffect\ninput source: loaded . cached . !offline .\noperator: filterMapLoopCauseEffect(0, oneTurnSuppress)\noutput source: loaded . cached . . |",
    source: "packages/fx/src/Fx/combinators/filterMapLoopCauseEffect.ts",
    explanation:
      "Effectfully loops over the failure causes of an Fx with an accumulator.",
    lifecycle:
      "Cause state and callback Effects belong to the consuming run. Services remain required, callback failure is sent to the Sink, and interruption follows each delivery; no semaphore is introduced.",
    category: "Stateful transforms",
  },
  {
    name: "filterMapLoopEffect",
    guide: "fx-stateful-transforms",
    diagram:
      "title: filterMapLoopEffect makes each zero-or-one decision after its Effect resolves\ncovers: filterMapLoopEffect\ninput: a . b . c . d . |\noperator: filterMapLoopEffect(0, oneTurnEveryOther)\noutput: . 0:a . . . 2:c . . |",
    source: "packages/fx/src/Fx/combinators/filterMapLoopEffect.ts",
    explanation:
      "Effectfully loops over an Fx with an accumulator, producing an optional new value.",
    lifecycle:
      "One mutable seed belongs to each run. Callback Causes are delivered to the Sink, services remain required, and interruption follows each delivery; callers need a serialized producer for atomic state.",
    category: "Stateful transforms",
  },
  {
    name: "first",
    guide: "consuming-fx",
    explanation:
      "Resolve with Some(firstValue) and stop the source. An empty source instead returns None.",
    diagram:
      "title: first(source)\ncovers: first\ninput source: . a x . .\noutput Effect: . Some(a) |\noperator: first(source)",
    source: "packages/fx/src/Fx/run/first.ts",
    lifecycle:
      "Running the Effect subscribes once and stops upstream after the first value. It returns `None` only when the source completes first; a source failure is still `E`. Interruption cleans up the active source.",
    category: "Collecting values",
  },
  {
    name: "flatMap",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: flatMap runs every inner and lets their values interleave\ncovers: flatMap\ninput: a . b . . . . . |\noperator: flatMap(load)\ninner a: ^ a1 . . a2 | . . .\ninner b: . . ^ b1 . b2 | . .\noutput: . a1 . b1 a2 b2 . . |",
    source: "packages/fx/src/Fx/combinators/flatMap.ts",
    explanation:
      "Maps each source value to an inner Fx and merges every inner concurrently.",
    lifecycle:
      "Source and inner failures are forwarded; their required services are unioned. A `FiberSet` in the required `Scope` owns all inner fibers. Source completion waits for the set to empty. Interrupting observation closes the Scope and interrupts every active inner, running each inner Scope's finalizers.",
    category: "Concurrent work",
  },
  {
    name: "flatMapConcurrently",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: flatMapConcurrently waits when every permit is occupied\ncovers: flatMapConcurrently\ninput: a b c . . . . . |\noperator: flatMapConcurrently(load, 2)\ninner a: ^ a1 . a2 | . . . .\ninner b: . ^ b1 . b2 | . . .\ninner c: . . . . . ^ c1 c2 |\noutput: . a1 b1 a2 b2 . c1 c2 |",
    source: "packages/fx/src/Fx/combinators/flatMapConcurrently.ts",
    explanation:
      "Maps each element of an Fx to a new Fx, running them concurrently with a limit. This scenario uses concurrent source deliveries: a pending source callback can wait for admission while another callback is already active.",
    lifecycle:
      "A non-positive, fractional, infinite, or unsafe-integer limit fails through the Sink with `Cause.IllegalArgumentError`. Source and inner failures and services remain typed. The required `Scope` owns waiting and active fibers; source completion waits for all of them, and interruption cancels both groups and runs active inner finalizers.",
    category: "Concurrent work",
  },
  {
    name: "flatMapConcurrentlyEffect",
    guide: "fx-higher-order-and-concurrency",
    explanation:
      "Two permits admit a and b; c waits until b releases a permit. Results follow completion order. This scenario uses concurrent source deliveries: a pending source callback can wait for admission while another callback is already active.",
    diagram:
      "title: flatMapConcurrentlyEffect(load, 2)\ncovers: flatMapConcurrentlyEffect\ninput: a b c | . . .\ninner load-a: ^ . . . . A |\ninner load-b: . ^ B | . . .\ninner load-c: . . . ^ C | .\noutput: . . B . C A |\noperator: flatMapConcurrentlyEffect(load, 2)",
    source: "packages/fx/src/Fx/combinators/flatMapConcurrentlyEffect.ts",
    lifecycle:
      "Invalid limits fail with `Cause.IllegalArgumentError`; source and callback failures remain typed and callback services are added to requirements. The required `Scope` owns waiting and active Effects. Completion drains them; interruption cancels them and runs their finalizers.",
    category: "Concurrent work",
  },
  {
    name: "flatMapEffect",
    guide: "fx-higher-order-and-concurrency",
    explanation:
      "Start both Effects; b resolves first. Completion waits for outstanding a.",
    diagram:
      "title: flatMapEffect(load)\ncovers: flatMapEffect\ninput: a b | . . .\ninner load-a: ^ . . . A |\ninner load-b: . ^ B | . .\noutput: . . B . A |\noperator: flatMapEffect(load)",
    source: "packages/fx/src/Fx/combinators/flatMapEffect.ts",
    lifecycle:
      "Source and callback failures remain typed and callback services are unioned with source services. The required `Scope` owns all running Effects; source completion waits for them, and interruption runs every Effect finalizer.",
    category: "Concurrent work",
  },
  {
    name: "flip",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: flip turns typed failures into values and values into failures\ncovers: flip\ninput failure: ^ . !offline\ninput success: ^ . ready |\noperator: flip\noutput failure: . . offline |\noutput success: . . !ready",
    source: "packages/fx/src/Fx/combinators/flip.ts",
    explanation:
      "Emits typed failures as values and fails with the first successful value.",
    lifecycle:
      "If a source Cause contains any Fail, the first typed error `e` is delivered as success and the entire Cause is discarded, including defects or interrupts composed beside that Fail. A Cause with no Fail propagates unchanged. A source success `a` terminates the returned Fx with typed failure `a`. The source subscription is the only lifetime and external interruption still stops it.",
    category: "Errors and recovery",
  },
  {
    name: "fn",
    guide: "building-fx",
    explanation:
      "Invoke the function to construct an Fx; its generator Effects run only when that Fx is subscribed, then its returned Fx runs.",
    diagram:
      "title: fn(function* (id) { ... })\ncovers: fn\ninput invocation: call(id) . . . . .\ninput subscription: . ^ . . . .\ninner setup: . ^ ready | . .\ninner returned Fx: . . . ^ item |\noutput: . . . . item |\noperator: fn(function* (id) { ... })",
    source: "packages/fx/src/Fx/constructors/fn.ts",
    lifecycle:
      "Creating the function and invoking it start no stream. For generator bodies, each run evaluates the body and yielded Effects, then runs the returned `Fx` in the same structured lifetime. Interruption stops both acquisition and production. Direct bodies are evaluated lazily through the same unwrap boundary.",
    category: "Generator composition",
  },
  {
    name: "fork",
    guide: "consuming-fx",
    explanation:
      "Start draining in a supervised child fiber; return its Fiber before the source finishes. Parent termination interrupts it.",
    diagram:
      "title: fork(source)\ncovers: fork\ninput Scope: ^ . . . x\ninner source: . ^ a b x\noutput Effect: . Fiber |\noperator: fork(source)",
    source: "packages/fx/src/Fx/run/fork.ts",
    lifecycle:
      "The returned Effect acquires the source services and creates a child attached to the calling fiber's scope. Parent termination interrupts the child. By default the child starts immediately and remains interruptible; `options` can change those two Effect fiber policies. Values are discarded and source failure is reported by the child fiber.",
    category: "Running effects",
  },
  {
    name: "fromEffect",
    guide: "building-fx",
    explanation:
      "The Effect runs once, emits its successful result, and returns. Failure instead forwards its Cause.",
    diagram:
      "title: fromEffect(load)\ncovers: fromEffect\ninput subscription: ^ . . .\ninner load: ^ . loaded |\noutput: . . loaded |\noperator: fromEffect(load)",
    source: "packages/fx/src/Fx/constructors/fromEffect.ts",
    lifecycle:
      "Conversion is lazy. Each run executes the Effect once in the run's fiber, forwards its success or full cause to the sink, and completes after the sink handler. The run's interruption and scope own any acquisition performed by the Effect.",
    category: "Effect interop",
  },
  {
    name: "fromFailures",
    guide: "building-fx",
    explanation:
      "Consume the iterable at construction and combine its typed failures into one Cause, delivered once per run.",
    diagram:
      "title: fromFailures([name, email])\ncovers: fromFailures\ninput construction: [name,email] .\ninput subscription: . ^\noutput: . !name+email\noperator: fromFailures([name, email])",
    source: "packages/fx/src/Fx/constructors/fromFailures.ts",
    lifecycle:
      "The iterable is consumed eagerly when `fromFailures` is called. Running the result forwards the combined cause once, emits no values, and acquires no resources. An empty iterable produces the empty Cause.",
    category: "Failure sources",
  },
  {
    name: "fromIterable",
    guide: "building-fx",
    explanation:
      "Visit iterable elements in order, awaiting each delivery before the next.",
    diagram:
      "title: fromIterable([a, b, c])\ncovers: fromIterable\ninput iterable: [a,b,c] . . .\noutput: a b c |\noperator: fromIterable([a, b, c])",
    source: "packages/fx/src/Fx/constructors/fromIterable.ts",
    lifecycle:
      "Construction stores the iterable but does not iterate it. Each run obtains a fresh iterator, offers values sequentially to the sink, and completes after iteration. Interruption stops further iteration. No child fiber or buffer is created.",
    category: "Value sources",
  },
  {
    name: "fromSchedule",
    guide: "building-fx",
    explanation:
      "Effect.schedule uses this recurrence schedule for two void deliveries, then completes; schedule outputs are not payloads.",
    diagram:
      "title: fromSchedule(Schedule.recurs(2))\ncovers: fromSchedule\ninput schedule: recur recur stop\noutput: void void |\noperator: fromSchedule(Schedule.recurs(2))",
    source: "packages/fx/src/Fx/constructors/fromSchedule.ts",
    lifecycle:
      "Construction starts no clock. Running the `Fx` repeatedly invokes the sink under the schedule and completes when the schedule completes. Schedule failures are forwarded as causes; interruption cancels waiting and stops further ticks. The returned `Fx` retains the schedule's `Error` and `Env` channels.",
    category: "Time and rate",
  },
  {
    name: "fromStream",
    guide: "building-fx",
    explanation:
      "Read upstream chunks and deliver each element through the Fx sink; the reader belongs to this run.",
    diagram:
      "title: fromStream(stream)\ncovers: fromStream\ninput Stream chunks: [a,b] . [c] |\noutput Fx values: a b c |\noperator: fromStream(stream)",
    source: "packages/fx/src/Fx/stream.ts",
    lifecycle:
      "Conversion starts nothing. Each `Fx.run` starts one Stream run owned by the caller's fiber and scope. Interruption stops the Stream and its finalizers. Delivery order and concurrency follow Effect Stream's `mapEffect` semantics and `options`.",
    category: "Stream interop",
  },
  {
    name: "gen",
    guide: "fx-dynamic-producers",
    diagram:
      "title: gen(function* () { return selected })\ncovers: gen\ninput setup: ^ choose |\noperator: gen(function* () { return selected })\ninner selected Fx: . . ^ a b |\noutput: . . . a b |",
    explanation:
      "Yield setup Effects once per run, then run the returned Fx. A yielded failure prevents selection.",
    source: "packages/fx/src/Fx/combinators/gen.ts",
    lifecycle:
      "The generator is lazy: it runs for each subscription. Yielded Effects run first; only their returned Fx is then subscribed. A setup failure prevents the Fx from starting, and interruption cancels the active phase. Resources acquired by yielded Effects must not escape unless managed independently; use `genScoped` when setup and the returned Fx share a Scope.",
    category: "Generator composition",
  },
  {
    name: "genScoped",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: genScoped keeps a resource alive through its subscription and releases it afterward\ncovers: genScoped\ninput setup: ^ open ready . . |\noperator: genScoped(function*)\ninner resource scope: . ^ socket . . close |\ninner selected Fx: . . ^ a b | .\noutput values: . . . a b . |",
    source: "packages/fx/src/Fx/combinators/genScoped.ts",
    explanation:
      "Builds an Fx with a subscription-owned Scope shared by setup and streaming.",
    lifecycle:
      "Every subscription creates one child Scope, runs the generator inside it, then runs the returned Fx in the same Scope. Normal completion, failure, defect, or interruption closes the Scope and its finalizers. Setup failures prevent streaming; all non-Scope errors and services remain in the result.",
    category: "Generator composition",
  },
  {
    name: "grouped",
    guide: "fx-stateful-transforms",
    diagram:
      "title: grouped emits full batches and flushes the final partial batch\ncovers: grouped\ninput: a b c d e |\noperator: grouped(2)\noutput: . [a,b] . [c,d] . [e] |",
    source: "packages/fx/src/Fx/combinators/grouped.ts",
    explanation:
      "Partitions the stream into non-empty arrays of size `n`. The final array may be smaller if there are leftover elements. The size must be a positive safe integer. A group can retain up to `n` values, so callers own the memory policy for valid sizes. Invalid sizes fail with `Cause.IllegalArgumentError`. Matches Effect `Stream.grouped`.",
    lifecycle:
      "Each run retains at most `n` values and releases its buffer after the final flush or interruption. Invalid sizes deliver failure before source acquisition. A terminal observer may interrupt before the post-failure flush, but a Sink that handles the Cause can receive the partial group afterward.",
    category: "Stateful transforms",
  },
  {
    name: "groupedWithin",
    guide: "fx-stateful-transforms",
    diagram:
      "title: groupedWithin flushes when its timer wins and again at source completion\ncovers: groupedWithin\ninput: a . . . c . |\noperator: groupedWithin(3, 2 turns)\noutput: . . [a] . . . [c] |",
    source: "packages/fx/src/Fx/combinators/grouped.ts",
    explanation:
      "Partitions the stream into arrays, emitting when `n` is reached or `duration` elapses after the first element of the current group. The size must be a positive safe integer. A group can retain up to `n` values, so callers own the memory policy for valid sizes. Invalid sizes fail with `Cause.IllegalArgumentError`. Matches Effect `Stream.groupedWithin`.",
    lifecycle:
      "Each run retains at most `n` values and at most one timer fiber in the required Scope. A source failure is Sink delivery, so `flushNow` still runs afterward unless the consumer interrupts the run. Flushing or interruption cancels the timer; invalid sizes fail before subscription.",
    category: "Time and rate",
  },
  {
    name: "if",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: if switches from the true branch to the false branch\ncovers: if\ninput condition: true . false . |\noperator: if(condition, { onTrue, onFalse })\ninner onTrue: ^ enabled x . .\ninner onFalse: . . ^ disabled |\noutput: . enabled . disabled |",
    source: "packages/fx/src/Fx/combinators/when.ts",
    explanation:
      "Every condition value selects a branch and interrupts the prior active branch before forwarding replacement values.",
    lifecycle:
      "The required Scope owns the active branch. Replacement interrupts and awaits the previous branch; consumer interruption closes active work. Failures are delivered to the Sink.",
    category: "Conditional sources",
  },
  {
    name: "interrupt",
    guide: "building-fx",
    explanation:
      "Deliver an interruption Cause rather than a successful completion.",
    diagram:
      "title: interrupt(1)\ncovers: interrupt\ninput subscription: ^ .\noutput: . x\noperator: interrupt(1)",
    source: "packages/fx/src/Fx/constructors/interrupt.ts",
    lifecycle:
      "Construction is inert. Each run forwards one interruption cause carrying `id` to the sink, emits no values, and acquires no resources.",
    category: "Failure sources",
  },
  {
    name: "keyed",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: keyed reuses b, closes removed a, and creates c under separate child scopes\ncovers: keyed\ninput collections: ^ [a,b] . [b,c] |\noperator: keyed({ getKey, onValue })\ninner key a scope: . ^ a close |\ninner key b scope: . ^ b b |\ninner key c scope: . . . ^ c |\noutput ready rows: . . [a,b] . [b,c] |",
    source: "packages/fx/src/Fx/combinators/keyed.ts",
    explanation:
      "Efficiently transforms a list of values into a list of Fx streams, using keys to track identity. This is crucial for performance when rendering lists or managing collections of stateful entities. When the input list changes: - New keys cause `onValue` to be called. - Existing keys have their `RefSubject` updated with the new value. - Removed keys close the supplied child Scope and clean resources registered through it; the `onValue` run fiber remains owned by the outer parent Scope.",
    lifecycle:
      "Each key receives its own `RefSubject` and child `Scope`. Reusing a key updates that subject in place. Removing a key closes the child Scope and therefore the resources registered through its supplied Scope service. The `onValue` run fiber itself is forked in the outer parent Scope, so child-Scope closure does not guarantee interruption of an arbitrary Fx that ignores Scope. Interrupting the outer run closes the parent and remaining children. Source and `onValue` failures, services, and Scope requirements remain visible in the return type.",
    category: "Keyed work",
  },
  {
    name: "loop",
    guide: "fx-stateful-transforms",
    diagram:
      "title: loop separates its private state from its one output per event\ncovers: loop\ninput events: received . packed . shipped |\ninput accumulator: 1 . 2 . 3 .\noperator: loop(position, label)\noutput labels: 1.received . 2.packed . 3.shipped |",
    source: "packages/fx/src/Fx/combinators/loop.ts",
    explanation:
      "Loops over an Fx with an accumulator, producing a new value for each element and updating the accumulator.",
    lifecycle:
      "A fresh accumulator starts from `seed` for each run and is discarded when that run ends. The pure callback adds no failures, services, fibers, or resources.",
    category: "Stateful transforms",
  },
  {
    name: "loopCause",
    guide: "fx-stateful-transforms",
    diagram:
      "title: loopCause rewrites a terminal cause after passing earlier values through\ncovers: loopCause\ninput source: loaded . cached . !offline\noperator: loopCause(0, prefix)\noutput source: loaded . cached . !n0:offline",
    source: "packages/fx/src/Fx/combinators/loopCause.ts",
    explanation: "Loops over the failure causes of an Fx with an accumulator.",
    lifecycle:
      "A fresh state begins for each run and is discarded afterward. The callback owns no resources and sees typed failures, defects, and interruption represented by `Cause`.",
    category: "Stateful transforms",
  },
  {
    name: "loopCauseEffect",
    guide: "fx-stateful-transforms",
    diagram:
      "title: loopCauseEffect forwards its transformed terminal cause when its Effect resolves\ncovers: loopCauseEffect\ninput source: loaded . cached . !offline .\noperator: loopCauseEffect(0, oneTurnPrefix)\noutput source: loaded . cached . . !n0:offline",
    source: "packages/fx/src/Fx/combinators/loopCauseEffect.ts",
    explanation:
      "Effectfully loops over the failure causes of an Fx with an accumulator.",
    lifecycle:
      "One mutable seed belongs to each run. Required services remain in the result; callback failure is delivered to the Sink, and interruption follows each producer delivery without adding a lock.",
    category: "Stateful transforms",
  },
  {
    name: "loopEffect",
    guide: "fx-stateful-transforms",
    diagram:
      "title: loopEffect emits after each one-turn state transition resolves\ncovers: loopEffect\ninput events: received . packed . shipped . |\ninput accumulator: 1 . 2 . 3 . .\noperator: loopEffect(position, oneTurnLabel)\noutput labels: . 1.received . 2.packed . 3.shipped |",
    source: "packages/fx/src/Fx/combinators/loopEffect.ts",
    explanation:
      "Effectfully loops over an Fx with an accumulator, producing a new value for each element.",
    lifecycle:
      "One mutable seed is retained per run. Each callback Effect follows its invoking delivery; failure is sent to the Sink, services remain required, and interruption does not provide a global lock.",
    category: "Stateful transforms",
  },
  {
    name: "make",
    guide: "building-fx",
    explanation:
      "The custom run Effect calls the sink twice, awaits both deliveries, then returns. make itself imposes no cardinality policy.",
    diagram:
      "title: make(sink => deliverPair)\ncovers: make\ninput run: ^ onSuccess(a) onSuccess(b) return\noutput: . a b |\noperator: make(sink => deliverPair)",
    source: "packages/fx/src/Fx/constructors/make.ts",
    lifecycle:
      "`make` only stores `run`; it starts no work. Every call to `Fx.run` executes that function in the caller's fiber. The function must keep all acquisition and cleanup inside its returned Effect or a required `Scope`; its error channel is `never` because producer failures must be sent to `sink.onFailure`.",
    category: "Callback sources",
  },
  {
    name: "map",
    guide: "transforming-fx",
    diagram:
      "title: map(n => n * 10)\ncovers: map\ninput: 1 . 2 . 3 |\noperator: map(n => n * 10)\noutput: 10 . 20 . 30 |",
    explanation:
      "A synchronous mapping emits one transformed value for every input.",
    source: "packages/fx/src/Fx/combinators/map.ts",
    lifecycle:
      "This operation acquires no resources and retains no state. Running the result runs the source in the same Scope, and interruption or failure is forwarded unchanged.",
    category: "Transforming values",
  },
  {
    name: "mapBoth",
    guide: "transforming-fx",
    diagram:
      "title: mapBoth keeps one success output while also mapping typed failures\ncovers: mapBoth\ninput: ok !offline\noperator: mapBoth(success, failure)\noutput: OK !OfflineError",
    source: "packages/fx/src/Fx/combinators/mapBoth.ts",
    explanation:
      "Transforms both the success and error channels of an Fx using the provided options. Mirrors `Effect.mapBoth`: `onSuccess` maps emitted values, `onFailure` maps the typed failure (via `Cause.map`); defects and interrupts are preserved.",
    lifecycle:
      "Both callbacks are synchronous and the operation acquires no resources. Defects, interruption, service requirements, and source lifetime pass through unchanged.",
    category: "Errors and recovery",
  },
  {
    name: "mapEffect",
    guide: "transforming-fx",
    explanation:
      "Wait one turn for each mapping Effect in this serialized source. Concurrent producers can overlap callback Effects; these rows assume serial delivery.",
    diagram:
      "title: mapEffect(oneTurnCallback)\ncovers: mapEffect\ninput: 1 . 2 . 3 . |\ninner callback: ^ done ^ done ^ done |\noutput: . label-1 . label-2 . label-3 |\noperator: mapEffect(oneTurnCallback)",
    source: "packages/fx/src/Fx/combinators/mapEffect.ts",
    lifecycle:
      "Each callback Effect belongs to the producer delivery that invoked it. Failure is routed to the Sink, services remain required, and interruption is local to that delivery. The combinator adds no queue, semaphore, result retention, or independent fiber.",
    category: "Transforming values",
  },
  {
    name: "mapError",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: mapError changes the typed failure but keeps values and timing\ncovers: mapError\ninput source: ^ guide . !offline\noperator: mapError(toDomainError)\noutput: . guide . !DomainError",
    source: "packages/fx/src/Fx/combinators/mapError.ts",
    explanation:
      "Transforms typed failures while preserving defects and interruption.",
    lifecycle:
      "The mapping function runs synchronously for each `Cause.Fail` reported by the source. It does not run for defects or interrupts, which pass through unchanged. Values retain order and cardinality. No resource is acquired and the returned Fx has the same subscription lifetime and services as its source.",
    category: "Errors and recovery",
  },
  {
    name: "merge",
    guide: "composing-fx",
    diagram:
      "title: merge(left, right)\ncovers: merge\ninput local: local-1 . . local-2 . |\ninput server: . server-1 . . server-2 |\noperator: merge(left, right)\noutput: local-1 server-1 . local-2 server-2 |",
    explanation:
      "Both subscriptions run together; every value is forwarded and completion waits for both.",
    source: "packages/fx/src/Fx/combinators/additive.ts",
    lifecycle:
      "Both runs are children of the consumer and completion waits for both. Downstream interruption cancels the remaining runs. A source Cause is only sent to `sink.onFailure`; whether that callback ends observation is Sink policy, not an intrinsic terminal rule of `merge`.",
    category: "Combining sources",
  },
  {
    name: "mergeAll",
    guide: "composing-fx",
    diagram:
      "title: mergeAll(local, server, cache)\ncovers: mergeAll\ninput local: local-1 . . local-2 . |\ninput cache: . . cache-1 . . |\ninput server: . server-1 . . server-2 |\noperator: mergeAll(local, server, cache)\noutput: local-1 server-1 cache-1 local-2 server-2 |",
    explanation:
      "All supplied producers run concurrently; this three-source example retains every delivery.",
    source: "packages/fx/src/Fx/combinators/mergeAll.ts",
    lifecycle:
      "Typed failures from any input are forwarded and every input environment is required. Interrupt-only causes from sibling cancellation are suppressed at the Sink boundary. The observing fiber owns all concurrent runs: completion waits for all inputs, and interruption cancels the remaining runs and their resource lifetimes.",
    category: "Combining sources",
  },
  {
    name: "mergeLeft",
    guide: "composing-fx",
    diagram:
      "title: mergeLeft(local, server)\ncovers: mergeLeft\ninput local: local-1 . . local-2 . |\ninput server: . server-1 . . server-2 |\noperator: mergeLeft(local, server)\noutput: local-1 . . local-2 . |",
    explanation:
      "The server still runs and can fail, but only local values are delivered; wait for both completions.",
    source: "packages/fx/src/Fx/combinators/additive.ts",
    lifecycle:
      "Both sources are acquired together and owned by the consuming run. Interruption cancels both and normal completion waits for both. A Cause from either source is delivered to the Sink but does not intrinsically cancel its sibling; right successes remain suppressed by the filter.",
    category: "Combining sources",
  },
  {
    name: "mergeOrdered",
    guide: "composing-fx",
    diagram:
      "title: mergeOrdered buffers a faster later lane behind an earlier lane\ncovers: mergeOrdered\ninput first: . first . | .\ninput second: second . . . |\noperator: mergeOrdered(first, second)\noutput: . first . second |",
    source: "packages/fx/src/Fx/combinators/mergeOrdered.ts",
    explanation:
      "Runs multiple Fx streams concurrently while draining their values in argument order.",
    lifecycle:
      "Non-interruption failures are forwarded. Interrupt-only causes mark that input ended so they cannot deadlock later buffers. All input services remain typed. The observing fiber owns all runs and buffers; completion waits for all inputs, while interruption discards buffers and interrupts remaining resource scopes.",
    category: "Combining sources",
  },
  {
    name: "mergeRight",
    guide: "composing-fx",
    diagram:
      "title: mergeRight(local, server)\ncovers: mergeRight\ninput local: local-1 . . local-2 . |\ninput server: . server-1 . . server-2 |\noperator: mergeRight(local, server)\noutput: . server-1 . . server-2 |",
    explanation:
      "Local values are suppressed while its lifetime and failures remain observable.",
    source: "packages/fx/src/Fx/combinators/additive.ts",
    lifecycle:
      "The consumer owns both concurrent runs and normal completion waits for both. Interruption cancels both. A Cause is delivered to the Sink without inherently canceling the sibling; left successes remain suppressed even while their failures are observable.",
    category: "Combining sources",
  },
  {
    name: "never",
    guide: "building-fx",
    explanation:
      "No deliveries and no normal completion; the consumer interrupts the waiting run.",
    diagram:
      "title: never\ncovers: never\ninput consumer: ^ . . x\noutput: . . . x\noperator: never",
    source: "packages/fx/src/Fx/constructors/fromEffect.ts",
    lifecycle:
      "Each run remains suspended until its owning fiber is interrupted. It allocates no independent timer or background fiber.",
    category: "Value sources",
  },
  {
    name: "null",
    guide: "building-fx",
    explanation:
      "Exact export alias of succeedNull; the trace and lifecycle are identical. Deliver one null value and complete. This is a value pulse, distinct from empty.",
    diagram:
      "title: succeedNull\ncovers: null\ninput subscription: ^ . .\noutput: . null |\noperator: null (alias of succeedNull)",
    aliasOf: "succeedNull",
    source: "packages/fx/src/Fx/constructors/succeed.ts",
    lifecycle: "Each run performs one sink delivery and acquires no resources.",
    category: "Value sources",
  },
  {
    name: "observe",
    guide: "consuming-fx",
    explanation:
      "Run the source and await observation Effects; the resulting Effect has no collected array.",
    diagram:
      "title: observe(source, save)\ncovers: observe\ninput source: a . b . |\ninner save: ^ done ^ done |\noutput Effect: . . . . void |\noperator: observe(source, save)",
    source: "packages/fx/src/Fx/run/observe.ts",
    lifecycle:
      "Observation starts only when the returned Effect runs. That Effect owns the source run and completes when the source completes. Interruption interrupts the internal fiber and source cleanup. Callback invocation follows the producer's delivery behavior; `observe` adds no buffer or concurrency of its own. A source cause or a callback failure fails the returned Effect as `E | E2`.",
    category: "Running effects",
  },
  {
    name: "observeLayer",
    guide: "consuming-fx",
    explanation:
      "Layer acquisition starts background observation and returns without waiting for its exit. The Layer Scope owns interruption.",
    diagram:
      "title: observeLayer(source, save)\ncovers: observeLayer\ninput Layer Scope: ^ . . . x\ninner source: . a b . x\noutput acquisition: . ready |\noperator: observeLayer(source, save)",
    source: "packages/fx/src/Fx/run/observe.ts",
    lifecycle:
      "Building the Layer forks `observe(fx, f)` in its scope and completes acquisition after registration. Releasing the Layer interrupts the observer and source. Source and callback failures terminate the discarded child Fiber; they do not fail Layer acquisition, and this API exposes no Fiber handle from which to await the exit. Handle or report those failures inside the source/callback, or use `observe`/`fork` when the caller must observe them. The annotated `E | E2` Layer error remains in the public type even though this implementation does not propagate the background exit. `Scope` is supplied internally; delivery behavior remains that of `observe`.",
    category: "Running effects",
  },
  {
    name: "onError",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: onError forwards the original failure before starting failure-only cleanup\ncovers: onError\ninput source: ^ a . !offline . .\noperator: onError(logCause)\ninner error lifecycle: . . . . log |\noutput values: . a . !offline . .",
    source: "packages/fx/src/Fx/combinators/onError.ts",
    explanation: "Runs cleanup after the source reports a failure cause.",
    lifecycle:
      "The original cause is delivered downstream first. Cleanup runs only if that downstream `onFailure` Effect succeeds; if the sink itself fails or interrupts, `flatMap` never reaches cleanup. Typed cleanup failure is impossible by signature, but `Effect.ignore` does not suppress defects or interruption: either can fail or interrupt the run after the source Cause was handled. Its services are required for the subscription, and it does not run after success.",
    category: "Observing failures",
  },
  {
    name: "onExit",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: onExit(recordExit)\ncovers: onExit\ninput source: ^ a b | .\noperator: onExit(recordExit)\ninner lifecycle: . . . finalize |\noutput values: . a b . |",
    explanation:
      "Pass the actual Exit to cleanup after the run; this lane depicts a successful Exit.",
    source: "packages/fx/src/Fx/combinators/onExit.ts",
    lifecycle:
      "The finalizer runs once after successful completion, a reported source cause, or interruption of the running fiber. The success Exit carries `void` because an Fx may emit many values and has no single terminal success value. A finalizer failure after normal completion is reported in the returned error channel. After a source failure or interruption it is suppressed so the already-observed termination remains authoritative. Finalizer services live for the subscription only.",
    category: "Resource lifetime",
  },
  {
    name: "onInterrupt",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: onInterrupt forwards prior values and runs cancellation cleanup only for interruption\ncovers: onInterrupt\ninput source: ^ a . x .\noperator: onInterrupt(abort)\ninner interruption lifecycle: . . . abort |\noutput values: . a . . x",
    source: "packages/fx/src/Fx/combinators/onInterrupt.ts",
    explanation:
      "Runs a finalizer when the Fx reports or externally receives interruption.",
    lifecycle:
      "An interrupt-only Cause reported by the source invokes the finalizer before that Cause is delivered; finalizer failure is combined with it. External interruption of the running fiber also invokes the finalizer, suppressing its failure to preserve cancellation. Those paths are tracked separately: if an external interruption arrives while reported-Cause handling is still active, the finalizer can run once for each path. Successful and non-interrupt failures do not invoke it. A finalizer captured while constructing an Fx is shared by every run of that Fx; create mutable cleanup state lazily inside `gen` or `genScoped` when each subscription must own a distinct resource.",
    category: "Resource lifetime",
  },
  {
    name: "pairwise",
    guide: "fx-stateful-transforms",
    diagram:
      "title: pairwise waits for a prior value, then emits adjacent transitions\ncovers: pairwise\ninput: received . packed . shipped |\noperator: pairwise\noutput: . . [received,packed] . [packed,shipped] |",
    source: "packages/fx/src/Fx/combinators/pairwise.ts",
    explanation:
      "Emits consecutive pairs `[previous, current]`. The first value is not emitted until a second value arrives. Equivalent to RxJS `pairwise` and Effect `Stream.sliding(2)` for pairs.",
    lifecycle:
      "The previous-value cell belongs to one run of the returned Fx and is discarded when that run completes or is interrupted. Source errors and services are unchanged.",
    category: "Stateful transforms",
  },
  {
    name: "periodic",
    guide: "building-fx",
    explanation:
      "One-second slots: the first void tick follows the first period. Consumer interruption cancels future ticks.",
    diagram:
      'title: periodic("2 seconds")\ncovers: periodic\ninput consumer: ^ . . . . x\noutput: . . void . void x\noperator: periodic("2 seconds")',
    source: "packages/fx/src/Fx/constructors/periodic.ts",
    lifecycle:
      "Construction starts no clock. A run waits `period` before the first emission and again between every subsequent emission. The run fiber owns the schedule; no ticks continue after interruption.",
    category: "Time and rate",
  },
  {
    name: "prepend",
    guide: "composing-fx",
    diagram:
      "title: prepend(start)\ncovers: prepend\ninput values: . value-1 value-2 | .\noperator: prepend(start)\noutput: start value-1 value-2 |",
    explanation: "Deliver the start value before subscribing to the source.",
    source: "packages/fx/src/Fx/combinators/continueWith.ts",
    lifecycle:
      "The value is emitted exactly once before the source run starts, then every source success or failure is delivered. Interruption or a defect in the Sink's prepended-value handler prevents the source from starting. The operation acquires no resource and retains source failure, services, and lifetime.",
    category: "Combining sources",
  },
  {
    name: "provide",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: provide acquires a Layer before forwarding the source values and releases it afterward\ncovers: provide\ninput source: . . ^ a b | .\noperator: provide(MarketFeedLive)\ninner service Layer: ^ build ready . . release |\noutput values: . . . a b . |",
    source: "packages/fx/src/Fx/combinators/provide.ts",
    explanation:
      "Builds a Layer for each subscription and provides it to the entire Fx run.",
    lifecycle:
      "Each subscription creates a private Scope and builds the Layer inside it before the source starts. A build failure is sent to the sink and the source never runs. Otherwise the built Context is available to every source Effect, and the Scope closes with the source's success, failure, defect, or interruption. Provided services are removed from `R`; Layer dependencies and errors are added.",
    category: "Providing services",
  },
  {
    name: "provideContext",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: provideContext(context)\ncovers: provideContext\ninput source: ^ a b |\noperator: provideContext(context)\ninner existing service: ready ready ready ready\noutput values: . a b |",
    explanation:
      "Use the caller-owned context without acquiring or releasing its service instances.",
    source: "packages/fx/src/Fx/combinators/provide.ts",
    lifecycle:
      "The Context is captured when this combinator is created and reused for each subscription. Its services are available to all source Effects and removed from `R`. This function does not acquire or release those service values; their owner must keep them valid for every subscription that uses the result. Source completion, failure, and interruption are unchanged.",
    category: "Providing services",
  },
  {
    name: "provideService",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: provideService(Config, config)\ncovers: provideService\ninput source: ^ a b |\noperator: provideService(Config, config)\ninner existing service: ready ready ready ready\noutput values: . a b |",
    explanation:
      "Insert one caller-owned service instance; other requirements remain.",
    source: "packages/fx/src/Fx/combinators/provide.ts",
    lifecycle:
      "The service value is captured and reused for every subscription. It is not acquired or finalized here; its caller owns its lifetime. The matching service identifier is removed from `R`, while values, errors, ordering, and interruption remain those of the source.",
    category: "Providing services",
  },
  {
    name: "provideServiceEffect",
    guide: "fx-services-and-lifetime",
    diagram:
      "title: provideServiceEffect runs one service Effect before forwarding the source values\ncovers: provideServiceEffect\ninput source: . . ^ a b |\noperator: provideServiceEffect(Config, makeConfig)\ninner service effect: ^ acquire ready . . |\noutput values: . . . a b |",
    source: "packages/fx/src/Fx/combinators/provide.ts",
    explanation: "Acquires one service with an Effect before running the Fx.",
    lifecycle:
      "The service Effect runs once per subscription while `provide` builds its Layer. A failure prevents the source from starting. On success, the service is available for the whole source run and its identifier is removed from `R`; acquisition errors and every requirement in `R2` are added. In particular, an `Effect.acquireRelease` service Effect still leaves `Scope.Scope` in the returned Fx requirements—the private Layer Scope does not erase that public requirement. The caller must provide that Scope.",
    category: "Providing services",
  },
  {
    name: "race",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: race cancels slow once fast emits first\ncovers: race\ninput competitors: slow+fast . . |\noperator: race(slow, fast)\ninner slow: ^ x . .\ninner fast: ^ fast |\noutput: . fast |",
    source: "packages/fx/src/Fx/combinators/race.ts",
    explanation:
      "Runs two streams concurrently until one emits, then mirrors the winner and interrupts the other. A failure or completion from one side before the other emits does **not** win unless every side ends without emitting. After a winner is chosen, that stream's later failures are propagated.",
    lifecycle:
      "Before a winner, a non-interruption failure is remembered but does not win; it is reported only if both inputs end without a value. After selection, winner failures are forwarded. Both environments remain required. The observing fiber owns both child fibers and interruption cancels the race and finalizers.",
    category: "Concurrent work",
  },
  {
    name: "raceAll",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: raceAll keeps fast and cancels the other candidates\ncovers: raceAll\ninput candidates: slow+fast+mid . . |\noperator: raceAll(slow, fast, mid)\ninner slow: ^ x . .\ninner fast: ^ fast |\ninner mid: ^ x . .\noutput: . fast |",
    source: "packages/fx/src/Fx/combinators/race.ts",
    explanation:
      "Races many streams: the first to emit wins and the rest are interrupted.",
    lifecycle:
      "Before selection, the first non-interruption failure is retained and reported only if every input ends without emitting. After selection, winner failures are forwarded. All environments are required. Losers are interrupted and the observing fiber owns cleanup for every child.",
    category: "Concurrent work",
  },
  {
    name: "repeat",
    guide: "fx-time-and-rate",
    diagram:
      "title: repeat starts a fresh run only after the previous run completes\ncovers: repeat\ninput source: ^ poll |\noperator: repeat(Schedule.recurs(2))\ninner repeat-1: . . ^ poll |\ninner repeat-2: . . . . ^ poll |\noutput: . poll . poll . poll |",
    source: "packages/fx/src/Fx/combinators/repeat.ts",
    explanation:
      "Repeats the entire stream according to `schedule` after each successful completion. Failures are not repeated. `Schedule.recurs(n)` runs the stream `n + 1` times (the original plus `n` repeats), matching Effect `Stream.repeat`.",
    lifecycle:
      "Runs are strictly sequential. Every source value is forwarded before the Schedule is stepped with `void`; a successful step sleeps as configured and starts a new source run. A source failure stops immediately and is never repeated. Schedule failure is forwarded; Schedule completion ends normally. Interruption cancels the active source or schedule sleep. No runs overlap.",
    category: "Time and rate",
  },
  {
    name: "result",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: result materializes values and the terminal Cause without failing\ncovers: result\ninput source: ^ guide . !offline\noperator: result\noutput: . Result.succeed(guide) . Result.fail(Cause(offline)) |",
    source: "packages/fx/src/Fx/combinators/result.ts",
    explanation:
      "Materializes success and failure of an Fx as `Result` values. - **Success**: each emitted value is wrapped as `Result.succeed(value)`. - **Failure**: any failure (including typed error, defect, and interrupt) is materialized as `Result.fail(cause)`. The output error type is `Cause<E>`, so defects and interrupts are explicitly represented in the `Result` and the resulting Fx has error type `never`. The resulting Fx never fails at the stream level; all outcomes are emitted as `Result<A, Cause<E>>`. Consumers can use `Result.match` or `Result.isSuccess` / `Result.isFailure` to handle success vs failure (including defect/interrupt).",
    lifecycle:
      "Each source value emits one successful Result in order. A terminal cause emits one failed Result and ends normally. The source is subscribed once; no resource is acquired and an interrupt reported by the source becomes data, although interrupting the outer running fiber still stops the run.",
    category: "Errors and recovery",
  },
  {
    name: "retry",
    guide: "fx-errors-and-recovery",
    diagram:
      "title: retry retains prior deliveries and resubscribes after a typed failure\ncovers: retry\ninput attempt 1: ^ partial !offline\ninput attempt 2: . . . ^ . ready |\noperator: retry(Schedule.recurs(1))\noutput: . partial . . . ready |",
    source: "packages/fx/src/Fx/combinators/retry.ts",
    explanation:
      "Retries the entire stream when its Cause contains a typed `Fail` accepted by `schedule`. The schedule is reset as soon as the first element of an attempt is emitted, matching Effect `Stream.retry`.",
    lifecycle:
      "Attempts are sequential and reuse the same downstream sink. The first Fail found anywhere in the Cause is offered to the Schedule, so a composite Cause containing that Fail can be retried even when it also contains defects or interrupts; starting a new attempt discards the whole prior Cause. A Cause without a Fail terminates immediately. Schedule completion re-emits the last source Cause, while Schedule failure terminates with its own cause. Emitting any value resets the Schedule. External interruption cancels the active attempt or backoff sleep.",
    category: "Errors and recovery",
  },
  {
    name: "runFork",
    guide: "consuming-fx",
    explanation:
      "Start draining immediately at the runtime boundary and return a Fiber handle.",
    diagram:
      "title: runFork(source)\ncovers: runFork\ninput call: ^ . . .\ninner source: . a b |\noutput return: Fiber\noperator: runFork(source)",
    source: "packages/fx/src/Fx/run/fork.ts",
    lifecycle:
      "`runFork` starts immediately on Effect's default runtime, so it only accepts an `Fx` with no unsupplied services. The returned root fiber owns the subscription and must be interrupted by the caller when the source should stop. Values are discarded; failures appear on the fiber and `RunOptions` controls the runtime launch.",
    category: "Running effects",
  },
  {
    name: "runPromise",
    guide: "consuming-fx",
    explanation:
      "Start draining at the runtime boundary; resolve after completion, or reject if it fails.",
    diagram:
      "title: runPromise(source)\ncovers: runPromise\ninput call: ^ . . . .\ninner source: . a b | .\noutput Promise: . . . resolved:void |\noperator: runPromise(source)",
    source: "packages/fx/src/Fx/run/runPromise.ts",
    lifecycle:
      "Calling it starts the source immediately on Effect's default runtime, so the `Fx` cannot require services. The root fiber owns the subscription until completion; `RunOptions` controls launch and cancellation. Values are discarded. Typed failures, defects, and interruption reject according to Effect's `runPromise` semantics.",
    category: "Running effects",
  },
  {
    name: "runPromiseExit",
    guide: "consuming-fx",
    explanation:
      "Always resolve the Promise with an Exit, including a failure Exit rather than a rejected Promise.",
    diagram:
      "title: runPromiseExit(source)\ncovers: runPromiseExit\ninput call: ^ . . . .\ninner source: . a !offline . .\noutput Promise: . . . Exit.fail(offline) |\noperator: runPromiseExit(source)",
    source: "packages/fx/src/Fx/run/runPromise.ts",
    lifecycle:
      "Calling `runPromiseExit` starts the source immediately on Effect's default runtime, so all services must already be eliminated. The root fiber owns the source until it completes; `RunOptions` can supply cancellation. Values are discarded. The Promise always resolves with an `Exit`, including failure and interruption.",
    category: "Running effects",
  },
  {
    name: "sample",
    guide: "composing-fx",
    diagram:
      "title: sample reads the latest source value on each sampler tick\ncovers: sample\ninput values: value-1 . value-2 . |\ninput sampler: . tick . tick x\noperator: sample(values, sampler)\noutput: . value-1 . value-2 |",
    source: "packages/fx/src/Fx/combinators/sample.ts",
    explanation:
      "Emits the latest source value whenever `sampler` emits. Source values that arrive between sampler ticks are not forwarded until the next tick. **Completion:** Completes when the source completes. **Errors:** The first failure from either stream fails the result.",
    lifecycle:
      "One latest-value cell and a child sampler fiber belong to each run. Source completion interrupts the sampler; any failure or consumer interruption stops both and releases the retained value.",
    category: "Time and rate",
  },
  {
    name: "scan",
    guide: "fx-stateful-transforms",
    diagram:
      "title: scan emits its seed and every accumulated value\ncovers: scan\ninput: . 12 . -4 . 7 |\noperator: scan(100, add)\noutput: 100 112 . 108 . 115 |",
    source: "packages/fx/src/Fx/combinators/scan.ts",
    explanation:
      "Scans the stream with a pure function, emitting the accumulated state after each element. Emits the initial value first, then for each input `a` emits `f(state, a)` and updates state. Semantics align with Effect Stream's `scan`: output is `initial`, `f(initial, a1)`, `f(..., a2)`, ...",
    lifecycle:
      "Each run owns an independent accumulator and releases it when the run ends. The pure reducer acquires no resources and preserves source failures, services, and interruption.",
    category: "Stateful transforms",
  },
  {
    name: "scanEffect",
    guide: "fx-stateful-transforms",
    diagram:
      "title: scanEffect emits each accumulated value when its reducer Effect resolves\ncovers: scanEffect\ninput: . 12 . -4 . 7 . |\noperator: scanEffect(100, oneTurnAdd)\noutput: 100 . 112 . 108 . 115 |",
    source: "packages/fx/src/Fx/combinators/scan.ts",
    explanation:
      "Scans the stream with an effectful function, emitting the accumulated state after each element. Emits the initial value first, then for each input `a` runs `f(state, a)` and emits the resulting state.",
    lifecycle:
      "One mutable accumulator is owned per run. Reducer Effects inherit producer concurrency and use the captured services. Failure is delivered to the Sink without committing that transition; interruption follows the invoking callback rather than locking the entire run.",
    category: "Stateful transforms",
  },
  {
    name: "Service",
    guide: "building-fx",
    explanation:
      "Defining the service class is inert. Running it looks up the provided Fx and delegates delivery; a missing service is a defect.",
    diagram:
      'title: Service<Feed, Quote>()("Feed")\ncovers: Service\ninput subscription: ^ . . . .\ninner context lookup: Feed=quotes |\ninner quotes: . ^ q1 q2 |\noutput: . . q1 q2 |\noperator: Service<Feed, Quote>()("Feed")',
    source: "packages/fx/src/Fx/Fx.ts",
    lifecycle:
      "Defining the class starts no work. `Class.make` acquires the producer when its layer is built, supplies the acquisition context to it, and binds its lifetime to the layer scope. Running the class reads the currently installed implementation.",
    category: "Providing services",
  },
  {
    name: "since",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: since opens when its named start signal emits\ncovers: since\ninput events: . draft . saved |\ninput start: . . open |\noperator: since(events, start)\noutput: . . . saved |",
    source: "packages/fx/src/Fx/combinators/since.ts",
    explanation: "Drops `events` until `signal` emits, then forwards the rest.",
    lifecycle:
      "Event and signal runs share a child Scope. The signal observer fiber is forked but never joined: a signal failure ends that fiber and is discarded rather than delivered to the event Sink, so it does not stop events. Event completion closes the Scope; consumer interruption stops both runs.",
    category: "Time and rate",
  },
  {
    name: "skip",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: skip removes only its fixed prefix\ncovers: skip\ninput: banner connected indexing |\noperator: skip(1)\noutput: . connected indexing |",
    source: "packages/fx/src/Fx/combinators/skip.ts",
    explanation: "Skips the first `n` elements of an Fx.",
    lifecycle:
      "A counter is local to each run and no resource is acquired. Completion, failure, services, and interruption otherwise follow the source.",
    category: "Selecting values",
  },
  {
    name: "skipEffect",
    guide: "fx-selection-and-cardinality",
    explanation:
      "Resolve the bound Effect before subscribing; then apply the resolved prefix or window. Acquisition failure prevents source work.",
    diagram:
      "title: skipEffect(loadCount)\ncovers: skipEffect\ninput bounds: ^ . ready |\ninner source: . . . banner connected indexing |\noutput: . . . . connected indexing |\noperator: skipEffect(loadCount)",
    source: "packages/fx/src/Fx/combinators/skip.ts",
    lifecycle:
      "The count Effect runs once per run and can fail, require services, or be interrupted. The source is acquired only after the count succeeds.",
    category: "Selecting values",
  },
  {
    name: "skipRepeats",
    guide: "fx-stateful-transforms",
    diagram:
      "title: skipRepeats\ncovers: skipRepeats\ninput: received received packed packed shipped |\noperator: skipRepeats\noutput: received . packed . shipped |",
    explanation:
      "Keep the first value and drop only consecutive Effect-equal values.",
    source: "packages/fx/src/Fx/combinators/skipRepeats.ts",
    lifecycle:
      "One previous value is retained for each run and released when it ends. The operation owns no external resource and preserves source errors, services, and interruption.",
    category: "Selecting values",
  },
  {
    name: "skipRepeatsWith",
    guide: "fx-stateful-transforms",
    explanation:
      "Compare against the last emitted value using the supplied equivalence; a changed payload with the same id is suppressed.",
    diagram:
      "title: skipRepeatsWith(sameId)\ncovers: skipRepeatsWith\ninput: {id:a,v:1} {id:a,v:2} {id:b,v:3} |\noutput: {id:a,v:1} . {id:b,v:3} |\noperator: skipRepeatsWith(sameId)",
    source: "packages/fx/src/Fx/combinators/skipRepeatsWith.ts",
    lifecycle:
      "The per-run previous-value state is updated atomically and released when observation ends. The pure equivalence adds no failures or services and acquires no resource.",
    category: "Selecting values",
  },
  {
    name: "skipWhile",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: skipWhile(isBanner)\ncovers: skipWhile\ninput: banner banner connected indexing |\noperator: skipWhile(isBanner)\noutput: . . connected indexing |",
    explanation:
      "Skips elements from an Fx while a predicate returns true. Emits from the first element for which the predicate returns false (including that element) and all following elements.",
    source: "packages/fx/src/Fx/combinators/skipWhile.ts",
    lifecycle:
      "One boolean gate is owned by each run and then discarded. No resource is acquired and source errors, services, and interruption are preserved.",
    category: "Selecting values",
  },
  {
    name: "skipWhileEffect",
    guide: "fx-selection-and-cardinality",
    explanation:
      "Each predicate Effect takes one turn in this serialized source. Its failure is forwarded rather than treated as false. The predicate still runs after the gate opens.",
    diagram:
      "title: skipWhileEffect(oneTurnCheck)\ncovers: skipWhileEffect\ninput: banner . banner . connected . indexing . |\ninner predicate: ^ true ^ true ^ false ^ false |\noutput: . . . . . connected . indexing |\noperator: skipWhileEffect(oneTurnCheck)",
    source: "packages/fx/src/Fx/combinators/skipWhile.ts",
    lifecycle:
      "The gate belongs to one run, while predicate invocation inherits the producer's ordering and concurrency. Predicate failure is delivered even after the gate opened; services remain required and interruption cancels whichever callback Effects the producer attached to the run.",
    category: "Selecting values",
  },
  {
    name: "slice",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: slice keeps one bounded index window and then completes\ncovers: slice\ninput: banner connected indexing complete ignored |\noperator: slice({ skip: 1, take: 2 })\noutput: . connected indexing | . .",
    source: "packages/fx/src/Fx/combinators/slice.ts",
    explanation:
      "Slices an Fx by skipping a number of elements and then taking a number of elements.",
    lifecycle:
      "Counters are local to one run. Early completion stops upstream work; otherwise source failure, services, and consumer interruption are forwarded.",
    category: "Selecting values",
  },
  {
    name: "sliceEffect",
    guide: "fx-selection-and-cardinality",
    explanation:
      "Resolve the bound Effect before subscribing; then apply the resolved prefix or window. Acquisition failure prevents source work.",
    diagram:
      "title: sliceEffect(loadBounds)\ncovers: sliceEffect\ninput bounds: ^ . ready |\ninner source: . . . banner connected indexing complete ignored |\noutput: . . . . connected indexing | . .\noperator: sliceEffect(loadBounds)",
    source: "packages/fx/src/Fx/combinators/slice.ts",
    lifecycle:
      "The bounds Effect runs once per consumer. If it fails or is interrupted the source never starts; after success, ordinary `slice` owns only its per-run counters.",
    category: "Selecting values",
  },
  {
    name: "struct",
    guide: "composing-fx",
    diagram:
      "title: struct({ query, filter })\ncovers: struct\ninput query: effect . effect-v4 . . |\ninput filter: . guides . . api |\noperator: struct({ query, filter })\noutput: . {q:effect,f:guides} {q:v4,f:guides} . {q:v4,f:api} |",
    explanation:
      "The latest-value join preserves field names rather than tuple positions.",
    source: "packages/fx/src/Fx/combinators/tuple.ts",
    lifecycle:
      "It delegates concurrent ownership and retained latest values to `tuple`. Input failures and services are unioned, and all runs end with the consuming Fx.",
    category: "Combining sources",
  },
  {
    name: "succeed",
    guide: "building-fx",
    explanation:
      "Stores a value at construction; each run delivers it once and returns.",
    diagram:
      "title: succeed(42)\ncovers: succeed\ninput subscription: ^ . .\noutput: . 42 |\noperator: succeed(42)",
    source: "packages/fx/src/Fx/constructors/succeed.ts",
    lifecycle:
      "Construction stores the value. Each run offers it exactly once, waits for the sink handler, and completes without acquiring resources.",
    category: "Value sources",
  },
  {
    name: "succeedNull",
    guide: "building-fx",
    explanation:
      "Deliver one null value and complete. This is a value pulse, distinct from empty.",
    diagram:
      "title: succeedNull\ncovers: succeedNull\ninput subscription: ^ . .\noutput: . null |\noperator: succeedNull",
    source: "packages/fx/src/Fx/constructors/succeed.ts",
    lifecycle: "Each run performs one sink delivery and acquires no resources.",
    category: "Value sources",
  },
  {
    name: "succeedUndefined",
    guide: "building-fx",
    explanation:
      "Deliver one undefined value and complete. This is a value pulse, distinct from empty.",
    diagram:
      "title: succeedUndefined\ncovers: succeedUndefined\ninput subscription: ^ . .\noutput: . undefined |\noperator: succeedUndefined",
    source: "packages/fx/src/Fx/constructors/succeed.ts",
    lifecycle: "Each run performs one sink delivery and acquires no resources.",
    category: "Value sources",
  },
  {
    name: "succeedVoid",
    guide: "building-fx",
    explanation:
      "Deliver one void value and complete. This is a value pulse, distinct from empty.",
    diagram:
      "title: succeedVoid\ncovers: succeedVoid\ninput subscription: ^ . .\noutput: . void |\noperator: succeedVoid",
    source: "packages/fx/src/Fx/constructors/succeed.ts",
    lifecycle: "Each run performs one sink delivery and acquires no resources.",
    category: "Value sources",
  },
  {
    name: "suspend",
    guide: "building-fx",
    explanation:
      "Evaluate the source factory lazily for each run; then forward its selected source.",
    diagram:
      "title: suspend(chooseSource)\ncovers: suspend\ninput subscription: ^ . . . .\ninner factory: choose |\ninner selected: . ^ a b |\noutput: . . a b |\noperator: suspend(chooseSource)",
    source: "packages/fx/src/Fx/constructors/suspend.ts",
    lifecycle:
      "`fx` is not evaluated during construction. It is evaluated once per run inside `Effect.suspend`; thrown exceptions become Effect defects, and the returned producer is owned and interrupted as part of that same run.",
    category: "Value sources",
  },
  {
    name: "switchMap",
    guide: "fx-higher-order-and-concurrency",
    diagram:
      "title: switchMap interrupts the old inner exactly when its replacement arrives\ncovers: switchMap\ninput: a . b . . . |\noperator: switchMap(preview)\ninner a: ^ a1 x . . . .\ninner b: . . ^ b1 . b2 |\noutput: . a1 . b1 . b2 |",
    source: "packages/fx/src/Fx/combinators/switchMap.ts",
    explanation:
      "Maps each element of an Fx to a new Fx, and switches to the latest inner Fx. When a new element is emitted, the previous inner Fx is cancelled.",
    lifecycle:
      "Source and current-inner failures are forwarded and their services remain typed. The returned Fx requires `Scope`, which owns the current inner fiber. Source completion waits for the latest inner. Replacing or interrupting the output closes obsolete inner work and runs its scoped finalizers before the replacement proceeds.",
    category: "Concurrent work",
  },
  {
    name: "switchMapEffect",
    guide: "fx-higher-order-and-concurrency",
    explanation: "b interrupts pending a; only b finishes and emits.",
    diagram:
      "title: switchMapEffect(preview)\ncovers: switchMapEffect\ninput: a . b | . .\ninner preview-a: ^ . x . . .\ninner preview-b: . . ^ . B |\noutput: . . . . B |\noperator: switchMapEffect(preview)",
    source: "packages/fx/src/Fx/combinators/switchMapEffect.ts",
    lifecycle:
      "Source and current callback failures remain typed and callback services are added to requirements. The required `Scope` owns the current Effect. Source completion waits for it; replacement and output interruption run its finalizers before relinquishing the lifetime.",
    category: "Concurrent work",
  },
  {
    name: "sync",
    guide: "building-fx",
    explanation: "The thunk is evaluated anew for each run; this run reads 7.",
    diagram:
      "title: sync(readNow)\ncovers: sync\ninput subscription: ^ . . .\ninner thunk: . read=7 |\noutput: . . 7 |\noperator: sync(readNow)",
    source: "packages/fx/src/Fx/constructors/sync.ts",
    lifecycle:
      "Construction performs no work. Each run evaluates `evaluate` exactly once in the run's fiber, emits its result, and completes after the Sink handles it. A thrown exception is an Effect defect; use `Fx.fromEffect(Effect.try(...))` when failure is expected and belongs in the typed error channel.",
    category: "Value sources",
  },
  {
    name: "take",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: take completes after its fixed prefix\ncovers: take\ninput: banner connected indexing |\noperator: take(2)\noutput: banner connected | .",
    source: "packages/fx/src/Fx/combinators/take.ts",
    explanation: "Takes the first `n` elements from an Fx and then completes.",
    lifecycle:
      "A per-run counter owns no external resource. Reaching the limit interrupts/stops upstream work; source failures before that point and consumer interruption remain observable.",
    category: "Selecting values",
  },
  {
    name: "takeEffect",
    guide: "fx-selection-and-cardinality",
    explanation:
      "Resolve the bound Effect before subscribing; then apply the resolved prefix or window. Acquisition failure prevents source work.",
    diagram:
      "title: takeEffect(loadCount)\ncovers: takeEffect\ninput bounds: ^ . ready |\ninner source: . . . banner connected indexing |\noutput: . . . banner connected | .\noperator: takeEffect(loadCount)",
    source: "packages/fx/src/Fx/combinators/take.ts",
    lifecycle:
      "The count Effect can fail, require services, or be interrupted; in those cases upstream never starts. After success, reaching the limit stops upstream work.",
    category: "Selecting values",
  },
  {
    name: "takeUntil",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: takeUntil(isComplete)\ncovers: takeUntil\ninput: connected indexing complete ignored |\noperator: takeUntil(isComplete)\noutput: connected indexing | . .",
    explanation:
      "Takes elements from an Fx until a predicate returns true. The element that satisfies the predicate is not included in the output.",
    source: "packages/fx/src/Fx/combinators/takeUntil.ts",
    lifecycle:
      "Matching triggers the sink's early-exit path, stopping upstream work. No resources are acquired; earlier failures and consumer interruption remain observable.",
    category: "Selecting values",
  },
  {
    name: "takeUntilEffect",
    guide: "fx-selection-and-cardinality",
    explanation:
      "Each predicate Effect takes one turn in this serialized source. Its failure is forwarded rather than treated as false. The boundary input is excluded and the source stops.",
    diagram:
      "title: takeUntilEffect(oneTurnCheck)\ncovers: takeUntilEffect\ninput: connected . indexing . complete . ignored . |\ninner predicate: ^ false ^ false ^ true | . .\noutput: . connected . indexing . | . . .\noperator: takeUntilEffect(oneTurnCheck)",
    source: "packages/fx/src/Fx/combinators/takeUntil.ts",
    lifecycle:
      "Predicate effects run in the consumer and expose their failures and services. A match or interruption stops upstream and cancels active work.",
    category: "Selecting values",
  },
  {
    name: "takeWhile",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: takeWhile(isInProgress)\ncovers: takeWhile\ninput: connected indexing complete ignored |\noperator: takeWhile(isInProgress)\noutput: connected indexing | . .",
    explanation:
      "Takes elements from an Fx while a predicate returns true. Stops at the first element for which the predicate returns false; that element is not included.",
    source: "packages/fx/src/Fx/combinators/takeWhile.ts",
    lifecycle:
      "A false result stops upstream immediately. The pure predicate acquires no resources and adds no failures or services.",
    category: "Selecting values",
  },
  {
    name: "takeWhileEffect",
    guide: "fx-selection-and-cardinality",
    explanation:
      "Each predicate Effect takes one turn in this serialized source. Its failure is forwarded rather than treated as false. The boundary input is excluded and the source stops.",
    diagram:
      "title: takeWhileEffect(oneTurnCheck)\ncovers: takeWhileEffect\ninput: connected . indexing . complete . ignored . |\ninner predicate: ^ true ^ true ^ false | . .\noutput: . connected . indexing . | . . .\noperator: takeWhileEffect(oneTurnCheck)",
    source: "packages/fx/src/Fx/combinators/takeWhile.ts",
    lifecycle:
      "Predicate effects expose their failures and services and are interrupted with the run. A false result stops upstream; no independent fiber or buffer is retained.",
    category: "Selecting values",
  },
  {
    name: "tap",
    guide: "transforming-fx",
    explanation:
      "The observation Effect finishes before its original payload is forwarded. Concurrent producers can overlap callback Effects; these rows assume serial delivery.",
    diagram:
      "title: tap(oneTurnCallback)\ncovers: tap\ninput: 1 . 2 . 3 . |\ninner callback: ^ done ^ done ^ done |\noutput: . 1 . 2 . 3 |\noperator: tap(oneTurnCallback)",
    source: "packages/fx/src/Fx/combinators/tapEffect.ts",
    lifecycle:
      "Returned Effects run in the consumer path and are interrupted with it; a `void` callback is treated as `Effect.void`. Callback failures and services remain visible in the result type.",
    category: "Transforming values",
  },
  {
    name: "throttle",
    guide: "fx-time-and-rate",
    diagram:
      "title: throttle keeps leading and trailing values in a 100ms window (50ms slots)\ncovers: throttle\ninput: t ty . . next . . |\noperator: throttle({ duration: 100ms, leading: true, trailing: true })\noutput: t . ty . next . . |",
    source: "packages/fx/src/Fx/combinators/throttle.ts",
    explanation:
      "Limits emissions to configured leading and trailing edges of fixed windows. Pass `{ duration, leading, trailing }` for trailing or both-edge behavior. A duration alone defaults to `{ leading: true, trailing: false }`.",
    lifecycle:
      "The first value opens a window. Leading mode emits it immediately. Values arriving while open replace one pending latest value; trailing mode emits that value when the timer closes, except that both-edge mode does not repeat the first value unless another arrived. Windows never overlap. Source errors propagate, source completion waits for the active window, and interruption stops the scoped timer and discards pending state.",
    category: "Time and rate",
  },
  {
    name: "timeout",
    guide: "fx-time-and-rate",
    diagram:
      "title: timeout completes normally after two seconds of silence (1s slots)\ncovers: timeout\ninput source: ^ beat beat . x\ninput timeout: ^ . . . |\noperator: timeout(2 seconds)\noutput: . beat beat . |",
    source: "packages/fx/src/Fx/combinators/timeout.ts",
    explanation:
      "Completes the stream if it does not produce a value (or complete) within `duration` of the previous event. Matches Effect `Stream.timeout`. The timeout is reset after each emission. An infinite duration is a no-op; a zero duration completes immediately.",
    lifecycle:
      "Subscription starts the source and one scoped timer. Each delivered value forwards immediately and rearms the timer. If the timer wins, it interrupts the source and the result completes; the interrupt caused by that timeout is not forwarded. Source failure before the deadline propagates. Interruption clears both source fiber and timer. Infinite duration returns the source; zero duration never starts it.",
    category: "Time and rate",
  },
  {
    name: "timeoutTo",
    guide: "fx-time-and-rate",
    diagram:
      "title: timeoutTo cancels the source and hands off to its fallback\ncovers: timeoutTo\ninput source: ^ beat beat . x\ninput timeout: ^ . . . |\ninner fallback: . . . . ^ offline |\noperator: timeoutTo(2 seconds, fallback)\noutput: . beat beat . . offline |",
    source: "packages/fx/src/Fx/combinators/timeout.ts",
    explanation:
      "Switches to `fallback` if the source does not produce a value within `duration` of the previous event. Matches Effect `Stream.timeoutOrElse` and RxJS `timeoutTo`.",
    lifecycle:
      "The source and resettable timer start first. On timeout the source is interrupted, then one fallback subscription starts; the two producers never overlap. A source failure before timeout propagates and does not start the fallback. Interruption stops the active producer and timer. Infinite duration returns the source unchanged; zero duration returns the fallback without starting the source.",
    category: "Time and rate",
  },
  {
    name: "toStream",
    guide: "building-fx",
    explanation:
      "Adapt push deliveries through a scoped queue for Stream consumption; this trace assumes capacity is available and the reader keeps up.",
    diagram:
      "title: toStream(fx)\ncovers: toStream\ninput Fx values: a . b |\ninput Stream pulls: . pull . pull pull\noutput Stream elements: . a . b |\noperator: toStream(fx)",
    source: "packages/fx/src/Fx/stream.ts",
    lifecycle:
      "Conversion is lazy. Running the Stream allocates the callback queue and runs the `Fx`; the Stream's scope owns both. Interruption closes the callback subscription through Effect Stream's lifecycle. Buffering follows `options`.",
    category: "Stream interop",
  },
  {
    name: "tuple",
    guide: "composing-fx",
    diagram:
      "title: tuple(query, filter)\ncovers: tuple\ninput query: effect . effect-v4 . . |\ninput filter: . guides . . api |\noperator: tuple(query, filter)\noutput: . [effect,guides] [effect-v4,guides] . [effect-v4,api] |",
    explanation:
      "Retain one latest value per input; emit a tuple after all have initialized, then on any change.",
    source: "packages/fx/src/Fx/combinators/tuple.ts",
    lifecycle:
      "All inputs run concurrently as children of the consumer and one latest value per input is retained for that run. Failure/interruption stops the group; normal completion waits for every input.",
    category: "Combining sources",
  },
  {
    name: "undefined",
    guide: "building-fx",
    explanation:
      "Exact export alias of succeedUndefined; the trace and lifecycle are identical. Deliver one undefined value and complete. This is a value pulse, distinct from empty.",
    diagram:
      "title: succeedUndefined\ncovers: undefined\ninput subscription: ^ . .\noutput: . undefined |\noperator: undefined (alias of succeedUndefined)",
    aliasOf: "succeedUndefined",
    source: "packages/fx/src/Fx/constructors/succeed.ts",
    lifecycle: "Each run performs one sink delivery and acquires no resources.",
    category: "Value sources",
  },
  {
    name: "until",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: until stops when its named stop signal emits\ncovers: until\ninput events: draft . saved . later |\ninput stop: . . . stop |\noperator: until(events, stop)\noutput: draft . saved | . .",
    source: "packages/fx/src/Fx/combinators/until.ts",
    explanation:
      "Forwards `events` until `signal` emits, then interrupts `events`.",
    lifecycle:
      "Both sources start behind one gate in a private Scope. Event completion cancels the signal; signaling cancels events; failures are forwarded unless they are the expected cancellation.",
    category: "Time and rate",
  },
  {
    name: "unwrap",
    guide: "fx-dynamic-producers",
    diagram:
      "title: unwrap(setup)\ncovers: unwrap\ninput setup: ^ choose |\noperator: unwrap(setup)\ninner selected Fx: . . ^ a b |\noutput: . . . a b |",
    explanation:
      "Run the Effect once per subscription and flatten the Fx it returns.",
    source: "packages/fx/src/Fx/combinators/unwrap.ts",
    lifecycle:
      "Acquisition and inner failures are forwarded and both environments remain in the returned type. `unwrap` does not create a Scope or hide one: interruption stops whichever phase is active, and any resourceful Effect or inner Fx must expose and receive its own `Scope` requirement.",
    category: "Generator composition",
  },
  {
    name: "unwrapScoped",
    guide: "fx-dynamic-producers",
    diagram:
      "title: unwrapScoped keeps setup resources alive through streaming\ncovers: unwrapScoped\ninput setup: ^ acquire | . . .\noperator: unwrapScoped(setup)\ninner subscription Scope: ^ open . . . . close |\ninner selected Fx: . . . ^ a b | .\noutput: . . . . a b | .",
    source: "packages/fx/src/Fx/combinators/unwrapScoped.ts",
    explanation:
      "Unwraps an Effect that produces an Fx into a single Fx, managing the scope of the effect. The scope of the effect is closed when the Fx completes or is interrupted.",
    lifecycle:
      "Acquisition and inner failures are forwarded. Non-Scope services from both phases remain required. The opened Scope owns resources acquired by both the Effect and produced Fx; it closes after normal completion, failure, or interruption, running finalizers exactly at the observation boundary.",
    category: "Generator composition",
  },
  {
    name: "void",
    guide: "building-fx",
    explanation:
      "Exact export alias of succeedVoid; the trace and lifecycle are identical. Deliver one void value and complete. This is a value pulse, distinct from empty.",
    diagram:
      "title: succeedVoid\ncovers: void\ninput subscription: ^ . .\noutput: . void |\noperator: void (alias of succeedVoid)",
    aliasOf: "succeedVoid",
    source: "packages/fx/src/Fx/constructors/succeed.ts",
    lifecycle: "Each run performs one sink delivery and acquires no resources.",
    category: "Value sources",
  },
  {
    name: "when",
    guide: "fx-selection-and-cardinality",
    diagram:
      "title: when selects a value for each spaced condition\ncovers: when\ninput condition: true . false |\noperator: when(condition, { onTrue, onFalse })\noutput: . open . closed |",
    source: "packages/fx/src/Fx/combinators/when.ts",
    explanation:
      "Conditionally emits one of two values based on the boolean value emitted by the condition stream.",
    lifecycle:
      "It delegates branch switching to `if`; its constant branches acquire no resources. The Scope owns scheduled branch fibers, replacement awaits their interruption, and source completion waits for the latest selected branch.",
    category: "Conditional sources",
  },
  {
    name: "withLatestFrom",
    guide: "composing-fx",
    diagram:
      "title: withLatestFrom(source, state)\ncovers: withLatestFrom\ninput source: source-1 . source-2 . |\ninput state: . ready . revised |\noperator: withLatestFrom(source, state)\noutput: . . [source-2,ready] . |",
    explanation:
      "Only source pushes trigger pairs; source-1 is dropped because state is not initialized.",
    source: "packages/fx/src/Fx/combinators/withLatestFrom.ts",
    lifecycle:
      "The right source runs in a child fiber and one latest value is retained. Left completion or consumer interruption interrupts that fiber; failure from either side is forwarded.",
    category: "Combining sources",
  },
  {
    name: "withLatestFromWith",
    guide: "composing-fx",
    diagram:
      "title: withLatestFromWith(source, state, label)\ncovers: withLatestFromWith\ninput source: source-1 . source-2 . |\ninput state: . ready . revised |\noperator: withLatestFromWith(source, state, label)\noutput: . . label(source-2,ready) . |",
    explanation:
      "The combiner runs on source pushes after state initializes; a state update alone emits nothing.",
    source: "packages/fx/src/Fx/combinators/withLatestFrom.ts",
    lifecycle:
      "It inherits the child right-hand fiber and latest-value lifetime from `withLatestFrom`; the pure projection adds no failures, services, or resources.",
    category: "Combining sources",
  },
  {
    name: "withSpan",
    guide: "fx-services-and-lifetime",
    diagram:
      'title: withSpan adds trace lifetimes around an otherwise unchanged subscription\ncovers: withSpan\ninput source: ^ a b |\noperator: withSpan("market monitor")\ninner trace span: ^ . . |\ninner delivery spans: . success(a) success(b) |\noutput values: . a b |',
    source: "packages/fx/src/Fx/combinators/withSpan.ts",
    explanation:
      "Traces the whole subscription and each success or failure delivery.",
    lifecycle:
      "Every run creates an `Fx(name)` span covering the source subscription. Each `onSuccess` and `onFailure` callback executes in its own child span. Span lifetime follows the Effects exactly; interruption closes active spans. Options are forwarded to all three span kinds, and no service requirement or failure is added beyond the configured Effect tracer.",
    category: "Observing failures",
  },
  {
    name: "zip",
    guide: "composing-fx",
    diagram:
      "title: zip(left, right)\ncovers: zip\ninput left: left-1 . left-2 . |\ninput right: . right-1 . right-2 |\noperator: zip(left, right)\noutput: . [left-1,right-1] . [left-2,right-2] |",
    explanation: "Wait for a fresh value from each side for each pair.",
    source: "packages/fx/src/Fx/combinators/zip.ts",
    lifecycle:
      "Both child runs and queues belong to the consumer. The first completion, any failure, or interruption stops both fibers and discards unmatched queued values.",
    category: "Combining sources",
  },
  {
    name: "zipLatest",
    guide: "composing-fx",
    diagram:
      "title: zipLatest(query, filter)\ncovers: zipLatest\ninput query: effect . effect-v4 . . |\ninput filter: . guides . . api |\noperator: zipLatest(query, filter)\noutput: . [effect,guides] [effect-v4,guides] . [effect-v4,api] |",
    explanation:
      "Pair current values after both initialize; either side can update the pair.",
    source: "packages/fx/src/Fx/combinators/zip.ts",
    lifecycle:
      "It delegates to `tuple`: both sources run concurrently and retain one latest value each until both complete or the consumer is interrupted.",
    category: "Combining sources",
  },
  {
    name: "zipLatestWith",
    guide: "composing-fx",
    diagram:
      "title: zipLatestWith(query, filter, search)\ncovers: zipLatestWith\ninput query: effect . effect-v4 . . |\ninput filter: . guides . . api |\noperator: zipLatestWith(query, filter, search)\noutput: . search(effect,guides) search(v4,guides) . search(v4,api) |",
    explanation: "Apply the combining function to each latest-value pair.",
    source: "packages/fx/src/Fx/combinators/zip.ts",
    lifecycle:
      "Both concurrent sources and their retained latest values are owned by the consumer. The combiner is pure; failure, services, completion, and interruption come from the inputs.",
    category: "Combining sources",
  },
  {
    name: "zipLeft",
    guide: "composing-fx",
    diagram:
      "title: zipLeft(left, right)\ncovers: zipLeft\ninput left: left-1 . left-2 . |\ninput right: . right-1 . right-2 |\noperator: zipLeft(left, right)\noutput: . left-1 . left-2 |",
    explanation:
      "Each fresh right value permits one left value; the right payload is discarded.",
    source: "packages/fx/src/Fx/combinators/additive.ts",
    lifecycle:
      "Both sources run concurrently. The first run to complete ends pairing and interrupts the other, while consumer interruption stops both. A failure Cause is delivered to the Sink but does not by itself end pairing; a producer may continue and supply a value afterward.",
    category: "Combining sources",
  },
  {
    name: "zipRight",
    guide: "composing-fx",
    diagram:
      "title: zipRight(left, right)\ncovers: zipRight\ninput left: left-1 . left-2 . |\ninput right: . right-1 . right-2 |\noperator: zipRight(left, right)\noutput: . right-1 . right-2 |",
    explanation:
      "Each fresh left value permits one right value; the left payload is discarded.",
    source: "packages/fx/src/Fx/combinators/additive.ts",
    lifecycle:
      "Both runs belong to the consumer. The first completion or consumer interruption cancels the remaining run and releases the lockstep queues. Failure is Sink delivery, not an automatic stop; pairing can continue when the failing producer remains active and later emits a value.",
    category: "Combining sources",
  },
  {
    name: "zipWith",
    guide: "composing-fx",
    diagram:
      "title: zipWith(left, right, pair)\ncovers: zipWith\ninput left: left-1 . left-2 . |\ninput right: . right-1 . right-2 |\noperator: zipWith(left, right, pair)\noutput: . pair(left-1,right-1) . pair(left-2,right-2) |",
    explanation:
      "Apply the callback once per lockstep pair; no stale right value is reused.",
    source: "packages/fx/src/Fx/combinators/zip.ts",
    lifecycle:
      "It inherits `zip`'s two child runs and unbounded unmatched-value queues. The pure combiner adds no resource, error, or service requirement.",
    category: "Combining sources",
  },
];

export const fxNonTemporalExports: ReadonlyArray<FxNonTemporalExport> = [
  {
    name: "FlatMapLike",
    source: "packages/fx/src/Fx/combinators/flatMap.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "FlatMapEffectLike",
    source: "packages/fx/src/Fx/combinators/flatMapEffect.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "KeyedOptions",
    source: "packages/fx/src/Fx/combinators/keyed.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "Bounds",
    source: "packages/fx/src/Fx/combinators/slice.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "ThrottleOptions",
    source: "packages/fx/src/Fx/combinators/throttle.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "Emit",
    source: "packages/fx/src/Fx/constructors/make.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "Fx",
    source: "packages/fx/src/Fx/Fx.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "Success",
    source: "packages/fx/src/Fx/Fx.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "Error",
    source: "packages/fx/src/Fx/Fx.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "Services",
    source: "packages/fx/src/Fx/Fx.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "ToStreamOptions",
    source: "packages/fx/src/Fx/stream.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "FromStreamOptions",
    source: "packages/fx/src/Fx/stream.ts",
    reason: "Type-level contract; no subscription or emissions.",
  },
  {
    name: "FxTypeId",
    source: "packages/fx/src/Fx/TypeId.ts",
    reason:
      "Brand symbol and its associated type; no subscription or emissions.",
  },
  {
    name: "isFx",
    source: "packages/fx/src/Fx/TypeId.ts",
    reason:
      "Synchronous brand guard; inspects a value and starts no subscription.",
  },
];
