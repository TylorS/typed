---
title: "Dom: types, events, props, refs, and host rendering"
summary: "Preserve a component contract while extending its real DOM host."
section: "UI / Foundations"
kind: "deep-dive"
order: 295
---

A styled wrapper should not accidentally remove a button's keyboard behavior, a dialog's native synchronization, or an item's registration. `@typed/ui/Dom` is the shared contract that keeps these concerns attached to the real element while allowing caller props and custom renderers.

Prerequisites: [Component](/explore/ui-component), [template bindings](/explore/template-element-bindings), and [mounting DOM output](/explore/mounting-dom-output). Applications normally use a UI family's host argument. Library authors use these helpers when implementing a new public host.

## Types

`Dom/Types` defines `HostOptions<Element>`, `HostProps<Element>`, `HostRenderer`, and `HostOverride`. Options carry caller `props`, refs, and typed event handlers. Host props cover template attributes and element-specific bindings; `HostPropsForTag`, `OptionsForTag`, and `HostRendererForTag` specialize by tag name. These types describe what can reach a host, not a runtime schema validating arbitrary data.

A custom host receives the already-composed props and content. `HostResult` accepts an Fx or Effect of RenderEvent. Unlike a general component, this host boundary does not accept an arbitrary string as its final result: it represents actual rendered host output. `HostComponent<Inputs>` retains renderable error/service channels and adds Scope and RenderTemplate.

```ts
import { Effect } from "effect";
import { html } from "@typed/template";
import * as Button from "@typed/ui/Button";

const PublishButton = Button.Button(
  {
    content: "Publish report",
    props: { class: "action-primary", "data-command": "publish" },
    onclick: Effect.log("Publish requested"),
  },
  (props, content) => html`<button ...${props}><span class="action-label">${content}</span></button>`,
);
```

The outer button receives all semantics, events, and refs. The span is only presentation. Moving the spread to the span would move behavior away from the interactive element even though the visual result could look identical.

## Events

`Dom/Events.chainEvent(user, internal)` composes real EventHandlers or Effects. The user handler runs before the internal Effect, and a prevented default skips the internal behavior. Each handler retains its own once and AbortSignal state; capture/passive options are merged, with non-passive behavior required when prevention is requested. The result combines both E and R channels.

```ts
import { Effect } from "effect";
import { EventHandler, html } from "@typed/template";
import * as Dom from "@typed/ui/Dom";

const inspectAndSave = Dom.chainEvent(
  EventHandler.make((event: MouseEvent) => {
    const button = Dom.currentTarget<HTMLButtonElement>(event);
    if (button.dataset["locked"] === "true") event.preventDefault();
    return Effect.log(`Attempted ${button.textContent}`);
  }),
  Effect.log("Accepted save"),
);
const save = html`<button type="button" data-locked="false" onclick=${inspectAndSave}>Save</button>`;
```

`currentTarget` throws when read outside event handling. Capture the needed target/value before asynchronous boundaries. Cancel the browser default synchronously; preventing after an awaited network request is too late for the browser even if a later internal Effect can still be skipped. `toggleState` returns `open`, `closed`, or undefined by checking `newState`; it does not infer state from any event named toggle. `isEventKey` recognizes `on...` and `@...` keys for composition.

## Props

`Dom/Props.mergeProps(user, internal)` gives internal ordinary props precedence, chains event handlers, and composes refs. It is not object-spread-last-wins for everything. Internally disabled activation suppresses user click handlers for the recognized disabled markers; a native family supplies the rest of its disabled behavior.

`renderHost` first merges `options.props` with top-level forwarded events/ref, then merges internal props. `forwardHostProps` forwards only events and ref from the options object; arbitrary top-level component inputs are not leaked as HTML attributes. Put class, data attributes, and ordinary host attributes inside `props`.

`makeInternalPropsHelpers(options).property(key, fallback)` uses the fallback for null or undefined. False, zero, and empty string remain intentional values. The associated `MergedHostProps`, `HostOptionProps`, and `RenderHostProps` preserve those relationships at the type level. A named component option such as `tabIndex` should control an internal tabindex rather than a competing raw prop.

## Refs

`Dom/Refs.composeRefs(first, second)` runs the first ref before the second and combines their error/service requirements. Ref results that are Effects, Streams, or Fx are executed/drained; ordinary return values are ignored. A long-running first ref can therefore block the second: fork ongoing observation into the scoped lifetime when that is the intended behavior.

```ts
import { Effect } from "effect";
import { EventHandler, html } from "@typed/template";
import { component } from "@typed/ui/Component";
import * as Dom from "@typed/ui/Dom";
import * as Disclosure from "@typed/ui/Disclosure";
import * as NativeDetails from "@typed/ui/NativeDetails";

const RestorableDetails = component(function* () {
  const state = yield* Disclosure.makeState();
  const ref = Dom.composeRefs(state, Dom.composeRefs(
    NativeDetails.ref(state),
    (element: HTMLDetailsElement) => Effect.log(`Mounted details: ${element.id}`),
  ));
  const toggle = EventHandler.make((event: Event) =>
    Disclosure.setOpen(state, Dom.currentTarget<HTMLDetailsElement>(event).open));
  return html`<details id="restorable-details" ref=${ref} ontoggle=${toggle}>
    <summary>Inspection notes</summary><p>Read these before approving the report.</p>
  </details>`;
});
```

The native toggle handler completes the two-way synchronization; `Disclosure.Content` normally assembles both directions for you. Only one hydration ref may own an element. Composing two owners throws a TypeError, including when they are hidden inside earlier compositions. The composed ref retains the single owner's hydration protocol; wrapping a hydrated ref in an ordinary callback can lose that protocol.

Ref lifetime is the render Scope in which it runs. A ref integrating a resource should acquire it with a finalizer in that Scope; returning a plain cleanup function is not the same contract as a React callback ref. [NativeDetails](/explore/ui-native-details), [NativeDialog](/explore/ui-native-dialog), and [NativePopover](/explore/ui-native-popover) show scoped observers.

## Render

`Dom/Render.renderHost<Element>()` accepts options, optional host, an internal-props builder, content, and a fallback renderer. It merges props, chooses the host, then lifts an Effect result to Fx. `renderDivHost` is the smaller direct div renderer. Neither helper chooses an accessibility pattern for you.

```ts
import { html } from "@typed/template";
import * as Dom from "@typed/ui/Dom";

const summary = Dom.renderHost<HTMLDivElement>()(
  { props: { class: "summary" } },
  undefined,
  () => ({ role: "note" as const }),
  "Exports include only visible columns.",
  (props, content) => html`<div ...${props}>${content}</div>`,
);
```

Prop construction and host invocation happen synchronously when this helper is called. Keep acquisition inside Effects or refs; merely returning an Fx does not retroactively defer arbitrary JavaScript side effects performed while constructing it. Renderer execution owns the DOM bindings and cleanup.

## Check contract preservation at the element

When a custom host breaks, inspect the real element first: its tag, complete spread, internal attributes, listener target, ref, and hydration marker. Then inspect ordering: did a user handler prevent default, or did an earlier ref never complete? Test the observable behavior—activation, native state, focus, and cleanup—not only class names.

Read the exact APIs in [Dom/Types](/reference/modules/%40typed%2Fui%2FDom%2FTypes), [Dom/Events](/reference/modules/%40typed%2Fui%2FDom%2FEvents), [Dom/Props](/reference/modules/%40typed%2Fui%2FDom%2FProps), [Dom/Refs](/reference/modules/%40typed%2Fui%2FDom%2FRefs), and [Dom/Render](/reference/modules/%40typed%2Fui%2FDom%2FRender). Continue with [building UI components](/explore/building-ui-components) to combine the pieces around a public application contract.
