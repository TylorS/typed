---
title: "Derived values and optional state"
summary: "Derive read-only values and make loss of selection observable with Computed and Filtered."
section: "State"
kind: "guide"
order: 2.15
---

A selected-ID array always has a count. A focused ID may be missing. These queries need different
contracts: one always produces a value, while the other must decide whether absence is skipped or
published so a consumer can clear its output.

`Computed` and `Filtered` are read-only views over a Versioned source. They can be read as Effects
or observed as Fx; they do not create another writable truth. Start with
[state composition](/explore/composing-refsubject-state) for the owning model.

| View | Current read | Observation |
| --- | --- | --- |
| `Computed<A, E, R>` | A value, or E | Derived updates |
| `Filtered<A, E, R>` | A value, E, or `NoSuchElementError` | Present derived updates; absence is skipped |

A current read and an observation handle absence differently. Choose the view for what its
consumer needs to observe, not just the type of its successful value.

## Compute a value that always exists

A selected-ID array always has a length, including when it is empty. `map` is the appropriate query.

```ts
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

const example = Effect.scoped(Effect.gen(function* () {
  const selected = yield* RefSubject.make<ReadonlyArray<string>>([])

  const count = RefSubject.map(selected, (ids) => ids.length)
  const empty = RefSubject.map(count, (value) => value === 0)

  yield* RefSubject.set(selected, ["42", "43"])

  return { count: yield* count, empty: yield* empty }
}))
```

There is no `set(count, ...)`. The model changes selected IDs and the count stays derived. The
projection is lazy: creating the view does not run it. Current reads and observations apply it when
a value is needed. The example returns `{ count: 2, empty: false }`.

Prefer pure projection for formatting and totals. `mapEffect` can do effectful work, but it does not
by itself define a feature-wide shared request cache. If several consumers must share one remote
request, give that producer an owner and retain its AsyncData result once, then derive cheap views.

## Preserve loss of selection when the consumer needs it

The focused ID is optional. A command that requires an ID can use a Filtered. A pane that must clear
when focus is removed must observe both Some and None.

```ts
import { Effect, Option } from "effect"
import { RefSubject } from "@typed/fx"

const example = Effect.scoped(Effect.gen(function* () {
  const focusedId = yield* RefSubject.make(Option.none<string>())

  const present = RefSubject.compact(focusedId)
  const label = RefSubject.getOrElse(present, () => "No focused issue")
  const explicitAbsence = present.asComputed()

  yield* RefSubject.set(focusedId, Option.some("42"))
  const selectedLabel = yield* label

  yield* RefSubject.set(focusedId, Option.none())

  return { selectedLabel, emptyLabel: yield* label, current: yield* explicitAbsence }
}))
```

`compact` turns Option-valued state into a Filtered. `filterMap` does the same when a projection
may return None; `filterMapEffect` adds Effectful decision work. `asComputed()` exposes Option again,
while `getOrElse` publishes a meaningful fallback and removes only the absence failure.

If a loader observes only `present`, it sees `"42"` and no event for deselection. It therefore cannot
infer that its old request or output should disappear. Observe the Option-valued source at a
selection boundary and switch on both cases. This is not a renderer quirk: skipping an emission is
different from emitting an empty result in any reactive system.

## Keep projection failures and services visible

`mapEffect` and `filterMapEffect` can add errors and service requirements to the source's channels.
Services used by a projection must be provided when the read or observation runs. See
[services and lifetime](/explore/fx-services-and-lifetime) for provisioning patterns.

Filtered adds `NoSuchElementError` to its current-read Effect when the result is absent. Its Fx
observation skips that absence instead of failing. Other projection errors still propagate.

## Test observations independently from snapshots

A snapshot test reads the count, changes IDs, and reads it again. An observation test must actually
subscribe before the writes it expects to see. After forking the observer, use `Effect.sleep(0)` to let it run before writing.

```ts
import { Effect, Fiber, Option } from "effect"
import { expect, it } from "vitest"
import { Fx, RefSubject } from "@typed/fx"

it("emits selections while skipping absence", () => Effect.scoped(Effect.gen(function* () {
  const source = yield* RefSubject.make<Option.Option<string>>(Option.none())
  const present = RefSubject.compact(source)

  const observed = yield* Fx.collectUpToFork(present, 2)
  yield* Effect.sleep(0)

  yield* RefSubject.set(source, Option.some("42"))
  yield* RefSubject.set(source, Option.none())
  yield* RefSubject.set(source, Option.some("43"))

  expect(yield* Fiber.join(observed)).toEqual(["42", "43"])
})).pipe(Effect.runPromise))
```

This test demonstrates Filtered's omission, not just a successful selection. A pane-clearing test
would instead observe Option and assert None. Current-read tests should also cover absence and
projection errors. A passing DOM assertion after one selection cannot establish these contracts.

## <span id="accumulate-only-when-the-intended-history-is-clear">When the question is about history</span>

`scan` and `scanEffect` fold source history; they are not a count of current selection and not a
reliable count of commands when equality suppresses repeated state commits. Use an event source when
every occurrence matters, or retain one owned accumulator when readers must share its history. See
[Subject events](/explore/subject-event-publications) for occurrences and the API reference for the
full `scan`/`scanEffect` contract.
