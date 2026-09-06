---
title: "State transactions and bidirectional views"
summary: "Keep a reservation decision coherent, separate remote work from local commits, and choose when a writable representation is safe."
section: "State"
kind: "guide"
order: 2.25
---

A review assignment queue has a limited number of available slots. Two commands may try to reserve
the last slot at once. Reading the count and later writing `count - 1` lets both commands decide
from the same stale value. A serialized transition must make the decision and commit together.

`RefSubject.update` handles a next value. `modify` additionally returns a result to the caller.
`runUpdates` gives several steps one serialized boundary over one ref. These are local state
operations; they do not create a distributed transaction with a server or another unrelated ref.
Start with [state composition](/explore/composing-refsubject-state) if the model's fields and
ownership are not yet clear.

## Return the decision and commit from the same snapshot

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

type Reservation =
  | { readonly accepted: false }
  | { readonly accepted: true; readonly slot: number }

const reserve = <E, R>(slots: RefSubject.RefSubject<number, E, R>) =>
  RefSubject.modify(slots, (available): readonly [Reservation, number] =>
    available === 0
      ? [{ accepted: false }, available]
      : [{ accepted: true, slot: available }, available - 1],
  )

const example = Effect.scoped(Effect.gen(function* () {
  const slots = yield* RefSubject.make(1)
  const first = yield* reserve(slots)
  const second = yield* reserve(slots)
  return { first, second, remaining: yield* slots }
}))
```

The tuple is `[result, nextState]`. An accepted reservation and the decremented count come from the
same serialized transition. A rejected reservation returns a useful result without inventing an
exception for an ordinary full queue. Competing writes use the same update boundary, so callers
cannot both reserve the last slot by independently checking it.

`modifyEffect` lets the transition require services or fail; `updateEffect` is its next-value-only
counterpart. Their added `E` and `R` stay in the command's Effect. Do not turn an ordinary domain
rejection into a defect just because the callback can fail.

## Use transaction-local operations for several steps

A reservation may read the model, update its value, and return a receipt. `runUpdates` exposes
`GetSetDelete` for that one transaction. Use the callback's operations instead of re-entering the
same ref's top-level write methods.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const reserve = <E, R>(slots: RefSubject.RefSubject<number, E, R>) =>
  RefSubject.runUpdates(slots, Effect.fn("reserveSlots")(function* (transaction) {
    const available = yield* transaction.get
    if (available === 0) return { accepted: false } as const
    yield* transaction.set(available - 1)
    return { accepted: true, slot: available } as const
  }), {
    value: "initial",
    onInterrupt: (initial) => Effect.log(`reservation interrupted from ${initial} available slots`),
  })
```

Each transaction-local write changes retained state immediately; its publication waits until the
callback exits. If the callback fails or is interrupted after writing, those writes remain and
their publications still run. Serialization does not provide rollback or collapse several writes
into one publication. Use one `modify` when a decision and its replacement fit one transition.

The `onInterrupt` option can receive the initial or current transaction value. Use it for a
specific interruption policy or diagnostic record. It is not evidence that a remote operation was
undone. Calling a top-level update on this same ref inside the callback attempts to enter the
serialized boundary again; it is not the nested-transaction API.

Prefer the simpler `modify` when one function expresses the whole change. More transaction steps
do not make the invariant stronger. Keep the domain command named `reserve` so a toolbar, route,
and test all use the same decision.

## Keep remote latency outside the lock

Awaiting a server request inside `updateEffect` makes other writes wait behind that request. If the
network stalls, a local editor can become unresponsive even though the only shared resource is a
small object. The server write also does not roll back automatically if the local callback fails.

For a remote assignment, reserve local intent in one short transition, run the request outside the
lock, then reconcile its response in another short transition. Record an operation ID or revision
with the intent. A completion should update state only if it still applies; otherwise a late response
can erase a newer edit. [Optimistic AsyncData](/explore/async-data-optimistic-edits) develops the
pending-value and rollback policy.

If several fields must change together, put them in one parent ref. Serializing writes to two
separate refs individually does not make their combined state atomic. A reservation system with
multiple authoritative services needs its own coordination protocol beyond local RefSubject state.

## Expose another writable representation only when conversion is valid

A slot limit can be numeric in the model and textual at an input boundary. `transform` forwards
reads through one mapping and writes through its inverse while delegating to the original owner.
It returns a writable ref; `map` instead returns a read-only Computed.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const example = Effect.scoped(Effect.gen(function* () {
  const slots = yield* RefSubject.make(2)
  const text = RefSubject.transform(slots, String, Number)
  yield* RefSubject.set(text, "7")
  return { numeric: yield* slots, displayed: yield* text }
}))
```

This conversion works for `"7"`, but it deliberately normalizes `"007"`, turns empty text into `0`,
and can turn invalid text into `NaN`. Those are JavaScript conversion rules, not validation. A real
quantity editor usually needs a string draft that can temporarily contain `"-"`, validation feedback,
and an explicit successful commit to the numeric model. Use a transform when normalization on every
write is the intended interaction, not to avoid representing invalid intermediate input.

For lossless transforms, test both round trips: model to view to model, and accepted view to model
to view. For lossy transforms, document normalization and test its boundaries. The view delegates
serialized writes, errors, subscriptions, and lifetime to the source; it does not create a second
store that must be synchronized.

## Bound an observer without changing current state

`slice(ref, skip, take)` is a writable facade whose Fx channel observes a bounded section of pushed
versions. Its current reads and writes still delegate directly to the original ref. It can help a
test wait for a particular number of updates, but it does not truncate history or limit future writes.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const example = Effect.scoped(Effect.gen(function* () {
  const slots = yield* RefSubject.make(2)
  const oneLaterPublication = RefSubject.slice(slots, 1, 1)
  yield* RefSubject.set(slots, 1)
  return yield* oneLaterPublication
}))
```

That final expression is a current read and returns `1`; it does not wait for the sliced Fx sequence.
To test publications, run an Fx consumer first, synchronize subscription startup, and then write.
[Test guidance](/explore/testing-typed-systems) shows this distinction.

Test reservation receipts, committed state, and observer behavior separately. An equivalent state
write can legitimately suppress a publication while still returning a command result. Add competing
reservations and interruption when those are part of the command's contract; a fast sequential happy
path alone cannot establish the serialized behavior the feature depends on.
