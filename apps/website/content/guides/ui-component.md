---
title: "Component: generators that return renderable values"
summary: "Understand zero-argument values, parameterized components, pipeline arguments, and E/R inference."
section: "UI / Foundations"
kind: "deep-dive"
order: 290
---

A component combines Effectful setup with renderable output. Use `component` when you need to acquire local state or services before returning a template, another component, text, a collection of renderables, or another supported Template input. It lifts the returned renderable into Fx; the generator does not need to return an Fx explicitly.

Read [your first template](/explore/render-your-first-template) and [Fx services and lifetime](/explore/fx-services-and-lifetime) first. The exported API is `component` from `@typed/ui/Component`. “Any renderable” describes the accepted result (`Renderable.Any`); it is not an `anyRenderable` helper to import.

## A component value and a component function

```ts
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";

const SessionNotice = html`<p>Your changes are saved locally until you publish.</p>`;

const SessionCounter = component(function* () {
  const count = yield* RefSubject.make(0);
  return html`<button onclick=${RefSubject.update(count, (n) => n + 1)}>
    Changes in this session: ${count}
  </button>`;
});

const ItemCounter = component(function* (label: string, initial: number) {
  const count = yield* RefSubject.make(initial);
  return html`<section aria-label=${label}>
    <p>${label}: ${count}</p>
    <button type="button" onclick=${RefSubject.update(count, (value) => value + 1)}>Add one</button>
  </section>`;
});

const inventorySummary = html`${SessionNotice}${SessionCounter}${ItemCounter("Stock items", 4)}`;
```

`SessionNotice` needs no generator: `html` already describes its output. `SessionCounter` allocates local state, so it uses `component`; its zero-argument generator produces an Fx value. `ItemCounter` is a function; calling it with its arguments produces an Fx. Both are lazy descriptions: setup runs when their output is observed/rendered. Each independent execution of `ItemCounter` owns its own count. Sharing the function does not share a singleton RefSubject.

The implementation distinguishes those forms using JavaScript `body.length`. Avoid a component signature whose only parameter has a default value or whose only parameter is a rest argument: those can have runtime length zero while appearing callable in TypeScript. Prefer one required options object and put defaults inside the generator. A component needing no arguments should be used as a value rather than called as a function.

## Return a renderable without erasing its channels

```ts
import { Effect } from "effect";
import { html, liftRenderableToFx, type Renderable } from "@typed/template";
import { component } from "@typed/ui/Component";

const LoadedNotice = component(function* <E, R>(
  load: Effect.Effect<string, E, R>,
  footer: Renderable<string, E, R>,
) {
  const message = yield* load;
  return html`<section><p role="status">${message}</p><footer>${liftRenderableToFx<E, R>(footer)}</footer></section>`;
});

const notice = LoadedNotice(Effect.succeed("Inventory refreshed"), "Review before publishing.");
```

The output combines `Effect.Error<Yield>` with `Renderable.Error<Result>`, and the corresponding service requirements. The rendered success type comes from `Renderable.Success<Result>`. Returning a string is valid; returning an arbitrary business object is not an instruction to stringify it. Format domain values explicitly.

The constructor does not catch errors or supply application services. A load failure remains in E until an owner handles it. State, renderer, and application services remain in R until provided at the correct boundary. This makes the component usable in browser or server renderers without hiding the resources it needs.

## Each execution owns a child Scope

Each execution forks the required parent Scope and provides that child to both the generator's
setup and its returned renderable. Scoped work started in setup and subscriptions in the template
therefore share one instance lifetime. Completion, failure, or interruption closes the child;
closing the parent closes every child. Siblings keep separate resources.

Returning a template does not end this lifetime at its first DOM emission: its subscription stays
active while mounted. Even a component returning a scalar requires a parent Scope. Use
`Effect.forkScoped` for ongoing work owned by the instance; provide longer-lived application
services outside the component when their work should survive it.

## Pipelines receive the original arguments

Pipeline callbacks receive the preceding output followed by the component arguments, as in `Fx.fn`. This supports per-instance instrumentation without closing over stale arguments.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { component } from "@typed/ui/Component";

const NamedPanel = component(
  function* (name: string, load: Effect.Effect<string>) {
    const description = yield* load;
    return html`<section aria-label=${name}><h2>${name}</h2><p>${description}</p></section>`;
  },
  (output, name) => output.pipe(Fx.tap(() => Effect.log(`Rendered panel: ${name}`))),
);
const ordersPanel = NamedPanel("Orders", Effect.succeed("Orders awaiting review"));
```

For a zero-argument generator, each pipeline receives only the output. Pipeline callbacks themselves run when the component value/function is constructed or called; put runtime side effects inside Fx/Effect operators as above. The generator body remains lazy. Use `Fx.fn` for generator-backed functions whose return already follows the Fx contract and which are not component constructors; use `Fx.gen` for plain reusable Fx programs.

## Debug construction separately from rendering

An “expression is not callable” error usually means a zero-argument component is being called. A missing service is not solved by casting R to `never`; provide it where its lifetime is owned. Repeated initial state means the component is being re-executed or remounted rather than receiving updates through one existing RefSubject. A ref that never runs may simply mean no DOM renderer observed the output.

Continue with [building UI components](/explore/building-ui-components) for a complete asynchronous save policy, [Dom](/explore/ui-dom) for host authoring, and [Storybook](/explore/ui-storybook) for scoped mounting. API: [Component.component](/reference/modules/%40typed%2Fui%2FComponent).
