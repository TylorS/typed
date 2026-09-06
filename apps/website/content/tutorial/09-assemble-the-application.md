---
slug: "assemble-the-application"
title: "Assemble the application"
summary: "Join presentation, infrastructure, and the DOM renderer in one composition root."
order: 9
demo: "todo-9"
architecture: ["domain", "application", "presentation", "infrastructure", "main"]
---

The modules describe an application. `src/main.ts` chooses its services, host, renderer, and running lifetime.

## Import the outer pieces

```ts
// @source examples/todo-9/src/main.ts#L1-L5
// @expect import { Services }
// @expect import { TodoApp }
```

Presentation depends on application contracts, while infrastructure implements those contracts. The entrypoint may know both because connecting them is its job.

## Start the application

```ts
// @source examples/todo-9/src/main.ts#L7-L12
// @expect await render(TodoApp, document.body).pipe
// @expect Layer.provide([Services, DomRenderTemplate])
```

Read the pipeline in order:

1. `render` describes mounting `TodoApp` into the chosen host.
2. `Fx.drainLayer` gives the running render stream a Layer lifetime.
3. `Layer.provide` supplies application services and the DOM renderer.
4. `Layer.launch` keeps the application running, and `Effect.runPromise` starts it from the JavaScript entrypoint.

Keep mounting here. Importing `TodoApp` in a test should not start a second application.

## Compare the embedded entry

```ts
// @source examples/todo-9/src/preview.ts#L1-L7
// @expect ServerRouter
// @expect makeServices
```

The preview imports the same component and service implementation. It selects a private router because its filters belong to the embedded app. Your browser entry uses the browser router.

**Try the complete flow:** create two todos, save an edit, complete that item, select Completed, clear it, return to All, then reload. The other item should remain. Missing-service types point to assembly; duplicate event handling can indicate that the same host was mounted twice without closing the first lifetime.

The complete files below are a checkpoint if you joined midway. Next, turn the identity and state guarantees into tests of these actual modules.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/domain.ts</summary>

```ts file="src/domain.ts"
// @source examples/todo-9/src/domain.ts
```

</details>

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-9/src/application.ts
```

</details>

<details class="curriculum-file">
<summary>src/presentation.ts</summary>

```ts file="src/presentation.ts"
// @source examples/todo-9/src/presentation.ts
```

</details>

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todo-9/src/infrastructure.ts
```

</details>

<details class="curriculum-file">
<summary>src/main.ts</summary>

```ts file="src/main.ts"
// @source examples/todo-9/src/main.ts
```

</details>

<details class="curriculum-file">
<summary>src/preview.ts</summary>

```ts file="src/preview.ts"
// @source examples/todo-9/src/preview.ts
```

</details>
