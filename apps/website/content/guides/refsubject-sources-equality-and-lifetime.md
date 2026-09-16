---
title: "RefSubject inputs, equality, and lifetime"
summary: "Use one constructor for values, Effects, Streams, and Fx while knowing when each source starts and stops."
section: "State"
kind: "guide"
order: 2.05
---

A `RefSubject` gives its consumers a current read and an observation of later distinct changes.
After [basic RefSubject state](/explore/refsubject-renderer-independent-state), use this guide to
choose its input and understand startup, reset, equality, and ownership.

**An Effect input stays lazy after construction:** `yield* RefSubject.make(effect)` returns the ref
without running or awaiting `effect`. Its first read or observation starts the shared initializer.
This lets a component return its template while data is still pending. `yield* ref` waits for the
current value; interpolating the ref or its derived fields lets rendering observe it instead.

Calling `RefSubject.make` creates a constructor Effect. Executing it allocates the ref and its
private child Scope; the input determines what starts next:

| Input | When its source starts | Initial current read |
| --- | --- | --- |
| Regular value | No source worker | Returns the supplied value |
| Effect | First read or observation | Waits for the shared initializer |
| Fx or Stream | Construction forks one source run | Waits for its first success or expected failure |


| Need | Use | Primary contract |
| --- | --- | --- |
| Start with an existing value | [Value input](#a-regular-value-is-current-immediately) | The initial value is available immediately. |
| Load only when first read or observed | [Effect input](#an-effect-is-the-lazy-initial-value) | Construction does not run the initializer. |
| Track an ongoing producer | [Fx and Stream inputs](#fx-and-stream-begin-when-the-ref-is-constructed) | Source work begins during ref construction. |
| Reset current state | [Delete behavior](#delete-resets-the-current-slot-not-every-source) | Resetting the slot does not restart every kind of source. |
| Avoid equivalent publications | [Equality](#current-state-has-one-value-replay-and-equality-controls-publications) | Equality controls which state changes observers receive. |
| Find why a value is stale or silent | [Contract checks](#diagnose-a-stale-or-silent-value-by-checking-the-contract) | Check startup, ownership, equality, and observation. |

## A regular value is current immediately

`RefSubject.make(value)` installs that value as the first committed state when its construction
Effect runs. There is no initializer to wait for and no source worker to retain. Use this form for
ordinary local or shared state whose later changes come from named `set`, `update`, or transactional
transitions.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const makeDraftState = Effect.fn("makeDraftState")(function* () {
  const draft = yield* RefSubject.make({ title: "Untitled", body: "" })

  yield* RefSubject.update(draft, (current) => ({ ...current, title: "Typed" }))

  return yield* draft
})
```

The construction Effect still belongs to its real owner because every RefSubject can later have
observers. It does not, however, start a hidden producer merely because the initial value is plain.

## An Effect is the lazy initial value

`RefSubject.make(effect)` constructs the ref without running its input Effect. The first current read, or the
first execution of an Fx observation of the ref, starts one initializer in the ref's private Scope.
Every concurrent reader waits for that same initializer. When it succeeds, the result becomes the
current value; the input Effect is not run again merely because another reader or observer arrives.
An ordinary `set` made before a first read supplies the current value instead, so there is no need to
run the initializer just to overwrite it.

```ts
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";

let starts = 0;

const makeProfileState = Effect.gen(function* () {
  const profile = yield* RefSubject.make(
    Effect.sync(() => {
      starts += 1;

      return { name: "Ada" };
    }),
  );

  // `starts` is still 0: constructing the ref did not run the source.
  const current = yield* profile;

  // `starts` is now 1. Later reads use the retained current value.

  return { current, starts };
});
```

The source Effect supplies the initial value only. Later values come from explicit `RefSubject` writes
or from a different live source; they do not cause a completed Effect to repeat.

## Fx and Stream begin when the ref is constructed

`RefSubject.make(fx)` and `RefSubject.make(stream)` also remain lazy until their constructor Effect
is executed. Unlike an Effect input, executing that constructor immediately forks one consumption of the source into the
ref's private Scope. It does not wait for a read or observer. The first current read waits until the
source publishes either a success or an expected failure; it does **not** wait for a finite source to
finish. Each later success replaces the current value and is offered to observers.

```ts
import { Effect, Stream } from "effect";
import { Fx, RefSubject } from "@typed/fx";

const makeConnectionState = Effect.gen(function* () {
  const presence = yield* RefSubject.make(Fx.fromIterable(["connecting", "online"]));
  const events = yield* RefSubject.make(Stream.fromIterable(["opened", "ready"]));

  // Both inputs already have one owner-run. This read waits only for `presence`'s first value.
  const currentPresence = yield* presence;

  return { presence, events, currentPresence };
});
```

So a finite Fx or Stream may already have advanced beyond the value returned by a later read, and a
read that unblocks on its first value may return before further values arrive. After an input ends,
the ref retains its most recent success or failure. It does not restart when a consumer leaves and a
new consumer arrives. Construct a new ref for a fresh input run. If source execution instead must
start with the first consumer, stop with the last, and restart for the next consumer session, keep
it as `Fx` and use `Subject.share`; that is a demand-sharing policy, not a RefSubject policy.

## Delete resets the current slot, not every source

`RefSubject.delete(ref)` returns the prior current value as an `Option` and resets the ref to its
initialization state. What initializes it next depends on the input passed to `make`.

| `make` input | After `delete` |
| --- | --- |
| Regular value | The next read restores that original value. |
| Effect | The next read starts the initial Effect again, unless an initializer is already running. |
| Fx or Stream | The existing source is neither interrupted nor restarted; its next event fills the empty slot. |

Deleting an Fx or Stream ref after its source has ended does not create a fresh source run. A later
read waits for an explicit `set` or another source event that can no longer arrive. Construct a new
ref when a completed source needs a new execution. `delete` also does not interrupt an in-flight
Effect initializer; use `interrupt` only when the real owner is ending.

```ts
import { Effect, Option } from "effect"
import { RefSubject } from "@typed/fx"

let starts = 0
const loadProfile = Effect.sync(() => ({ id: ++starts }))

const reloadProfile = Effect.fn("reloadProfile")(function* () {
  const profile = yield* RefSubject.make(loadProfile)
  const first = yield* profile

  const previous = yield* RefSubject.delete(profile)
  const reloaded = yield* profile

  return { first, previous: Option.getOrUndefined(previous), reloaded }
})
```

Here `first.id` is `1` and `reloaded.id` is `2`: an Effect input is run once per initialization, not
once per read. For a plain-value ref, the same sequence restores the original value without running
user code.

## Failures stay visible; services are captured at construction

An input's expected-error type `E` is preserved by the ref. A first failure releases waiting reads
with that error and is replayed to later observers; a source is not retried automatically. A later
successful `set` can replace that stored failure just as it can replace a stored success. Defects and
interruption remain Effect causes rather than being recast as expected state values.

Its required services `R` have a different lifetime: the constructor Effect requires them and captures
their current Context; the ref's private Scope owns the initializer or live-source worker that uses
that Context. Once construction has returned the ref, reading and observing that ref no longer
requires those source services. This keeps the dependency visible at the owning boundary without
asking every consumer to provide it.

Provide the source's services at construction, in the Layer or Scope that owns the ref. Consumers
reuse the captured source Context. See [sharing a reactive capability](/explore/shared-state-contracts)
for the service and provider setup.

## Current state has one-value replay, and equality controls publications

Each ref retains one current `Exit`: its newest success or expected failure. A new observer first
receives that retained result, then follows later distinct commits. Therefore several observers of
one ref share its single initializer or its single Fx/Stream run; they do not create one source run
per consumer. `subscriberCount` reports those active observers for lifecycle diagnostics; it does
not include the ref-owned Fx or Stream source worker.

`RefSubjectOptions.eq` defines when two successful values count as the same. A value equivalent to
the prior success still becomes the value returned by a current read, but it does not advance
`version` or publish another update. Failure causes use structural Effect equality; a success and a
failure are always different. This makes equality a state contract shared by every consumer, not a
rendering shortcut.

```ts
import { Effect, Equivalence } from "effect";
import { RefSubject } from "@typed/fx";

const exerciseEquality = Effect.gen(function* () {
  const temperature = yield* RefSubject.make(
    { celsius: 20, sampledAt: 0 },
    { eq: Equivalence.make((left, right) => left.celsius === right.celsius) },
  );

  const versionBefore = yield* temperature.version;

  yield* RefSubject.set(temperature, { celsius: 20, sampledAt: 1 });

  return {
    current: yield* temperature,
    versionBefore,
    versionAfterEquivalentWrite: yield* temperature.version,
  };
});
```

Here the final current value has `sampledAt: 1`, while both versions are equal and observers receive
no second publication. The default equality is Effect's `Equal.equals`; choose a custom equivalence
only when it is the domain's definition of unchanged state.

## Give the source the lifetime it actually has

The Scope that executes construction owns the ref's private Scope, its Effect initializer or live
source fiber, and the retained one-value replay. Closing that owner interrupts a running source,
runs its finalizers, and interrupts active ref subscriptions. An individual observer has its own
subscription Scope: ending that consumer removes only that consumer and does not cancel the
Fx/Stream source held by the ref.

`ref.interrupt` is the explicit early-stop operation. It closes the private Scope, interrupts the
initializer and current subscribers, and clears pending initialization; it is not a restart command.
Use it when the real owner ends early.

## Diagnose a stale or silent value by checking the contract

| Symptom | First check |
| --- | --- |
| Construction returned but a read waits forever | Has a live source emitted, failed, or completed empty? |
| A new observer sees an old result | Is this the same retained ref, and was a new request actually started? |
| Reads change but observers do not | Does `eq` intentionally treat those values as equivalent? |
| Each view causes a separate connection | Are you constructing one ref per consumer instead of sharing one owner? |
| A mounted view stops receiving updates | Did the construction Scope close before the view finished? |
| An empty/reset live ref never reloads | Did the original finite source already finish? |

Test source startup with a counter or acquisition finalizer. In observer tests, use
`Effect.sleep(0)` after forking the consumer to let it run before writing. `subscriberCount` is a
lifecycle diagnostic, not a startup polling loop: it measures ref observers, so zero subscribers is
compatible with a live source still running in the ref's private Scope.

<span id="define-equality-from-every-consumers-needs"></span>

For equality decisions, use the [temperature example above](#current-state-has-one-value-replay-and-equality-controls-publications):
equivalent writes still replace the current value without publishing or advancing `version`.
