---
title: "Build an asynchronous issue search"
summary: "Connect a decoded request, replacement policy, resource identity, AsyncData, and a working template in one scoped feature."
section: "Async data"
kind: "guide"
order: 2.41
---

An issue search has a small but demanding contract. Submitting a query starts a request. Submitting
another query makes the first response obsolete. Refreshing keeps the current results visible.
Switching workspace must clear results belonging to the old workspace. A failed request should
show a retry action and leave the search form usable.

Build that feature as one model and one view. The model owns requests and state; the view borrows
its state and commands. These files form one runnable browser example. Start with the development service below, then
connect `GET /api/issues?workspace=…&q=…` returning `{ items: [{ id, title }] }`, with IDs unique
within a workspace. The model stays the same when a test or production host replaces its service.

## Decode the response at the request boundary

Effect's HTTP client owns transport, response status checks, and cancellation. Schema decoding
validates the body before the model can publish it. The application asks for an `IssueSearch`
service, so replacing HTTP with a controlled test implementation does not change the model.

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

`filterStatusOk` rejects non-2xx responses. Transport and response failures retain Effect's HTTP
error structure; invalid response data retains its Schema error. `FetchHttpClient` connects
interruption to the browser request. Supply the API origin at the application boundary, keeping
browser globals out of the service module. `SearchUnavailable` below represents a simulated outage
in the development service.

## Preview the behavior before connecting a backend

This development service delays every response by 700 milliseconds. Search for `state` to see
loading and results, then Refresh to keep those results visible during another request. Search
for `retry`: the first attempt fails, and Refresh succeeds. Submit another workspace while a
request is pending to exercise replacement. The attempt counter belongs to this service Layer.

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

The delay remains interruptible. This fixture exercises the application states; `IssueSearchLive`
above is the implementation that validates HTTP responses.

## Put resource identity and its result in one state

A result belongs to a workspace and normalized query. Keep those inputs together with the result
so a consumer cannot observe workspace B alongside workspace A's items. A revision distinguishes
two requests for the same key: pressing Refresh twice still creates newer intent.

The model makes two separate decisions. A command immediately commits the selected identity and
pending state. An Fx observes only revision changes and runs one replaceable request. Publishing a
request result checks its revision inside the same serialized state update used by commands.

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

A settlement changes `data` without changing `revision`, so it does not trigger another request.
Submitting an empty query still reaches `switchMapEffect`: it interrupts the previous request and
starts no replacement. Filtering empty queries *before* the switch would leave the previous request
running when the form is cleared.

A new identity starts with Loading. A same-key refresh uses `startLoading`, retaining its Success
and progress. This model replaces a failed refresh with Failure, which has no stale-value field.
Keeping stale results *after* a failed refresh needs a separate last-good-value or cache policy;
it is not a property supplied by AsyncData.

The revision check is valuable even with cancellation. Intent changes synchronously at the command
boundary, before the observing fiber necessarily handles that change. A completion cannot overwrite
newer intent during that interval. It also cannot label a result with a different workspace.

## Render state directly and keep row identity stable

The form uses native controls. Submitting reads their current values, then calls a model command.
The status and results remain live projections. Each row's key includes its workspace, so the same
local issue ID in two workspaces is not treated as one entity. A same-key refresh keeps existing row
nodes while their current values change.

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
  // Local issue IDs can repeat across workspaces; carry both values into the row key.
  const rows = RefSubject.map(model.state, ({ workspaceId, data }) =>
    Option.getOrElse(AsyncData.getSuccess(data), () => []).map((issue) => ({ workspaceId, ...issue })),
  )
  const submit = EventHandler.make((event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    // Commit native draft values on submit; typing alone must not relabel current results.
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

There is no component generator here because rendering borrows an already constructed model and
acquires nothing. The inputs deliberately remain draft values in the native form: changing a field
does not relabel current results until the user submits it. Refresh repeats the *submitted* query,
not an unsent draft.

## Mount once under an owner that stays alive

This browser entry point expects `<main id="app"></main>`. Its scoped fiber owns the model, the
request observer, and rendering. Interrupt it when the application host removes this feature. In a managed
integration, use that host's lifetime instead of creating another root fiber.

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

When the endpoint is ready, import `IssueSearchLive` from `Api.ts` and replace
`Effect.provide(IssueSearchDevelopment)` with `Effect.provide(IssueSearchLive(window.location.origin))`.

## Prove replacement without sleeping

The test imports the actual model from this guide. Deferred values tell the test when each request
starts and let it choose when the current request completes. It verifies cancellation, workspace
identity, and the final state without depending on network speed or a renderer.

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

Extend this test with a failed request followed by retry, same-key refresh retaining rows, empty
submission interrupting work, and shutdown while a request is active. A successful initial load
alone does not establish the feature's ownership contract.

## Add caching when reuse has an owner

This model retains one selected resource. It intentionally forgets workspace A when selecting B.
A cache adds a collection of keyed entries and policies: which inputs form the key, how long a
result is fresh, whether concurrent consumers share a request, and when entries are evicted.

A feature-owned cache disappears with its Scope. A workspace cache can survive child route changes,
but must not accidentally share private results across accounts. Invalidation after a mutation is a
separate decision from request cancellation. Start from the explicit request and identity contracts
above, then add caching only where reuse warrants it. [Shared state](/explore/shared-state-contracts)
explains where that owner belongs; [optimistic edits](/explore/async-data-optimistic-edits) explains
why write reconciliation needs a different policy from replaceable reads.
