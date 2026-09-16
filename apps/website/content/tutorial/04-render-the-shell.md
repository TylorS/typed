---
slug: "render-the-shell"
title: "Render the application shell"
summary: "Connect native input events to application Effects."
order: 4
demo: "todo-4"
architecture: ["domain", "application", "presentation"]
---

Type a title and press Enter. The input clears after creation; this partial preview does not reveal the list until the next chapter. Its header and event handlers are extracted from the actual TodoMVC presentation.

## Run this shell locally

Keep the Quick Start `index.html` and replace the files below. The infrastructure now supplies a router; install it alongside the standalone styles, then start Vite:

```sh
npm install --save-exact @typed/router@1.0.0-beta.11
npm install todomvc-app-css todomvc-common

npm run dev
```

## Read input events in src/presentation.ts

The handler records browser edits in the application draft.

```ts
// @source examples/todo-4/src/presentation.ts#L9-L10
// @expect const onInput
```

Changing the draft does not create a Todo.

## Create on Enter

The keyboard handler runs the create action when the user presses Enter.

```ts
// @source examples/todo-4/src/presentation.ts#L13-L14
// @expect const onNewTodoKeydown
```

The canonical input accepts Enter; blank drafts remain unchanged.

## Bind the input back to state

The live value follows the same draft and clears when the action succeeds.

```ts
// @source examples/todo-4/src/presentation.ts#L25-L28
// @expect .value=${App.TodoText}
```

The outer view is an `html` template. It does not allocate component-local state.

**Try it:** press Enter with only spaces, then with a title. Blank input leaves the draft unchanged; accepted input clears it. Rows arrive in the next chapter. If the visible text stays after successful creation, check `.value`.

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
<summary>Optional website embedding: src/preview.ts</summary>

The documentation uses this entrypoint to isolate its preview. Your standalone app starts from `src/main.ts`; it does not need `preview.ts`. The [filter chapter](/explore/tutorial/route-the-filter#embed-the-app-with-a-private-router) explains the difference.

```ts file="src/preview.ts"
// @source examples/todo-4/src/preview.ts
```

</details>

<details class="curriculum-file">
<summary>src/main.ts</summary>

```ts file="src/main.ts"
// @source examples/todo-4/src/main.ts
```

</details>

<details class="curriculum-file">
<summary>src/styles.css</summary>

```css file="src/styles.css"
// @source examples/todo-4/src/styles.css
```

</details>
