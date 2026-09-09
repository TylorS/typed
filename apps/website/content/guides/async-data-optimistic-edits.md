---
title: "AsyncData optimistic edits and reconciliation"
summary: "Keep a draft, a pending optimistic value, and stale acknowledgement rules explicit."
section: "Async data"
kind: "guide"
order: 2.42
---

An optimistic edit shows intended data before a server accepts it. The important decision is what a
later acknowledgement or failure means after another local edit. Start with [AsyncData](/explore/async-data)
and the [request-ownership pilot](/explore/async-data-requests-and-cache).

## One operation has a simple state transition

```ts
import * as AsyncData from "@typed/async-data"

const confirmed = AsyncData.success({ title: "A" })
const pending = AsyncData.optimistic(confirmed, { title: "B" })
const rejected = pending.previous
const accepted = AsyncData.success(pending.value)
```

The optimistic wrapper preserves exactly the state it replaced. Rejecting one pending save can
restore `previous`; accepting it should install the server's canonical success.

## Guard the commit against a newer local edit

Attach an operation ID or compare the installed pending wrapper before a completion writes. A stale
completion must leave a newer local intent alone. That guard does not claim that cancelling the
local waiter undoes a server mutation.

## <span id="choose-how-overlapping-edits-should-behave">Optional overlap policy</span>

Choose one pending mutation, serialized writes, or latest-intent reconciliation. Rebase is a
separate domain protocol: it needs operations such as “set title” or “increment,” not snapshots
alone. The server's revision checks and idempotency keys belong at the request boundary.

## Separate the draft from the resource when input can be incomplete

Keep a raw draft local while it can be invalid or continue changing during save. Validate at submit,
then publish the accepted candidate optimistically; rollback must not erase a newer unsent draft.
Keep stable client identity through acknowledgement so a server ID does not remount a row.

## <span id="keep-history-bounded-and-test-recovery-paths">Optional recovery checklist</span>

Settle to canonical Success and retain only pending operations that still matter. Test a rejection,
stale acknowledgement, server normalization, and teardown during save. `map` and `flatMap` are
lookup operations in the [AsyncData reference](/reference/modules/%40typed%2Fasync-data); neither
chooses conflict policy.
