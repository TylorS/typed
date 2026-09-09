---
title: "Build an asynchronous issue search"
summary: "Connect a decoded request, replacement policy, resource identity, AsyncData, and a working template in one scoped feature."
section: "Async data"
kind: "guide"
order: 2.41
---

An issue search makes request ownership visible. A submission starts work, a newer submission
makes older work obsolete, refresh retains successful results, and failure keeps the form usable.

## Quick start

Start with the [Quick Start Vite project](/explore/quick-start#install). Add `@typed/async-data` with `npm install @typed/async-data` and the test runner with `npm install --save-dev vitest`. Copy the six named files from [Complete working files](#complete-working-files) into `src/`, replacing the starter `src/main.ts`. In `index.html`, replace the app host with `<main id="app"></main>` and keep the script loading `/src/main.ts`. Run `npm run dev`. The development Layer needs no backend.

Submit `typed` / `state`: it loads one result. Refresh keeps that result visible. `retry` fails once
then succeeds on Refresh. Submit another workspace before the 700 ms delay ends to replace work.

## Checkpoint 1: Display local state

### Render state directly and keep row identity stable

Edit either field without submitting: status and results remain tied to the last submission. Submit
to display the committed state as NoData, Loading, Success, or Failure.

The native form owns the draft; `submit` commits it. Row keys include workspace because an issue ID
is only unique there, so refreshing a successful query retains row nodes while values update.

<details>
<summary>Predict: what changes while someone edits a field but has not submitted?</summary>

Nothing in the status or result list changes. The form still owns a native draft; the submitted
identity stays in the model until the next submit.
</details>

## Checkpoint 2: Start one request

### Decode the response at the request boundary

The first submission starts the development request. Production uses the same `IssueSearch`
contract: HTTP rejects non-2xx, Schema validates `{ items }`, and errors stay typed. A Layer changes
the host, not the model.

### Preview the behavior before connecting a backend

The included Layer waits 700 ms, making Loading and refresh progress observable. Its `retry` query
fails once per workspace/query key, then succeeds on Refresh. Use `IssueSearchLive` when `/api/issues?workspace=…&q=…` is ready.

## Checkpoint 3: Replace and recover competing requests

### Put resource identity and its result in one state

While `first` / `docs` is pending, submit `second` / `docs`. The first request is interrupted and
only the second response can publish. Submit an empty query while work is pending: it still reaches
the replacement operator, interrupts the work, and starts nothing else.

The model stores normalized identity, revision, and `AsyncData` together. `switchMapEffect`
replaces the prior request; the revision check stops an old completion publishing in the handoff.
`startLoading` retains Success as progress. Stale data after Failure needs a separate policy.

<details>
<summary>Change: remove the revision check. Which bug can now appear?</summary>

An old request can publish after newer intent was committed but before replacement is observed. The
UI could show the newest workspace/query with an older response.
</details>

<details>
<summary>Predict: why does Refresh preserve rows only after a successful request?</summary>

`AsyncData.startLoading` retains a Success value as progress. Failure has no stale-value field, so
a refresh after failure shows a fresh pending state until it settles.
</details>

### Add caching when reuse has an owner

This feature retains one selected resource and forgets workspace A when selecting B. Add a cache
only when reuse warrants explicit key, freshness, sharing, eviction, and invalidation policies.
[Shared state](/explore/shared-state-contracts) covers ownership; [optimistic edits](/explore/async-data-optimistic-edits) covers writes.

## Checkpoint 4: Prove behavior

### Mount once under an owner that stays alive

`main.ts` scopes model, observer, and rendering together. Its `stop` interrupts all three; a managed
host should provide that lifetime instead.

### Prove replacement without sleeping

Run `npm exec vitest -- run src/Model.test.ts`. Deferred values control both requests: the test proves the first
was interrupted, the second stays Loading until released, and only its result publishes.

<details>
<summary>Change: make the second request fail, then submit it again. What should the test prove?</summary>

The failed request publishes Failure for the current revision, and the next submission starts a new
revision. The retry may publish Success; it must not reuse a result from the failed request.
</details>

## Complete working files

<details>
<summary>Show the six files used by every checkpoint</summary>

```ts file="Api.ts"
import { Context, Data, Effect, Layer, Schema } from "effect"
import { FetchHttpClient, HttpClient, HttpClientError, HttpClientResponse } from "effect/unstable/http"

export const Issue = Schema.Struct({ id: Schema.String, title: Schema.String })
export type Issue = typeof Issue.Type
const SearchResponse = Schema.Struct({ items: Schema.Array(Issue) })

export class SearchUnavailable extends Data.TaggedError("SearchUnavailable")<{}> {}
export type SearchError = HttpClientError.HttpClientError | Schema.SchemaError | SearchUnavailable
export type SearchInput = { readonly workspaceId: string; readonly query: string }

export class IssueSearch extends Context.Service<IssueSearch, {
  readonly run: (input: SearchInput) => Effect.Effect<ReadonlyArray<Issue>, SearchError>
}>()("issues/IssueSearch") {}

export const IssueSearchLive = (origin: string) => Layer.effect(IssueSearch, Effect.gen(function* () {
  const client = HttpClient.filterStatusOk(yield* HttpClient.HttpClient)
  const url = new URL("/api/issues", origin).href
  return {
    run: Effect.fn("IssueSearch.request")(function* (input: SearchInput) {
      const response = yield* client.get(url, {
        urlParams: { workspace: input.workspaceId, q: input.query },
      })
      // Read and validate the response through the same interruptible HTTP workflow.
      const decoded = yield* HttpClientResponse.schemaBodyJson(SearchResponse)(response)
      return decoded.items
    }),
  }
})).pipe(Layer.provide(FetchHttpClient.layer))
```

```ts file="Development.ts"
import { Effect, Layer } from "effect"
import { SearchUnavailable, IssueSearch, type SearchInput } from "./Api.js"

export const IssueSearchDevelopment = Layer.effect(IssueSearch, Effect.sync(() => {
  const attempts = new Map<string, number>()
  const run = Effect.fn("developmentSearch")(function* (input: SearchInput) {
    const key = JSON.stringify([input.workspaceId, input.query])
    const attempt = (attempts.get(key) ?? 0) + 1
    attempts.set(key, attempt)
    yield* Effect.sleep("700 millis")
    if (input.query === "retry" && attempt === 1) {
      return yield* Effect.fail(new SearchUnavailable())
    }
    return [{ id: "42", title: `${input.workspaceId}: ${input.query} (response ${attempt})` }]
  })
  return { run }
}))
```

```ts file="Model.ts"
import { Effect } from "effect"
import * as AsyncData from "@typed/async-data"
import { Fx, RefSubject } from "@typed/fx"
import { IssueSearch, type Issue, type SearchError, type SearchInput } from "./Api.js"

export interface SearchState extends SearchInput {
  readonly revision: number
  readonly data: AsyncData.AsyncData<ReadonlyArray<Issue>, SearchError>
}

const begin = (current: SearchState, input: SearchInput): SearchState => {
  const query = input.query.trim()
  const sameResource = current.workspaceId === input.workspaceId && current.query === query
  return {
    workspaceId: input.workspaceId,
    query,
    revision: current.revision + 1,
    data: query === "" ? AsyncData.NoData
      : sameResource ? AsyncData.startLoading(current.data) : AsyncData.loading(),
  }
}

export const makeSearchModel = Effect.fn("makeSearchModel")(function* () {
  const search = yield* IssueSearch
  const state = yield* RefSubject.make<SearchState>({
    workspaceId: "typed", query: "", revision: 0, data: AsyncData.NoData,
  })
  const selection = state.pipe(
    Fx.map(({ workspaceId, query, revision }) => ({ workspaceId, query, revision })),
    // Publishing a result changes data, not intent; it must not trigger another request.
    Fx.skipRepeatsWith((previous, next) => previous.revision === next.revision),
  )
  const runRequest = Effect.fn("Search.runRequest")(function* (input: SearchInput & { readonly revision: number }) {
    if (input.query === "") return
    const result = AsyncData.fromExit(yield* Effect.exit(search.run(input)))
    // A command can commit newer intent before this observer handles it.
    yield* RefSubject.update(state, (current) => current.revision === input.revision
      ? { ...current, data: result } : current)
  })
  // Replace the old request on new intent; end the observer when its owner closes.
  yield* Effect.forkScoped(selection.pipe(Fx.switchMapEffect(runRequest), Fx.drain))

  return {
    state: RefSubject.map(state, (current) => current),
    submit: (input: SearchInput) => RefSubject.update(state, (current) => begin(current, input)),
    refresh: RefSubject.update(state, (current) => begin(current, current)),
  }
})

export type SearchModel = Effect.Success<ReturnType<typeof makeSearchModel>>
```

```ts file="View.ts"
import { Option } from "effect"
import * as AsyncData from "@typed/async-data"
import { RefSubject } from "@typed/fx"
import { EventHandler, html, many } from "@typed/template"
import type { SearchModel } from "./Model.js"

export const SearchView = (model: SearchModel) => {
  const busy = RefSubject.map(model.state, ({ data }) => AsyncData.isPending(data))
  const empty = RefSubject.map(model.state, ({ query }) => query === "")
  const status = RefSubject.map(model.state, ({ data }) => AsyncData.match(data, {
    NoData: () => "Enter a query to search issues.",
    Loading: () => "Searching…",
    Success: (items, state) => `${items.length} issues${state.progress ? " — refreshing…" : ""}`,
    Failure: () => "Search failed. Refresh to retry, or submit another query.",
    Optimistic: (items) => `${items.length} issues — saving…`,
  }))
  const rows = RefSubject.map(model.state, ({ workspaceId, data }) =>
    Option.getOrElse(AsyncData.getSuccess(data), () => []).map((issue) => ({ workspaceId, ...issue })),
  )
  const submit = EventHandler.make((event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    const fields = new FormData(event.currentTarget)
    return model.submit({ workspaceId: String(fields.get("workspace")), query: String(fields.get("query")) })
  }, { preventDefault: true })

  return html`<section aria-label="Issue search">
    <form onsubmit=${submit}>
      <label>Workspace <input name="workspace" value="typed" required /></label>
      <label>Query <input name="query" type="search" /></label>
      <button type="submit">Search</button>
      <button type="button" ?disabled=${empty} onclick=${model.refresh}>Refresh</button>
    </form>
    <p role="status">${status}</p>
    <ul aria-busy=${busy}>
      ${many(rows, (issue) => JSON.stringify([issue.workspaceId, issue.id]), (issue) =>
        html`<li>${RefSubject.map(issue, (value) => value.title)}</li>`,
      )}
    </ul>
  </section>`
}
```

```ts file="main.ts"
import { Effect, Fiber } from "effect"
import { Fx } from "@typed/fx"
import { DomRenderTemplate, render } from "@typed/template"
import { IssueSearchDevelopment } from "./Development.js"
import { makeSearchModel } from "./Model.js"
import { SearchView } from "./View.js"

const mount = Effect.fn("mountIssueSearch")(function* (root: HTMLElement) {
  const model = yield* makeSearchModel()
  yield* render(SearchView(model), root).pipe(Fx.drain)
})

const root = document.querySelector<HTMLElement>("#app")
if (root === null) throw new Error("Missing #app host")
const fiber = Effect.runFork(mount(root).pipe(
  Effect.provide(IssueSearchDevelopment), Effect.provide(DomRenderTemplate), Effect.scoped,
))
// Removing the DOM host alone cannot stop its requests and subscriptions.
export const stop = () => Effect.runPromise(Fiber.interrupt(fiber))
```

```ts file="Model.test.ts"
import { Deferred, Effect, Ref } from "effect"
import { expect, it } from "vitest"
import { Fx } from "@typed/fx"
import { IssueSearch, type Issue } from "./Api.js"
import { makeSearchModel } from "./Model.js"

it("replaces the old workspace request and publishes only the current result", () =>
  Effect.gen(function* () {
    const firstStarted = yield* Deferred.make<void>()
    const secondStarted = yield* Deferred.make<void>()
    const response = yield* Deferred.make<ReadonlyArray<Issue>>()
    const interrupted = yield* Ref.make(false)
    const run = Effect.fn("testSearch")(function* (input: { readonly workspaceId: string }) {
      if (input.workspaceId === "first") {
        return yield* Deferred.succeed(firstStarted, undefined).pipe(
          Effect.andThen(Effect.never),
          Effect.onInterrupt(() => Ref.set(interrupted, true)),
        )
      }
      yield* Deferred.succeed(secondStarted, undefined)
      return yield* Deferred.await(response)
    })
    const model = yield* makeSearchModel().pipe(Effect.provideService(IssueSearch, { run }))
    yield* model.submit({ workspaceId: "first", query: "docs" })
    // Ensure there is an active request for the next submission to replace.
    yield* Deferred.await(firstStarted)
    yield* model.submit({ workspaceId: "second", query: "docs" })
    yield* Deferred.await(secondStarted)
    expect(yield* Ref.get(interrupted)).toBe(true)
    expect((yield* model.state).data._tag).toBe("Loading")
    yield* Deferred.succeed(response, [{ id: "42", title: "Second workspace" }])
    yield* Fx.first(model.state.pipe(Fx.filter(({ data }) => data._tag === "Success")))
    const current = yield* model.state
    expect(current.workspaceId).toBe("second")
    expect(current.data).toEqual({ _tag: "Success", value: [{ id: "42", title: "Second workspace" }], progress: undefined })
  }).pipe(Effect.scoped, Effect.runPromise),
)
```

</details>
