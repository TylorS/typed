---
slug: "assemble-the-application"
title: "Assemble the application"
summary: "Join presentation, infrastructure, and the DOM renderer in one composition root."
order: 9
demo: "todo-9"
architecture: ["domain", "application", "presentation", "infrastructure", "main"]
---

You have been running `src/main.ts` since the shell chapter. Now follow how it connects the completed modules: services, host, renderer and running lifetime. The diagram above shows the application boundaries.

## Import the outer pieces

```ts
// @source examples/todomvc/src/main.ts#L1-L7
// @expect import "./styles.css"
```

Presentation depends on application contracts, while infrastructure implements those contracts. The entrypoint may know both because connecting them is its job.

## Start the application

```ts
// @source examples/todomvc/src/main.ts#L9-L14
// @expect await render
```

Read the pipeline in order:

1. `render` describes mounting `TodoApp` into the chosen host.
2. `Fx.drainLayer` gives the running render stream a Layer lifetime.
3. `Layer.provide` supplies application services and the DOM renderer. The factory comes from the canonical infrastructure module.
4. `Layer.launch` keeps the application running, and `Effect.runPromise` starts it from the JavaScript entrypoint.

Keep mounting here. Importing `TodoApp` in a test should not start a second application.

**Try the complete flow:** create two todos, save an edit, complete that item, select Completed, clear it, return to All, then reload. The other item should remain. Missing-service types point to assembly; duplicate event handling can indicate that the same host was mounted twice without closing the first lifetime.

The complete files below are a checkpoint if you joined midway. Next, add a presentation test for retained row identity and cancelled edits to the domain and application tests.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/domain.ts</summary>

```ts file="src/domain.ts"
// @source examples/todomvc/src/domain.ts
```

</details>

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todomvc/src/application.ts
```

</details>

<details class="curriculum-file">
<summary>src/presentation.ts</summary>

```ts file="src/presentation.ts"
// @source examples/todomvc/src/presentation.ts
```

</details>

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todomvc/src/infrastructure.ts
```

</details>

<details class="curriculum-file">
<summary>src/main.ts</summary>

```ts file="src/main.ts"
// @source examples/todomvc/src/main.ts
```

</details>

<details class="curriculum-file">
<summary>Optional website embedding: src/preview.ts</summary>

The website preview imports the completed component and services directly from `examples/todomvc`, with the [private router described earlier](/explore/tutorial/route-the-filter#embed-the-app-with-a-private-router). The standalone app continues to use `src/main.ts`.

```ts file="src/preview.ts"
// @source examples/todo-9/src/preview.ts
```

</details>
