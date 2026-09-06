---
slug: "render-keyed-items"
title: "Render keyed Todo items"
summary: "Preserve item identity while editing, toggling, and deleting."
order: 5
demo: "todo-5"
architecture: ["domain", "application", "presentation"]
---

Create two items, edit one, then press Escape. The label should keep its original text. We need stable rows and a separate draft to make that work.

## Give each row its ID

In `src/presentation.ts`, the list delegates each item to `TodoItem`:

```ts
// @source examples/todo-5/src/presentation.ts#L98-L102
// @expect ${many(App.TodoList, (todo) => todo.id, TodoItem)}
```

`many` matches rows by Todo ID. Prepending another item can move an existing row without recreating it. Titles and array positions cannot make that promise.

## Allocate state inside the row

```ts
// @source examples/todo-5/src/presentation.ts#L8-L13
// @expect const TodoItem = component
// @expect const editing =
// @expect const draft =
```

Here `component()` earns its place: each mounted row needs its own editing flag and draft. `text` and `completed` are read views of its Todo. The outer `TodoApp` remains a direct `html` template because it allocates nothing.

## Begin, cancel, and save

```ts
// @source examples/todo-5/src/presentation.ts#L14-L23
// @expect const begin =
// @expect const cancel =
// @expect const save =
```

Beginning copies committed text into the draft. Cancelling only hides the editor. Saving sends the draft to `App.editTodo` before closing it. Typing into committed text directly would leave nothing for Cancel to preserve.

The application action trims saved text and deletes a Todo when that text is blank. That policy stays outside the row's browser handlers.

## Bind the editor to the draft

```ts
// @source examples/todo-5/src/presentation.ts#L29-L40
// @expect .value=${draft}
// @expect event.key === "Escape"
// @expect <button type="submit">Save</button>
```

`Fx.if(editing, …)` selects this editor or the ordinary label and controls. Enter submits its form; Escape and Cancel discard the draft. Edit is also a button, so double-clicking the label is not the only way to begin.

**Try it:** keep one row in edit mode while adding another above it. Then cancel, edit again, and save. If rows share drafts, check where those subjects were allocated and whether IDs are unique. Removing or filtering out a row ends its rendered lifetime; an unfinished draft is not persisted application data.

Continue with [keyed collections](/explore/keyed-template-collections) for the identity mechanism. Next, derive the footer from the same list.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/domain.ts</summary>

```ts file="src/domain.ts"
// @source examples/todo-5/src/domain.ts
```

</details>

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-5/src/application.ts
```

</details>

<details class="curriculum-file">
<summary>src/presentation.ts</summary>

```ts file="src/presentation.ts"
// @source examples/todo-5/src/presentation.ts
```

</details>

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todo-5/src/infrastructure.ts
```

</details>

<details class="curriculum-file">
<summary>src/preview.ts</summary>

```ts file="src/preview.ts"
// @source examples/todo-5/src/preview.ts
```

</details>
