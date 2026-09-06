---
id: "hydrate-state"
title: "Hydrate state and adopt the DOM"
summary: "Serialize Schema-checked state on the server and restore it before live parts run."
order: 6
demo: "counter-hydrated"
---

Start with the working server from [the server rendering lesson](/explore/counter/server-html). Suppose the server knows the count is seven, while a fresh browser would start at zero. Replace `RefSubject.make` with `RefSubject.hydrate` in `Counter.ts`:

```ts
// @source examples/learn-6/src/Counter.ts#L6-L11
// @expect const count = yield* RefSubject.hydrate(
// @expect Schema.Finite
// @expect typeof document === "undefined" ? 7 : 0
```

`Schema.Finite` checks the transferred value. The server serializes its state; the browser restores it before live bindings run. The environment check makes the differing initializers visible in this small example.

Attach the subject to an element with `ref=${count}`. This carries the state handoff:

```ts
// @source examples/learn-6/src/Counter.ts#L13-L20
// @expect <section class="counter-demo" aria-label="Counter" ref=${count}>
// @expect <output aria-live="polite">${count}</output>
```

This version keeps just the controls so you can watch the restored count. Server and browser use this same template. The server document, development runner, and browser entry from the previous lesson stay the same.

Replace `src/Counter.ts` with the complete file and reload `http://127.0.0.1:5174`. The count should start at **7**; click **Increase** to reach **8**. The preview below uses this exact component and the same state handoff.

### Complete files

<details class="curriculum-file">
<summary>src/Counter.ts</summary>

```ts file="src/Counter.ts"
// @source examples/learn-6/src/Counter.ts
```

</details>

<details class="curriculum-file">
<summary>src/client.ts</summary>

```ts file="src/client.ts"
// @source examples/learn-6/src/client.ts
```

</details>

Try changing the server initializer to twelve. Reload and check that the first click produces **13**. If the count resets to zero, inspect the response's state marker, the `ref` attachment, and the matching `#app` mount target.

Continue with [hydrating Typed HTML](/explore/hydrating-typed-html), or build the client-only [TodoMVC tutorial](/explore/tutorial) to practice application boundaries.
