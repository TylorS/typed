---
title: "AsyncData optimistic edits and reconciliation"
summary: "Keep a draft, a pending optimistic value, and stale acknowledgement rules explicit."
section: "Async data"
kind: "guide"
order: 2.42
---

An optimistic edit displays a candidate while its save is pending. Keep the previous value for
rollback, and accept or reject a response only if its edit is still current. Start with
[AsyncData](/explore/async-data) and [asynchronous issue search](/explore/async-data-requests-and-cache).

## One operation has a simple state transition

`AsyncData.optimistic(confirmed, candidate)` retains `confirmed` in its `previous` field.
Rejecting that save can restore `previous`; accepting it should install the server's canonical
success rather than assume the server kept the candidate unchanged.

## Guard the commit against a newer local edit

Compare the current value with the pending wrapper that belongs to the response. Here is the state
transition when save B starts, save C replaces it, and B finishes first:

```ts
import * as AsyncData from "@typed/async-data"

const confirmed = AsyncData.success({ title: "A" })
const pending = AsyncData.optimistic(confirmed, { title: "B" })

// Each assignment represents one arrival.
let current: AsyncData.AsyncData<{ title: string }, unknown> = pending

// C replaces B. Both edits use the last confirmed value as their rollback point.
const newer = AsyncData.optimistic(confirmed, { title: "C" })
current = newer

// B succeeds late: the guard leaves C visible.
const canonicalB = { title: "B (normalized)" }
current = current === pending ? AsyncData.success(canonicalB) : current

// C succeeds: its canonical server value replaces the optimistic wrapper.
const canonicalC = { title: "C (normalized)" }
current = current === newer ? AsyncData.success(canonicalC) : current
```

If C fails instead, apply the same guard with `newer.previous` as the replacement. A failure from B
must also leave C alone. With a RefSubject, make this comparison inside `RefSubject.update` so the
check and replacement use the same current value.

This policy protects local intent; it does not control server write order. Cancelling a local waiter
does not undo a server mutation.

## <span id="choose-how-overlapping-edits-should-behave">Optional overlap policy</span>

Choose one pending mutation, serialized writes, or latest-intent reconciliation. Rebase is a
separate domain protocol: it needs operations such as “set title” or “increment,” not snapshots
alone. The server's revision checks and idempotency keys belong at the request boundary.

## Separate the draft from the resource when input can be incomplete

Keep a raw draft local while it can be invalid or continue changing during save. Validate at submit,
then publish the accepted candidate optimistically; rollback must not erase a newer unsent draft.
For example, rejecting save C must not erase a draft D that has not been submitted.

## <span id="keep-history-bounded-and-test-recovery-paths">Optional recovery checklist</span>

Settle to canonical Success and retain only pending operations that still matter. Test a rejection,
stale acknowledgement, server normalization, and teardown during save. The
[AsyncData reference](/reference/modules/%40typed%2Fasync-data) covers the transition helpers; the
application must still choose its conflict policy.
