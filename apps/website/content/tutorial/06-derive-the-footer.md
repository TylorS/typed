---
slug: "derive-the-footer"
title: "Derive the footer"
summary: "Compute counts and conditional controls from the model."
order: 6
demo: "todo-6"
architecture: ["domain", "application", "presentation"]
---

Complete one of two items in the preview. The count should become one, and Clear completed should appear. Both follow the list without a second mutable counter.

## Derive the answers in src/application.ts

```ts
// @source examples/todo-6/src/application.ts#L32-L45
// @expect export const ActiveCount
```

Every creation, deletion, and toggle changes `TodoList`. These read views recompute from that authority, so actions do not also have to maintain counts and flags.

## Render the count in src/presentation.ts

```ts
// @source examples/todo-6/src/presentation.ts#L105-L106
// @expect <span class="todo-count"
```

The number and its singular or plural label are both live values. The count means active items in the whole list; adding a filter later should not change that meaning.

## Show a control only when it can act

```ts
// @source examples/todo-6/src/presentation.ts#L107-L116
// @expect ${Fx.if(App.SomeAreCompleted
```

After the last completed item is cleared, the button and its event binding disappear together. The action changes the list; the condition handles its presentation.

## Handle the empty list

The empty list deserves a deliberate rule in `src/domain.ts`:

```ts
// @source examples/todo-6/src/domain.ts#L67-L69
// @expect export function allAreCompleted
```

`every` alone would report true for an empty array. The nonempty check keeps Mark all complete unchecked when there are no items. Toggling all completes every item if any is active; otherwise it reopens them.

The main section and footer also follow the canonical non-empty condition. The named `HasTodos` view suppresses repeated boolean values.

```ts
// @source examples/todo-6/src/presentation.ts#L9-L9
// @expect const HasTodos
```

```ts
// @source examples/todo-6/src/presentation.ts#L90-L91
// @expect ${Fx.if(HasTodos
```

**Try it:** clear one completed item, complete the remaining item, then toggle all. Check the count, clear button, and checkbox after each action. A stale count suggests a separate mutable counter or a one-time read where you intended a live view.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/application.ts</summary>

```ts file="src/application.ts"
// @source examples/todo-6/src/application.ts
```

</details>

<details class="curriculum-file">
<summary>src/presentation.ts</summary>

```ts file="src/presentation.ts"
// @source examples/todo-6/src/presentation.ts
```

</details>

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todo-6/src/infrastructure.ts
```

</details>

<details class="curriculum-file">
<summary>src/preview.ts</summary>

```ts file="src/preview.ts"
// @source examples/todo-6/src/preview.ts
```

</details>
