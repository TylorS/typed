---
slug: "persist-the-list"
title: "Persist the list"
summary: "Observe application state from a local-storage adapter."
order: 8
demo: "todo-8"
architecture: ["domain", "application", "infrastructure"]
---

Create an item and reload this page. It should return. We will load the initial list from storage and observe later changes, without changing the create or edit actions.

## Decode storage in src/infrastructure.ts

```ts
// @source examples/todo-8/src/infrastructure.ts#L7-L12
// @expect const TODOS_STORAGE_KEY
// @expect const TodoListJson
// @expect const decodeTodoList
// @expect const encodeTodoList
```

Storage holds a string. This codec checks the Todo fields and converts timestamps between stored strings and domain values; `JSON.parse` alone would not establish that contract.

The `Todos` service exposes load and save. Its local implementation handles the browser boundary:

```ts
// @source examples/todo-8/src/infrastructure.ts#L35-L45
// @expect static readonly local
// @expect localStorage.getItem
// @expect localStorage.setItem
```

No saved string means an empty list. Browser operations and codec work stay inside Effects, where the adapter can handle failure.

## Choose the load-failure policy

```ts
// @source examples/todo-8/src/infrastructure.ts#L21-L24
// @expect static readonly get
// @expect Effect.catchCause
```

This small example falls back to an empty list for invalid data or unavailable storage. That is a product choice: it can overwrite corrupt data with a later save. An application that must recover records should retain the original string and show a warning instead.

## Initialize before observing

```ts
// @source examples/todo-8/src/infrastructure.ts#L56-L61
// @expect App.TodoList.make(Todos.get)
```

The subject starts from the decoded load result, rather than publishing an empty default while loading. Its observer then persists the current value and subsequent changes:

```ts
// @source examples/todo-8/src/infrastructure.ts#L33-L33
// @expect static readonly replicateToStorage
// @expect Fx.observeLayer(Todos.set)
```

`Todos.set` logs write failures and leaves the in-memory app usable. Load failure and save failure have different consequences; do not hide either in a button handler.

**Try it:** create and complete an item, reload, and switch filters. Committed todos persist; an unfinished input does not. Inspect `@typed/tutorial/todo-8` in browser storage to see the encoded value. If valid data disappears, check decoding and initialization before changing the renderer.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todo-8/src/infrastructure.ts
```

</details>

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-8/src/application.ts
```

</details>

<details class="curriculum-file">
<summary>src/presentation.ts</summary>

```ts file="src/presentation.ts"
// @source examples/todo-8/src/presentation.ts
```

</details>

<details class="curriculum-file">
<summary>src/preview.ts</summary>

```ts file="src/preview.ts"
// @source examples/todo-8/src/preview.ts
```

</details>
