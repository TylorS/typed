---
title: "Build an asynchronous issue search"
summary: "Connect a decoded request, replacement policy, resource identity, AsyncData, and a working template in one scoped feature."
section: "Async data"
kind: "guide"
order: 2.41
---

An issue search makes request ownership visible. A submission starts work, a newer submission
makes older work obsolete, refresh retains successful results, and failure keeps the form usable.

## Run the example

Start with the [Quick Start Vite project](/explore/quick-start#install). Add `@typed/async-data` with
`npm install @typed/async-data` and Vitest with `npm install --save-dev vitest`. The six files in
[Complete working files](#complete-working-files) form a runnable example: copy them into `src/`,
replacing the starter `src/main.ts`. Use `<main id="app"></main>` as the host in `index.html`, keep
its `/src/main.ts` script, and run `npm run dev`. The development Layer needs no backend.

This guide builds on [state composition](/explore/composing-refsubject-state),
[native events](/explore/native-events-with-effect), and [request replacement](/explore/fx-higher-order-and-concurrency).
A Context service supplies the request implementation; see [services and lifetime](/explore/fx-services-and-lifetime)
if service provisioning is new to you. The excerpts below come from the complete files.

Submit `typed` / `state`: it loads one result. Refresh keeps that result visible. `retry` fails once,
then succeeds on Refresh. Submit another workspace before the 700 ms delay ends to replace work.

## Keep submitted identity and its result together

The form owns its unsubmitted draft. Editing either field does not change the model until submit.
`Model.ts` stores the submitted workspace, query, revision, and result in one ref:

```ts excerpt="Model.ts"
export interface SearchState extends SearchInput {
  readonly revision: number
  readonly data: AsyncData.AsyncData<ReadonlyArray<Issue>, SearchError>
}
```

Every submit or refresh uses the same transition. Refreshing the same resource preserves its
Success value with progress; changing resource starts without the previous result. Empty input
clears the displayed resource.

```ts excerpt="Model.ts"
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
```

The revision changes even on Refresh, so identical input can start another request. A Failure has
no stale value: retrying it retains the Failure with pending progress until the request settles.

## Replace work when intent changes

The model obtains `IssueSearch` once. Its observer follows submitted intent, excluding result-only
updates so a response cannot trigger another request:

```ts excerpt="Model.ts"
  const selection = state.pipe(
    Fx.map(({ workspaceId, query, revision }) => ({ workspaceId, query, revision })),

    // Publishing a result changes data, not intent; it must not trigger another request.
    Fx.skipRepeatsWith((previous, next) => previous.revision === next.revision),
  )
```

`switchMapEffect` interrupts the preceding request when new intent arrives. Empty queries must reach
that operator too: they replace active work even though they start no new request.

```ts excerpt="Model.ts"
  const runRequest = Effect.fn("Search.runRequest")(function* (input: SearchInput & { readonly revision: number }) {
    if (input.query === "") return

    const result = AsyncData.fromExit(yield* Effect.exit(search.run(input)))

    // A command can commit newer intent before this observer handles it.
    yield* RefSubject.update(state, (current) => current.revision === input.revision
      ? { ...current, data: result } : current)
  })

  // Replace the old request on new intent; end the observer when its owner closes.
  yield* Effect.forkScoped(selection.pipe(Fx.switchMapEffect(runRequest), Fx.drain))
```

The revision check covers the handoff: an old request might complete after a command commits new
intent but before the observer handles that change. It may publish only while its revision remains
current. Converting its Exit to AsyncData also keeps a request failure from ending the observer;
the next submission can run normally.

The included development service delays each result by 700 ms and fails the first `retry` request
per workspace/query pair. The production `IssueSearchLive` Layer uses the same contract, rejects
non-2xx HTTP responses, and decodes `{ items }` with Schema before returning issues.

## Render the committed state

`View.ts` derives status from the same state the request updates:

```ts excerpt="View.ts"
  const status = RefSubject.map(model.state, ({ data }) => AsyncData.match(data, {
    NoData: () => "Enter a query to search issues.",
    Loading: () => "Searching…",
    Success: (items, state) => `${items.length} issues${state.progress ? " — refreshing…" : ""}`,
    Failure: (_, state) => state.progress ? "Retrying…" : "Search failed. Refresh to retry, or submit another query.",
    Optimistic: (items) => `${items.length} issues — saving…`,
  }))
```

The native submit handler reads FormData and runs `model.submit`; the Refresh button runs
`model.refresh`. Row keys include workspace because issue IDs are unique only within a workspace.
Refreshing a success retains those keyed nodes while their values update.

`main.ts` owns the model, observer, and rendering in one Scope; its exported `stop` interrupts that
owner. A managed host should supply the equivalent lifetime.

<span id="checkpoint-4-prove-behavior"></span>

## Prove replacement without timing guesses

Run `npm exec vitest -- run src/Model.test.ts`. The test supplies a request service controlled by
Deferred values, then checks the actual model:

```ts excerpt="Model.test.ts"
    yield* model.submit({ workspaceId: "first", query: "docs" })

    // Ensure there is an active request for the next submission to replace.
    yield* Deferred.await(firstStarted)

    yield* model.submit({ workspaceId: "second", query: "docs" })
    yield* Deferred.await(secondStarted)

    expect(yield* Ref.get(interrupted)).toBe(true)
    expect((yield* model.state).data._tag).toBe("Loading")

    yield* Deferred.succeed(response, [{ id: "42", title: "Second workspace" }])
    yield* Fx.first(model.state.pipe(Fx.filter(({ data }) => data._tag === "Success")))
```

Waiting for each request's start proves there is work to replace. Releasing the second response
proves Loading lasts until completion; the final assertions in the complete test check that only
the second workspace's result appears.

This feature retains one selected resource, not a cache. Reusing earlier searches would need an
explicit key, freshness, sharing, and eviction policy. Keep those decisions with the
[shared owner](/explore/shared-state-contracts) when reuse becomes a requirement.

## Complete working files

<details>
<summary>Show the six working files</summary>

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
    state: state as RefSubject.Computed<SearchState>,
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
    Failure: (_, state) => state.progress ? "Retrying…" : "Search failed. Refresh to retry, or submit another query.",
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
