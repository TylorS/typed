---
title: "State transactions and bidirectional views"
summary: "Commit a local reservation from one snapshot; keep remote work and input representations at their own boundaries."
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

## Use transaction-local operations for several steps

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const reserveMany = <E, R>(slots: RefSubject.RefSubject<number, E, R>) =>
  RefSubject.runUpdates(slots, Effect.fn(function* (transaction) {
    const available = yield* transaction.get
    if (available === 0) return { accepted: false } as const
    yield* transaction.set(available - 1)
    return { accepted: true, slot: available } as const
  }))
```

`runUpdates` gives its callback `GetSetDelete` operations for this one serialized boundary. Do not
re-enter the same ref through top-level writes. Each local write remains real if the callback fails
or is interrupted, so use `modify` whenever one result and one replacement describe the command.

## <span id="expose-another-writable-representation-only-when-conversion-is-valid">Optional input-state reference</span>

`transform` makes a writable representation only when every accepted input has the intended inverse
mapping. Keep invalid drafts as input state instead of forcing `Number` conversion on every keystroke.
`slice` bounds an observer's Fx channel; it does not truncate current state or history. Both are
representation tools, not reservation rules. Their signatures are available through
`RefSubject.transform` and `RefSubject.slice` in the [API reference](/reference/modules/%40typed%2Ffx).

Test reservation receipts and current state separately from observed publications: an equivalent
write can return a command result while equality suppresses a new event.
