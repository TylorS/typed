---
slug: "create-a-todo"
title: "Create a Todo"
summary: "Coordinate one use case in the application layer."
order: 3
architecture: ["domain", "application"]
---

A submission should reject blank text, create one item, and clear the input only after accepting it. Add `RefArray` to the `@typed/fx` imports in `src/application.ts`, then write the action.

## Write the create action

```ts
// @source examples/todo-3/src/application.ts#L13-L20
// @expect export const createTodo
// @expect yield* RefArray.prepend
// @expect yield* RefSubject.set(TodoText, "")
```

Read it from top to bottom. `yield* TodoText` gets the current draft. Whitespace returns before calling the factory. The factory receives trimmed text, and its complete result enters the list before the draft is cleared.

That order protects the user's input: if creation fails, execution never reaches the clear. Generating the ID before insertion also gives the future row a stable key from its first render.

## Run the same action for every submission

`createTodo` is an Effect value. Defining it does not read the draft. Each run reads current state, so a form can run this same action repeatedly without capturing yesterday's text.

The action does not know about `SubmitEvent` or `HTMLInputElement`. In the next chapter, a native form will translate browser input into these state reads and writes.

**Trace three inputs:** spaces leave the list and draft alone; `  Learn Typed  ` adds `Learn Typed` and clears the draft; an unavailable factory leaves the original text for a retry. The final chapter tests all three cases against this action.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-3/src/application.ts
```

</details>
