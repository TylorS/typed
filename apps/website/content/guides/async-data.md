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

## Distinguish first load from refresh

Use one state for one resource, such as the currently selected profile. `NoData` means no result or
request yet. `Loading` means a first request is pending. `Success` and `Failure` describe completed
outcomes; each can also carry progress while a refresh or retry runs.

```ts
import * as AsyncData from "@typed/async-data"

type Profile = { readonly name: string }

const initial = AsyncData.NoData
const loading = AsyncData.loading()
const loaded = AsyncData.success<Profile>({ name: "Ada" })
const refreshing = AsyncData.startLoading(loaded)
```

`refreshing` is still a Success containing Ada, with progress marking pending work. If the request
then produces a Failure, that Failure does **not** retain Ada. Keeping stale data after a failed
refresh requires a separate policy. Do not infer these states from an empty value or a second
loading flag.

## Render the state, including pending work

```ts
import * as AsyncData from "@typed/async-data"

type Profile = { readonly name: string }

const describeProfile = (data: AsyncData.AsyncData<Profile, string>) =>
  AsyncData.match(data, {
    NoData: () => "Choose a profile",
    Loading: () => "Loading profile…",
    Success: (profile, state) => `${profile.name}${state.progress ? " (refreshing)" : ""}`,
    Failure: (_, state) => state.progress ? "Retrying profile…" : "Profile unavailable. Try again.",
    Optimistic: (profile) => `${profile.name} (saving)`,
  })
```

Matching the union keeps first load separate from refresh: the latter can display Ada while the
new request runs. `getSuccess` extracts an available value, including an optimistic value;
`isSuccess` identifies confirmed Success only.

## Connect state to a request

AsyncData does not start requests. A producer decides when an input changes, which request to
cancel, and which completion may publish. [Build an asynchronous issue search](/explore/async-data-requests-and-cache)
shows those decisions together with loading, refresh, and retry in a working form.

<span id="make-rollback-explicit"></span>

For edits that display a proposed value before the server accepts it, continue with
[optimistic edits](/explore/async-data-optimistic-edits). The Optimistic state retains the state it
replaced; that history is separate from a Success being refreshed.
