---
slug: "route-the-filter"
title: "Route the filter"
summary: "Treat the URL as an implementation of application filter state."
order: 7
demo: "todo-7"
architecture: ["domain", "application", "presentation", "infrastructure"]
---

Complete one item, then choose Active and Completed. The rows change; the items-left count still describes the full list. Filtering must never delete hidden items.

## Derive visible rows in src/application.ts

```ts
// @source examples/todo-7/src/application.ts#L23-L30
// @expect export const Todos
```

`RefSubject.struct` combines the current list and selected filter. The domain predicate selects which rows to show. The template now passes `App.Todos` to `many`; creation and deletion continue to change `TodoList`.

## Read the filter from routes

In `src/infrastructure.ts`, match the three locations:

```ts
// @source examples/todo-7/src/infrastructure.ts#L7-L13
// @expect const FilterState
```

The root selects All, `/active` selects Active, and `/completed` selects Completed. Unmatched locations redirect to the root; the catch supplies All if matching fails. Application code receives a filter value, not `window.location`.

Provide that live result as the application's state:

```ts
// @source examples/todo-7/src/infrastructure.ts#L26-L32
// @expect export const makeServices
```

## Link to the selected location

Each filter uses `Link` in `src/presentation.ts`:

```ts
// @source examples/todo-7/src/presentation.ts#L111-L120
// @expect ${Link({
```

The selected class is derived from the same filter state. A separate selected-tab subject could drift from browser history. [Routing and navigation](/explore/routing-routes-matchers-and-navigation) explains how these pieces fit together.

**Try it:** mark an item complete while viewing Active. It should disappear there and remain available under Completed. In your standalone app, also check Back and Forward. Hidden rows end their rendered lifetime, so save or cancel an edit before changing filters.

<details>
<summary id="embed-the-app-with-a-private-router">Embed the app with a private router</summary>

The documentation preview uses `src/preview.ts` to keep its links out of the documentation page's browser history:

```ts
// @source examples/todo-7/src/preview.ts#L1-L8
// @expect import { Fx
```

The standalone entrypoint, `src/main.ts`, uses the browser router supplied by `Services`. Run `npm run dev` and open that app to check Back and Forward. Only an embedded preview needs `src/preview.ts`.

</details>

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-7/src/application.ts
```

</details>

<details class="curriculum-file">
<summary>src/presentation.ts</summary>

```ts file="src/presentation.ts"
// @source examples/todo-7/src/presentation.ts
```

</details>

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todo-7/src/infrastructure.ts
```

</details>

<details class="curriculum-file">
<summary>src/preview.ts</summary>

```ts file="src/preview.ts"
// @source examples/todo-7/src/preview.ts
```

</details>
