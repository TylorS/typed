---
slug: "test-the-boundaries"
title: "Prove the application works"
summary: "Test domain identity, application transitions, and real form events using the code you built."
order: 10
demo: "todo-10"
architecture: ["domain", "application", "presentation", "infrastructure", "main"]
---

Test the three behaviors we relied on: IDs choose the right item, creation preserves rejected drafts, and editing preserves the right row. These tests import the application you just built.

## Test identity in src/domain.test.ts

Start with matching titles and different IDs:

```ts
// @source examples/todo-10/src/domain.test.ts#L7-L13
// @expect const first = TodoId.make("first")
// @expect id: TodoId.make("second")
```

Toggle one ID and check the result and the unchanged input:

```ts
// @source examples/todo-10/src/domain.test.ts#L14-L18
// @expect const next = toggleCompleted(first)(todos)
// @expect expect(next[1]).toBe(todos[1])
```

The matching item changes, the input remains unchanged, and the other item keeps its object. The empty-list assertion records what happens when the ID is absent. No browser or state service is needed.

## Test creation in src/application.test.ts

Provide fresh application state for the test:

```ts
// @source examples/todo-10/src/application.test.ts#L9-L13
// @expect const model = Layer.mergeAll
// @expect App.TodoList.make([])
```

A deterministic factory counts calls and returns predictable IDs; its complete setup is below. First, prove whitespace never reaches it:

```ts
// @source examples/todo-10/src/application.test.ts#L29-L33
// @expect expect(calls).toBe(0)
// @expect expect(yield* App.TodoText).toBe("   ")
```

Then submit valid text and check the committed item before checking the cleared draft:

```ts
// @source examples/todo-10/src/application.test.ts#L35-L42
// @expect yield* RefSubject.set(App.TodoText, "  Learn Typed  ")
// @expect expect(yield* App.ActiveCount).toBe(1)
```

The second test makes the factory unavailable:

```ts
// @source examples/todo-10/src/application.test.ts#L48-L52
// @expect const exit = yield* Effect.exit(App.createTodo)
// @expect expect(yield* App.TodoText).toBe("Keep this draft")
```

Our factory has no expected-error channel, so this test supplies a defect with `Effect.die`. It verifies that a failed factory neither partially commits nor loses the draft. A remote factory should declare its expected rejection type and decide how the UI presents it.

## Test the real form in src/presentation.test.ts

The test mounts `TodoApp` with controlled services. A scoped renderer fiber stays subscribed during the test; a Deferred readiness signal waits for its first emission without ending it. Its helpers reproduce the events our handlers consume:

```ts
// @source examples/todo-10/src/presentation.test.ts#L29-L37
// @expect input.dispatchEvent(new Event("input"
// @expect new Event("submit"
```

Changing `.value` alone would not notify the application. After the first submission, retain its row. Prepend another todo and check that the retained row merely moved:

```ts
// @source examples/todo-10/src/presentation.test.ts#L49-L59
// @expect const original = host.querySelector
// @expect toBe(original)
```

Now edit that row and press Escape:

```ts
// @source examples/todo-10/src/presentation.test.ts#L61-L68
// @expect type(edit, "Uncommitted text")
// @expect key: "Escape"
// @expect toBe("Same title")
```

The editor disappears, its abandoned text never becomes committed text, and the same row remains. `vi.waitFor` waits for these observable results instead of guessing how long rendering takes. The full test uses an Effect Scope for renderer cleanup and `finally` to remove its host.

## Run the complete tests

Copy the three test files below into `src`, then run:

```sh
npm install --save-dev vitest happy-dom
npx vitest run src/domain.test.ts src/application.test.ts src/presentation.test.ts
```

The domain and application tests run without a DOM environment. The presentation file's first line selects Happy DOM. Use a real browser for focus, layout, and keyboard usability, and for the assembled create → edit → complete → filter → clear → reload flow. The preview above runs the chapter's own storage key.

Continue with [testing Typed systems](/explore/testing-typed-systems) for controlled time and lifetimes, or [building UI components](/explore/building-ui-components) for the same techniques applied to another interaction.

## Complete files

Keep the files from the previous step and replace or add these. Each full file is the source used by this milestone; the excerpts above select lines from it.

<details class="curriculum-file">
<summary>src/domain.test.ts</summary>

```ts file="src/domain.test.ts"
// @source examples/todo-10/src/domain.test.ts
```

</details>

<details class="curriculum-file">
<summary>src/application.test.ts</summary>

```ts file="src/application.test.ts"
// @source examples/todo-10/src/application.test.ts
```

</details>

<details class="curriculum-file">
<summary>src/presentation.test.ts</summary>

```ts file="src/presentation.test.ts"
// @source examples/todo-10/src/presentation.test.ts
```

</details>

<details class="curriculum-file">
<summary>src/infrastructure.ts</summary>

```ts file="src/infrastructure.ts"
// @source examples/todo-10/src/infrastructure.ts
```

</details>
