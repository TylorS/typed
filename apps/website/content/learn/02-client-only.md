---
id: "client-only"
title: "Render client-only markup"
summary: "Describe the view as a Typed template, then choose the DOM renderer at the edge."
order: 2
---

This smaller version of the [Quick Start counter](/explore/quick-start) explains how a template reaches the DOM. Start with a fixed zero. In `src/main.ts`, `html` describes the view:

```ts
// @source examples/learn-2/src/main.ts#L5-L9
// @expect const Counter = html
// @expect <output>0</output>
```

This view needs no state or component generator. To display it, render into `document.body` and supply the DOM renderer:

```ts
// @source examples/learn-2/src/main.ts#L11-L16
// @expect await render(Counter, document.body).pipe(
// @expect Layer.provide(DomRenderTemplate)
```

`Fx.drainLayer` runs the render stream for the lifetime of the layer. `Layer.launch` keeps it running; `Effect.runPromise` starts it from JavaScript. Keep this launch at the application entrypoint.

Replace `src/main.ts` with the complete file below. Open Vite's local URL: you should see **Counter** and **0**, with no buttons yet.

### Complete file

<details class="curriculum-file">
<summary>src/main.ts</summary>

```ts file="src/main.ts"
// @source examples/learn-2/src/main.ts
```

</details>

The [Quick Start counter](/explore/quick-start#reactive-state) adds state to this render pipeline. See [mounting DOM output](/explore/mounting-dom-output) for host ownership and teardown.
