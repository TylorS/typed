---
title: "Async data without loading flags"
summary: "Represent no data, loading, success, failure, and optimistic display as one state model."
section: "Async data"
kind: "guide"
order: 2.4
---

<span id="transform-the-result-without-erasing-its-history"></span>
<span id="validate-data-crossing-a-boundary"></span>

A resource is more than a value plus `loading`: first load, refresh, failure, and an optimistic
write make different promises to a view. `AsyncData` models those states; Effect and Fx still own
request execution, cancellation, and ordering.

## Name the resource before choosing its state

Name “issues for workspace W and query Q,” not “this component's loading state.” That identity
decides when prior data remains relevant and which request may replace it.

## Keep the previous result while refreshing

```ts
import * as AsyncData from "@typed/async-data"

const cached = AsyncData.success(["Ada"])
const refreshing = AsyncData.startLoading(cached, { loaded: 0 })
```

The prior success remains available during refresh and after a refresh failure. A first load has no
such value, so render it differently instead of inferring state from an empty array.

## Connect a request to current state

Keep request ownership with the producer that knows when its input changes. The request/cache pilot
shows sharing, stale responses, and retry placement; this article owns only the visible resource
state.

## Render every state deliberately

```ts
import * as AsyncData from "@typed/async-data"

type Profile = { readonly name: string }

const describeProfile = (data: AsyncData.AsyncData<Profile, string>) =>
  AsyncData.match(data, {
    NoData: () => "Choose a profile",
    Loading: () => "Loading profile…",
    Success: (profile) => profile.name,
    Failure: () => "Profile unavailable. Try again.",
    Optimistic: (profile) => `${profile.name} (saving)`,
  })
```

Match the union at the rendering boundary. `getSuccess` includes the current optimistic value;
`isSuccess` means confirmed `Success` only.

## <span id="make-rollback-explicit">Optional optimistic and transformation reference</span>

An optimistic wrapper retains its previous state, so a command can commit a canonical success or
restore that previous state. Overlapping edits need operation identity or serialization: blindly
restoring an older wrapper can erase newer intent. `map`, `flatMap`, `mapError`, codecs, and progress
are [API reference](/reference/modules/%40typed%2Fasync-data) tools; they do not start a request,
validate a payload, or reconcile a server response.

Continue with [optimistic edits](/explore/async-data-optimistic-edits) for stale acknowledgement and
draft rules.
