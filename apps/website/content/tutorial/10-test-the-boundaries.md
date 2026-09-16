---
slug: "test-the-boundaries"
title: "Prove the application works"
summary: "Test domain identity, application transitions, and real browser events using the code you built."
order: 10
demo: "todo-10"
architecture: ["domain", "application", "presentation", "infrastructure", "main"]
---

Test the three behaviors we relied on: IDs choose the right item, creation preserves rejected drafts, and editing preserves the right row. These tests import the application you just built.

## Keep the domain and application checks

The [domain test](/explore/tutorial/model-the-domain) already checks that toggling one ID preserves the other item's identity and leaves the input unchanged. The [creation test](/explore/tutorial/create-a-todo) checks blank rejection, successful insertion, and preserving the draft when the factory fails. Their complete files are included below.

The factory has no expected-error channel, so its failure test supplies a defect with `Effect.die`. That checks that failure neither partially commits nor loses the draft; it does not introduce a new expected rejection type.

## Test the real view in src/presentation.test.ts

The test mounts `TodoApp` with controlled services. Fork the renderer in the test Scope and await its first emission through a Deferred. The renderer stays subscribed while the test sends events:

```ts
// @source examples/todo-10/src/presentation.test.ts#L43-L50
// @expect const ready = yield* Deferred.make<void>();
// @expect yield* Deferred.await(ready);
```

The event helpers reproduce the events our handlers consume:

```ts
// @source examples/todo-10/src/presentation.test.ts#L34-L42
// @expect input.dispatchEvent(new Event("input"
// @expect new KeyboardEvent("keydown"
```

Changing `.value` alone would not notify the application. After the first submission, retain its row. Prepend another todo and check that the retained row merely moved:

```ts
// @source examples/todo-10/src/presentation.test.ts#L60-L72
// @expect const original = host.querySelector
// @expect toBe(original)
```

Now edit that row and press Escape:

```ts
// @source examples/todo-10/src/presentation.test.ts#L72-L80
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

The domain and application tests run without a DOM environment. The presentation file's first line selects Happy DOM. Use a real browser for focus, layout, and keyboard usability, and for the assembled create → edit → complete → filter → clear → reload flow. The completed preview uses the example's own storage key and service implementation.

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
// @source examples/todomvc/src/infrastructure.ts
```

</details>
