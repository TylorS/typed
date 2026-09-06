---
slug: "application-state"
title: "Own application state"
summary: "Expose reactive capabilities instead of a browser-shaped controller."
order: 2
architecture: ["domain", "application"]
---

Name the two values the create form will need: committed todos and the text being typed. Add these contracts in `src/application.ts`.

## Name the application state

```ts
// @source examples/todo-2/src/application.ts#L1-L7
// @expect export class TodoList
// @expect export class TodoText
```

`TodoList` and `TodoText` name capabilities; declaring them does not allocate a global list or input. A Layer will supply their values when the application runs. The same action can then use empty state in the browser or prepared state in a test.

Keep the values separate: submitting text changes the list, but typing does not. Counts and filtered rows will be derived from that list later.

## Ask for a new Todo

```ts
// @source examples/todo-2/src/application.ts#L8-L11
// @expect export class CreateTodo
```

Creation needs an ID and a timestamp. `CreateTodo` lets the application ask for a complete Todo without choosing how those values are produced. Infrastructure can use browser crypto and a clock; a test can return predictable values.

The return type says creation is an Effect. Merely requesting the function does not run it. The next chapter will call it after checking the draft.

**Check your understanding:** if two independent applications provide different `TodoList` layers, do they share one global array? No: each provided state instance owns its own value. See [shared state contracts](/explore/shared-state-contracts) for the Layer mechanics.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/domain.ts</summary>

```ts file="src/domain.ts"
// @source examples/todo-2/src/domain.ts
```

</details>

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-2/src/application.ts
```

</details>
