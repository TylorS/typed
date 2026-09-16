---
title: "Return results from serialized state updates"
summary: "Decide and commit from one current value with RefSubject.modify, and know when transaction-local operations are needed."
section: "State"
kind: "guide"
order: 2.25
---

<span id="keep-remote-latency-outside-the-lock"></span>
<span id="bound-an-observer-without-changing-current-state"></span>

A reservation must decide and commit from the same current state. `RefSubject.modify` does that for
one replacement; `runUpdates` is for a small sequence over one ref. Neither creates a distributed
transaction or rolls back remote work. Start with [state composition](/explore/composing-refsubject-state)
when fields must change together.

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

  return { first: yield* reserve(slots), second: yield* reserve(slots), remaining: yield* slots }
}))
```

The result and replacement come from one serialized transition. A full queue is an ordinary result,
not a defect. Keep a server request outside that transition, then reconcile a response only if its
operation ID or revision still applies; [optimistic AsyncData](/explore/async-data-optimistic-edits)
owns that policy.

## Use transaction-local operations only when one replacement is insufficient

Prefer `modify` for the reservation above: its result and replacement fully describe the command.
For operations that must read and write the same ref in several steps, `runUpdates` supplies
transaction-local `get`, `set`, and `delete` operations under one serialized boundary. See
[`RefSubject.runUpdates`](/reference/modules/%40typed%2Ffx%2FRefSubject) for its contract.

Do not re-enter the same ref through top-level writes inside that callback. Each local write remains
real if the callback fails or is interrupted: serialization does not provide rollback. A long-running
callback holds the write boundary and delays its publications until it exits. If a request and its
exit handling belong together, publish loading before entering the boundary, as in the
[asynchronous search](/explore/async-data-requests-and-cache#replace-work-when-intent-changes).

<span id="expose-another-writable-representation-only-when-conversion-is-valid"></span>

Test reservation receipts and current state separately from observed publications: an equivalent
write can return a command result while equality suppresses a new event.
