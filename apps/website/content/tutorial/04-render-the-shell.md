---
slug: "render-the-shell"
title: "Render the application shell"
summary: "Connect native form events to application Effects."
order: 4
demo: "todo-4"
architecture: ["domain", "application", "presentation"]
---

Type a title in the preview and submit it. The input clears; rows arrive in the next chapter. This step connects the form to the create action we already wrote.

## Read input events in src/presentation.ts

```ts
// @source examples/todo-4/src/presentation.ts#L1-L8
// @expect const onInput
// @expect RefSubject.set(App.TodoText, event.target.value)
```

The handler reads the browser's latest value and writes it into `TodoText`. No Todo is created while typing.

## Bind the input back to state

```ts
// @source examples/todo-4/src/presentation.ts#L17-L24
// @expect .value=${App.TodoText}
// @expect oninput=${onInput}
```

`.value` updates the live input property. When `createTodo` clears the draft, the rendered input clears too. The HTML `value` attribute alone would not describe that ongoing relationship.

## Submit through the form

```ts
// @source examples/todo-4/src/presentation.ts#L13-L16
// @expect onsubmit=${EventHandler.make(() => App.createTodo, { preventDefault: true })}
```

The form runs `App.createTodo` and prevents a page navigation. Clicking Add todo and pressing Enter take the same path. The button is a native submit button:

```ts
// @source examples/todo-4/src/presentation.ts#L25-L26
// @expect <button type="submit"
```

The surrounding `TodoApp` is simply `html` followed by a template literal. It binds existing state and actions, so no generator or `component()` wrapper is needed. Open the complete presentation file below to see the surrounding section and header.

**Try it:** submit spaces, then a title with spaces around it. Blank input stays available for correction; accepted input clears. If Enter reloads the page, check `preventDefault`. If the visible text stays after a successful submission, check `.value`.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/presentation.ts</summary>

```ts file="src/presentation.ts"
// @source examples/todo-4/src/presentation.ts
```

</details>

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-4/src/application.ts
```

</details>

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todo-4/src/infrastructure.ts
```

</details>

<details class="curriculum-file">
<summary>src/preview.ts</summary>

```ts file="src/preview.ts"
// @source examples/todo-4/src/preview.ts
```

</details>
