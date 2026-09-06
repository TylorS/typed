---
id: "reactive-state"
title: "Add the counter"
summary: "Create the view, render it, and click its buttons."
order: 3
demo: "counter-reactive"
---

Create `src/Counter.ts`. The count is a `RefSubject`: the template observes its value, and the button Effects update it.

```ts file="src/Counter.ts"
// @source examples/learn-3/src/Counter.ts
```

Replace `src/main.ts` to render the counter into the page:

```ts file="src/main.ts"
// @source examples/learn-3/src/main.ts
```

Open the URL printed by Vite. Click **+**: the count changes from **0** to **1**. You have a running Typed application.
