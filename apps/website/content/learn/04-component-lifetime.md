---
id: "component-lifetime"
title: "Derive a value without duplicating state"
summary: "Compute a second view of the count and follow both bindings through the component's lifetime."
order: 4
demo: "counter-component"
---

Start from the [Quick Start counter](/explore/quick-start) and add a value computed from the count. Inside `Counter`, map the subject:

```ts
// @source examples/learn-4/src/Counter.ts#L5-L9
// @expect const count = yield* RefSubject.make(0);
// @expect const doubled = RefSubject.map(count, (value) => value * 2);
```

`doubled` observes the count. There is no second mutable value to keep in sync, and the button handlers stay the same. Display it below the controls:

```ts
// @source examples/learn-4/src/Counter.ts#L18-L18
// @expect <p>Twice the count: ${doubled}</p>
```

Each run of `component` forks its parent's Scope. That child owns both the generator's setup and the returned template's subscriptions and event listeners. When the run ends or its parent closes, those resources are released together; another mounted counter has its own child Scope.

Replace only `src/Counter.ts`. This version also spells out the button labels as **Decrease** and **Increase**. Click Increase twice: the count should be **2** and the doubled value **4**.

### Complete file

<details class="curriculum-file">
<summary>src/Counter.ts</summary>

```ts file="src/Counter.ts"
// @source examples/learn-4/src/Counter.ts
```

</details>

Try adding a derived sentence that distinguishes zero, one, and several clicks. Continue with [building UI components](/explore/building-ui-components) and [Fx services and lifetime](/explore/fx-services-and-lifetime) for component parameters and shared state.
