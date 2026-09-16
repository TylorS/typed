---
title: "RefSubject: build the model before the view"
summary: "Develop a review-queue selection model with named commands, derived queries, typed consumers, and a lifetime that matches the feature."
section: "State"
kind: "concept"
order: 2
---

<span id="grow-the-model-at-its-invariants"></span>

A selection model should work without mounting a component. A checkbox can change selected IDs,
a toolbar can read their count, and a test can verify that selecting an ID twice does not duplicate it.
This guide builds that model using the Effect and RefSubject basics from [Quick Start](/explore/quick-start).

`RefSubject` is that model's writable state boundary. It retains a current value, publishes distinct
commits to observers, and serializes writes. It is both an Effect for “read the current selection”
and an Fx for “follow selection changes.” A UI is one consumer of those capabilities.

**`RefSubject.make(effect)` is lazy, even when you `yield*` the constructor.** It creates the ref
without executing or awaiting the input Effect. The first read or observation starts one shared
initializer, and later consumers use its retained result. A component can therefore put a request
into a ref and return its template immediately; reading `yield* ref` would wait for the data.
[Inputs and lifetime](/explore/refsubject-sources-equality-and-lifetime) explains the distinction:
Fx and Stream inputs start their source when construction runs, rather than waiting for a reader.

Start with the invariant: selection contains each ID at most once. Then decide who can change it,
which queries consumers need, and how long selection should survive. Choosing those contracts first
makes the template smaller and the behavior easier to test.


| Need | Use | Primary contract |
| --- | --- | --- |
| Own writable state with named commands | [Build the model](#give-selection-named-commands) | Keep valid transitions with the state owner. |
| Read now or observe changes | [Reads and observations](#read-a-value-or-observe-a-relationship) | A snapshot and an ongoing subscription have different lifetimes. |
| Choose a value, lazy Effect, or live source | [Inputs and startup](/explore/refsubject-sources-equality-and-lifetime) | The input determines when initialization and source work begin. |
| Derive a read-only or optional value | [Computed and Filtered](/explore/derived-conditional-and-accumulated-state) | Derive from owned state without copying it into another ref. |
| Find any `Ref*` specialization | [Complete RefSubject directory](/explore/specialized-refsubject-state#all-refsubject-specializations) | Browse collections, scalar values, time, results, and specialized structures. |
| Share state across independently built consumers | [Service contracts](/explore/shared-state-contracts) | Choose write authority and a common provider lifetime. |

## Give selection named commands

```ts file="Selection.ts"
import { Effect } from "effect"
import { RefSubject } from "@typed/fx"

export const makeSelection = Effect.fn("makeSelection")(function* () {
  const state = yield* RefSubject.make<ReadonlyArray<string>>([])

  // Consumers can follow selection without bypassing its commands to write the array.
  const selectedIds: RefSubject.Computed<ReadonlyArray<string>> = state
  const count = RefSubject.map(state, (ids) => ids.length)

  // Check membership inside the serialized update so concurrent additions are not lost.
  const select = (id: string) => RefSubject.update(state, (ids) =>
    ids.includes(id) ? ids : [...ids, id],
  )
  const remove = (id: string) => RefSubject.update(state, (ids) =>
    ids.filter((selected) => selected !== id),
  )
  const clear = RefSubject.set(state, [])

  return { selectedIds, count, select, remove, clear }
})
```

The public type exposes the same ref as a read-only `Computed`, without mapping its values. Consumers receive that view and
commands. Calling `select("42")` creates an Effect description; running that Effect performs the
transition. The command checks membership against committed state inside `update`, so two callers
do not independently read the same old array and overwrite one another's additions.

`map` creates a query over the source, not a second mutable store. A separate writable `count` would
need updating in `select`, `remove`, and `clear`; forgetting any one path would make the toolbar
wrong. Deriving the count keeps that relationship true by construction.

The array is immutable by convention. Returning the existing array for an already selected ID
expresses that nothing changed. Do not mutate an array in place and then call `set` with that same
array: the retained “previous” value would already contain the mutation, so equality could no
longer compare the old and new states meaningfully.

## Read a value or observe a relationship

A command often needs a snapshot. The toolbar needs future changes. The same ref/view supports
both, and the caller chooses which operation it means.

```ts
import { Effect } from "effect"
import { Fx, RefSubject } from "@typed/fx"

// A command needs a snapshot from the moment it runs.
const describeCurrentSelection = (ids: RefSubject.Computed<ReadonlyArray<string>>) =>
  Effect.map(ids, (current) => `${current.length} issues selected`)

// A displayed label also needs later commits, without constructing another model.
const selectionLabels = (ids: RefSubject.Computed<ReadonlyArray<string>>) =>
  Fx.map(ids, (current) => `${current.length} issues selected`)
```

The Effect samples when it runs. The Fx description emits current selection and follows later
commits when a consumer runs it. Merely constructing either description starts no subscription.
`Fx.observe` is an appropriate long-lived consumer; `Fx.collectAll` would wait forever for a live
selection model that never ends. Use a bounded collector in a test.

This difference matters when passing values between functions. Passing `yield* count` passes a
number that will not update. Passing `count` passes a live read-and-observe capability. Neither is
universally better: an API request should usually use a deliberate snapshot, while a displayed
selection count should usually remain live.

## Let a component borrow the model

The toolbar does not need write access to selection. It needs a count and a clear command.

```ts
import type { Effect } from "effect"
import { RefSubject } from "@typed/fx"
import { html } from "@typed/template"

const SelectionToolbar = <E, R>(model: {
  readonly count: RefSubject.Computed<number, E, R>
  readonly clear: Effect.Effect<unknown, E, R>
}) => {
  const empty = RefSubject.map(model.count, (count) => count === 0)

  return html`<div aria-label="Selection actions">
    <span>${model.count} selected</span>
    <button ?disabled=${empty} onclick=${model.clear}>Clear selection</button>
  </div>`
}
```

The count is interpolated as live state. The click binding receives an Effect, so rendering does
not clear selection. The template keeps the model's error and service requirements inferred. A plain function is
sufficient because this view borrows the model and acquires no resources. A component owner belongs
where setup actually needs to run.

The toolbar's shape is small enough to reuse with another selection model. A test can construct the
model and call `clear`; a keyboard binding can run the same command. No event-specific copy of the
selection invariant is necessary.

## Give the feature its real lifetime

Constructing a RefSubject requires Scope. That Scope owns the state source and its observers'
relationship to the source. For selection that should disappear with one page, create the model
inside that page's component. For selection that should survive switching between list and detail
routes, construct it in the feature owner above those routes and pass it down or expose a service.

Closing a short `Effect.scoped` block immediately after returning a ref closes its owner. It does
not create permanent state merely because another object still references the ref. Keep construction
inside the lifetime that will actually use it; current reads and writes of an existing ref do not
need another construction Scope.

## Test commands before testing rendered bindings

The test below checks the invariant and the derived query in one scoped program. It deliberately
selects the same issue twice: the important behavior is uniqueness, not that `update` was called.

```ts file="Selection.test.ts"
import { Effect } from "effect"
import { expect, it } from "vitest"
import { makeSelection } from "./Selection.js"

it("keeps selection unique and derives its count", Effect.fn(function* () {
  const model = yield* makeSelection()

  yield* model.select("42")
  yield* model.select("42")
  yield* model.select("43")

  expect(yield* model.selectedIds).toEqual(["42", "43"])
  expect(yield* model.count).toBe(2)

  yield* model.clear

  expect(yield* model.count).toBe(0)
}, Effect.scoped, Effect.runPromise))
```

This test imports the actual model rather than reproducing its implementation. Put the two named
files beside one another and run the test with Vitest.
For live publication behavior, see the bounded observation test in
[derived state](/explore/derived-conditional-and-accumulated-state#test-observations-independently-from-snapshots).

## One invariant, then one next step

When changing workspace must clear selection, [compose those values in one parent model](/explore/composing-refsubject-state).
When a selected row may be absent, [derive an optional view](/explore/derived-conditional-and-accumulated-state)
that can also tell a consumer to clear its output.

For independently constructed consumers, [RefSubject.Service](/explore/shared-state-contracts#use-a-refsubject-facade-when-full-writes-are-the-contract)
names the whole mutable capability and supplies it through a Layer. That guide shows current reads,
updates, lazy initialization, and the narrower Computed contract for read-only consumers.
