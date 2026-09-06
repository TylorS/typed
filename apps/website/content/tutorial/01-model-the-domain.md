---
slug: "model-the-domain"
title: "Model the domain"
summary: "Define valid Todo values and keep list transformations pure."
order: 1
architecture: ["domain"]
---

Two todos can have the same title. Give each one an ID so editing, moving, or deleting one never selects the other.

## Describe a Todo in src/domain.ts

```ts
// @source examples/todo-1/src/domain.ts#L1-L15
// @expect export const TodoId
// @expect export const Todo =
// @expect export const TodoList
```

`TodoId` brands a string: TypeScript can distinguish an ID from a title. `Todo` describes the fields we accept, and its inferred type keeps the runtime schema and TypeScript model together. The timestamp codec reads a string into a UTC value; we will use it when loading saved data.

Keep committed text here. An unfinished edit belongs to the row, because cancelling it should leave this value alone.

## Find an item by ID

```ts
// @source examples/todo-1/src/domain.ts#L20-L26
// @expect export const updateTodo
// @expect export const editText
```

`updateTodo` returns a new array, changing only the matching item. Items with other IDs keep their object identity. `editText` supplies the particular change without repeating the lookup.

## Give another action the same rule

```ts
// @source examples/todo-1/src/domain.ts#L32-L40
// @expect export const toggleCompleted
// @expect export const deleteTodo
```

Toggling changes one completion flag. Deleting removes one ID. Neither function needs a DOM, a state container, or a browser event, so both are easy to test with ordinary values.

**Check your understanding:** make two todos with identical text and different IDs. Toggle one. Which item should change, and which object should remain the same? We will turn this into a test in the final chapter.

The full file also includes the count and filter helpers we will introduce when their controls appear. Next, give the application a place to hold the current list.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/domain.ts</summary>

```ts file="src/domain.ts"
// @source examples/todo-1/src/domain.ts
```

</details>
